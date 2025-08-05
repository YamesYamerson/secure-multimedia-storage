import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../src/backend'))

from upload import (
    handler, validate_file, generate_file_id, create_signed_url,
    store_file_metadata, verify_token, handle_get_upload_url,
    handle_complete_upload, handle_get_download_url
)

class TestUploadHandler:
    """Test suite for upload handler Lambda function"""
    
    @pytest.fixture
    def mock_event(self):
        """Mock API Gateway event"""
        return {
            'httpMethod': 'POST',
            'headers': {
                'Authorization': 'Bearer valid_token_123',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'operation': 'get_upload_url',
                'file_info': {
                    'name': 'test.jpg',
                    'size': 1024,
                    'type': 'image/jpeg'
                },
                'metadata': {
                    'title': 'Test Image',
                    'description': 'A test image',
                    'tags': ['test', 'image']
                }
            })
        }
    
    @pytest.fixture
    def mock_context(self):
        """Mock Lambda context"""
        context = Mock()
        context.function_name = 'upload_handler'
        context.function_version = '$LATEST'
        context.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:upload_handler'
        context.memory_limit_in_mb = 128
        context.remaining_time_in_millis = lambda: 30000
        return context
    
    @pytest.fixture
    def mock_user_info(self):
        """Mock user information"""
        return {
            'user_id': 'test_user_123',
            'username': 'testuser',
            'attributes': {
                'email': 'test@example.com',
                'name': 'Test User'
            }
        }

    def test_handler_options_request(self, mock_context):
        """Test OPTIONS request handling"""
        event = {'httpMethod': 'OPTIONS'}
        response = handler(event, mock_context)
        
        assert response['statusCode'] == 200
        assert 'Access-Control-Allow-Origin' in response['headers']
        assert 'Access-Control-Allow-Methods' in response['headers']

    def test_handler_missing_auth_header(self, mock_context):
        """Test handler with missing authorization header"""
        event = {
            'httpMethod': 'POST',
            'headers': {},
            'body': '{}'
        }
        response = handler(event, mock_context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body

    def test_handler_invalid_auth_header(self, mock_context):
        """Test handler with invalid authorization header format"""
        event = {
            'httpMethod': 'POST',
            'headers': {'Authorization': 'InvalidFormat'},
            'body': '{}'
        }
        response = handler(event, mock_context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('upload.verify_token')
    def test_handler_invalid_token(self, mock_verify_token, mock_event, mock_context):
        """Test handler with invalid token"""
        mock_verify_token.return_value = None
        
        response = handler(mock_event, mock_context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('upload.verify_token')
    def test_handler_invalid_json(self, mock_verify_token, mock_context):
        """Test handler with invalid JSON body"""
        mock_verify_token.return_value = {'user_id': 'test_user'}
        
        event = {
            'httpMethod': 'POST',
            'headers': {'Authorization': 'Bearer valid_token'},
            'body': 'invalid json'
        }
        response = handler(event, mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('upload.verify_token')
    def test_handler_invalid_operation(self, mock_verify_token, mock_context):
        """Test handler with invalid operation"""
        mock_verify_token.return_value = {'user_id': 'test_user'}
        
        event = {
            'httpMethod': 'POST',
            'headers': {'Authorization': 'Bearer valid_token'},
            'body': json.dumps({'operation': 'invalid_operation'})
        }
        response = handler(event, mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

class TestFileValidation:
    """Test suite for file validation functions"""
    
    def test_validate_file_valid_image(self):
        """Test validation of valid image file"""
        file_info = {
            'name': 'test.jpg',
            'size': 1024,
            'type': 'image/jpeg'
        }
        errors = validate_file(file_info)
        assert len(errors) == 0

    def test_validate_file_valid_document(self):
        """Test validation of valid document file"""
        file_info = {
            'name': 'document.pdf',
            'size': 2048,
            'type': 'application/pdf'
        }
        errors = validate_file(file_info)
        assert len(errors) == 0

    def test_validate_file_valid_video(self):
        """Test validation of valid video file"""
        file_info = {
            'name': 'video.mp4',
            'size': 1048576,  # 1MB
            'type': 'video/mp4'
        }
        errors = validate_file(file_info)
        assert len(errors) == 0

    def test_validate_file_too_large(self):
        """Test validation of file exceeding size limit"""
        file_info = {
            'name': 'large_file.jpg',
            'size': 200 * 1024 * 1024,  # 200MB
            'type': 'image/jpeg'
        }
        errors = validate_file(file_info)
        assert len(errors) > 0
        assert any('size exceeds maximum limit' in error for error in errors)

    def test_validate_file_invalid_extension(self):
        """Test validation of file with invalid extension"""
        file_info = {
            'name': 'script.exe',
            'size': 1024,
            'type': 'application/octet-stream'
        }
        errors = validate_file(file_info)
        assert len(errors) > 0
        assert any('not allowed' in error for error in errors)

    def test_validate_file_empty_filename(self):
        """Test validation of file with empty filename"""
        file_info = {
            'name': '',
            'size': 1024,
            'type': 'image/jpeg'
        }
        errors = validate_file(file_info)
        assert len(errors) > 0
        assert any('Invalid filename' in error for error in errors)

    def test_validate_file_long_filename(self):
        """Test validation of file with filename too long"""
        file_info = {
            'name': 'a' * 300,  # 300 character filename
            'size': 1024,
            'type': 'image/jpeg'
        }
        errors = validate_file(file_info)
        assert len(errors) > 0
        assert any('Invalid filename' in error for error in errors)

class TestFileIDGeneration:
    """Test suite for file ID generation"""
    
    def test_generate_file_id(self):
        """Test file ID generation"""
        user_id = 'test_user_123'
        filename = 'test.jpg'
        
        file_id = generate_file_id(user_id, filename)
        
        assert file_id.startswith(user_id)
        assert '_' in file_id
        assert len(file_id) > len(user_id) + 8  # Should have additional hash (8 chars)

    def test_generate_file_id_unique(self):
        """Test that generated file IDs are unique"""
        user_id = 'test_user_123'
        filename = 'test.jpg'
        
        file_id1 = generate_file_id(user_id, filename)
        file_id2 = generate_file_id(user_id, filename)
        
        assert file_id1 != file_id2

class TestSignedURLGeneration:
    """Test suite for signed URL generation"""
    
    @patch('upload.s3_client')
    def test_create_signed_url_upload(self, mock_s3_client):
        """Test signed URL generation for upload"""
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.amazonaws.com/test-bucket/test-key'
        
        url = create_signed_url('file_123', 'test.jpg', 'user_123', 'put_object')
        
        assert url is not None
        mock_s3_client.generate_presigned_url.assert_called_once()

    @patch('upload.s3_client')
    def test_create_signed_url_download(self, mock_s3_client):
        """Test signed URL generation for download"""
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.amazonaws.com/test-bucket/test-key'
        
        url = create_signed_url('file_123', 'test.jpg', 'user_123', 'get_object')
        
        assert url is not None
        mock_s3_client.generate_presigned_url.assert_called_once()

    @patch('upload.s3_client')
    def test_create_signed_url_error(self, mock_s3_client):
        """Test signed URL generation error handling"""
        mock_s3_client.generate_presigned_url.side_effect = Exception('S3 error')
        
        url = create_signed_url('file_123', 'test.jpg', 'user_123', 'put_object')
        
        assert url is None

class TestMetadataStorage:
    """Test suite for metadata storage"""
    
    @patch('upload.dynamodb')
    def test_store_file_metadata_success(self, mock_dynamodb):
        """Test successful metadata storage"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        file_id = 'file_123'
        user_id = 'user_123'
        filename = 'test.jpg'
        file_info = {'size': 1024, 'type': 'image/jpeg'}
        metadata = {'title': 'Test', 'description': 'Test desc', 'tags': ['test']}
        
        result = store_file_metadata(file_id, user_id, filename, file_info, metadata)
        
        assert result is True
        mock_table.put_item.assert_called_once()

    @patch('upload.dynamodb')
    def test_store_file_metadata_error(self, mock_dynamodb):
        """Test metadata storage error handling"""
        mock_table = Mock()
        mock_table.put_item.side_effect = Exception('DynamoDB error')
        mock_dynamodb.Table.return_value = mock_table
        
        result = store_file_metadata('file_123', 'user_123', 'test.jpg', {}, {})
        
        assert result is False

class TestUploadOperations:
    """Test suite for upload operation handlers"""
    
    @patch('upload.verify_token')
    @patch('upload.validate_file')
    @patch('upload.generate_file_id')
    @patch('upload.create_signed_url')
    @patch('upload.store_file_metadata')
    def test_handle_get_upload_url_success(self, mock_store_metadata, mock_create_url, 
                                         mock_generate_id, mock_validate, mock_verify_token):
        """Test successful upload URL generation"""
        mock_verify_token.return_value = {'user_id': 'test_user'}
        mock_validate.return_value = []
        mock_generate_id.return_value = 'file_123'
        mock_create_url.return_value = 'https://s3.amazonaws.com/test-bucket/test-key'
        mock_store_metadata.return_value = True
        
        body = {
            'file_info': {'name': 'test.jpg', 'size': 1024},
            'metadata': {'title': 'Test'}
        }
        
        response = handle_get_upload_url(body, 'test_user')
        
        assert response['statusCode'] == 200
        body_data = json.loads(response['body'])
        assert 'upload_url' in body_data
        assert 'file_id' in body_data

    @patch('upload.verify_token')
    @patch('upload.validate_file')
    def test_handle_get_upload_url_validation_error(self, mock_validate, mock_verify_token):
        """Test upload URL generation with validation errors"""
        mock_verify_token.return_value = {'user_id': 'test_user'}
        mock_validate.return_value = ['File too large']
        
        body = {
            'file_info': {'name': 'test.jpg', 'size': 200 * 1024 * 1024},
            'metadata': {'title': 'Test'}
        }
        
        response = handle_get_upload_url(body, 'test_user')
        
        assert response['statusCode'] == 400
        body_data = json.loads(response['body'])
        assert 'error' in body_data

    @patch('upload.dynamodb')
    def test_handle_complete_upload_success(self, mock_dynamodb):
        """Test successful upload completion"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        body = {'file_id': 'file_123'}
        
        response = handle_complete_upload(body, 'test_user')
        
        assert response['statusCode'] == 200
        mock_table.update_item.assert_called_once()

    @patch('upload.dynamodb')
    def test_handle_complete_upload_missing_file_id(self, mock_dynamodb):
        """Test upload completion with missing file ID"""
        body = {}
        
        response = handle_complete_upload(body, 'test_user')
        
        assert response['statusCode'] == 400
        body_data = json.loads(response['body'])
        assert 'error' in body_data

    @patch('upload.dynamodb')
    def test_handle_get_download_url_success(self, mock_dynamodb):
        """Test successful download URL generation"""
        mock_table = Mock()
        mock_table.get_item.return_value = {
            'Item': {
                'file_id': 'file_123',
                'user_id': 'test_user',
                'filename': 'test.jpg',
                'file_type': 'image',
                'file_size': 1024,
                'title': 'Test',
                'description': 'Test desc',
                'tags': ['test']
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        with patch('upload.create_signed_url') as mock_create_url:
            mock_create_url.return_value = 'https://s3.amazonaws.com/test-bucket/test-key'
            
            body = {'file_id': 'file_123'}
            response = handle_get_download_url(body, 'test_user')
            
            assert response['statusCode'] == 200
            body_data = json.loads(response['body'])
            assert 'download_url' in body_data
            assert 'file_info' in body_data

    @patch('upload.dynamodb')
    def test_handle_get_download_url_file_not_found(self, mock_dynamodb):
        """Test download URL generation for non-existent file"""
        mock_table = Mock()
        mock_table.get_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        body = {'file_id': 'nonexistent'}
        response = handle_get_download_url(body, 'test_user')
        
        assert response['statusCode'] == 404
        body_data = json.loads(response['body'])
        assert 'error' in body_data

class TestTokenVerification:
    """Test suite for token verification"""
    
    @patch('upload.cognito_idp')
    @patch('upload.jwt')
    def test_verify_token_success(self, mock_jwt, mock_cognito):
        """Test successful token verification"""
        mock_jwt.get_unverified_claims.return_value = {'sub': 'test_user_123'}
        mock_cognito.get_user.return_value = {
            'Username': 'testuser',
            'UserAttributes': [
                {'Name': 'email', 'Value': 'test@example.com'},
                {'Name': 'name', 'Value': 'Test User'}
            ]
        }
        
        result = verify_token('valid_token')
        
        assert result is not None
        assert result['user_id'] == 'test_user_123'
        assert result['username'] == 'testuser'

    @patch('upload.cognito_idp')
    @patch('upload.jwt')
    def test_verify_token_failure(self, mock_jwt, mock_cognito):
        """Test token verification failure"""
        mock_jwt.get_unverified_claims.side_effect = Exception('Invalid token')
        
        result = verify_token('invalid_token')
        
        assert result is None

if __name__ == '__main__':
    pytest.main([__file__]) 