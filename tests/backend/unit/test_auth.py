"""
Unit tests for authentication Lambda function
Tests the auth.py handler and related functions
"""

import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
import sys
sys.path.append('src/backend')

from auth import handler, handle_login, handle_register, handle_logout, handle_verify_token, handle_refresh_token

class TestAuthHandler:
    """Test cases for the main auth handler function"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'pathParameters': {'proxy': 'login'},
            'httpMethod': 'POST',
            'body': json.dumps({
                'username': 'testuser',
                'password': 'testpass'
            })
        }
        self.mock_context = Mock()
    
    @patch('auth.handle_login')
    def test_handler_login_route(self, mock_handle_login):
        """Test handler routes login requests correctly"""
        mock_handle_login.return_value = {'statusCode': 200, 'body': 'success'}
        
        result = handler(self.mock_event, self.mock_context)
        
        mock_handle_login.assert_called_once_with(self.mock_event)
        assert result['statusCode'] == 200
    
    @patch('auth.handle_register')
    def test_handler_register_route(self, mock_handle_register):
        """Test handler routes register requests correctly"""
        self.mock_event['pathParameters']['proxy'] = 'register'
        mock_handle_register.return_value = {'statusCode': 200, 'body': 'success'}
        
        result = handler(self.mock_event, self.mock_context)
        
        mock_handle_register.assert_called_once_with(self.mock_event)
        assert result['statusCode'] == 200
    
    def test_handler_unknown_route(self):
        """Test handler returns 404 for unknown routes"""
        self.mock_event['pathParameters']['proxy'] = 'unknown'
        
        result = handler(self.mock_event, self.mock_context)
        
        assert result['statusCode'] == 404
        assert 'Endpoint not found' in result['body']
    
    def test_handler_exception_handling(self):
        """Test handler handles exceptions gracefully"""
        with patch('auth.handle_login', side_effect=Exception('Test error')):
            result = handler(self.mock_event, self.mock_context)
            
            assert result['statusCode'] == 500
            assert 'Internal server error' in result['body']


class TestHandleLogin:
    """Test cases for login functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'body': json.dumps({
                'username': 'testuser',
                'password': 'testpass'
            })
        }
    
    @patch('auth.cognito_idp')
    @patch('auth.get_user_details')
    def test_handle_login_success(self, mock_get_user_details, mock_cognito):
        """Test successful login"""
        # Mock Cognito response
        mock_cognito.initiate_auth.return_value = {
            'AuthenticationResult': {
                'AccessToken': 'access-token',
                'RefreshToken': 'refresh-token',
                'IdToken': 'id-token'
            }
        }
        
        # Mock user details
        mock_get_user_details.return_value = {
            'name': 'Test User',
            'email': 'test@example.com'
        }
        
        result = handle_login(self.mock_event)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Login successful'
        assert 'access_token' in body['tokens']
        assert body['user']['name'] == 'Test User'
    
    def test_handle_login_missing_credentials(self):
        """Test login with missing credentials"""
        self.mock_event['body'] = json.dumps({'username': 'testuser'})
        
        result = handle_login(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Username and password are required' in body['error']
    
    @patch('auth.cognito_idp')
    def test_handle_login_invalid_credentials(self, mock_cognito):
        """Test login with invalid credentials"""
        from botocore.exceptions import ClientError
        
        # Mock Cognito error response
        error_response = {
            'Error': {
                'Code': 'NotAuthorizedException',
                'Message': 'Invalid credentials'
            }
        }
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, 'InitiateAuth')
        
        result = handle_login(self.mock_event)
        
        assert result['statusCode'] == 401
        body = json.loads(result['body'])
        assert 'Invalid credentials' in body['error']
    
    @patch('auth.cognito_idp')
    def test_handle_login_user_not_confirmed(self, mock_cognito):
        """Test login with unconfirmed user"""
        from botocore.exceptions import ClientError
        
        error_response = {
            'Error': {
                'Code': 'UserNotConfirmedException',
                'Message': 'User not confirmed'
            }
        }
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, 'InitiateAuth')
        
        result = handle_login(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'User not confirmed' in body['error']


class TestHandleRegister:
    """Test cases for registration functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'body': json.dumps({
                'username': 'newuser',
                'password': 'newpass',
                'email': 'new@example.com',
                'name': 'New User'
            })
        }
    
    @patch('auth.cognito_idp')
    @patch('auth.store_user_details')
    def test_handle_register_success(self, mock_store_user, mock_cognito):
        """Test successful registration"""
        # Mock Cognito response
        mock_cognito.sign_up.return_value = {
            'UserSub': 'user-sub-id'
        }
        
        result = handle_register(self.mock_event)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'Registration successful' in body['message']
        assert body['user_id'] == 'user-sub-id'
        mock_store_user.assert_called_once()
    
    def test_handle_register_missing_fields(self):
        """Test registration with missing fields"""
        self.mock_event['body'] = json.dumps({
            'username': 'newuser',
            'password': 'newpass'
        })
        
        result = handle_register(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'All fields are required' in body['error']
    
    @patch('auth.cognito_idp')
    def test_handle_register_username_exists(self, mock_cognito):
        """Test registration with existing username"""
        from botocore.exceptions import ClientError
        
        error_response = {
            'Error': {
                'Code': 'UsernameExistsException',
                'Message': 'Username already exists'
            }
        }
        mock_cognito.sign_up.side_effect = ClientError(error_response, 'SignUp')
        
        result = handle_register(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Username already exists' in body['error']


class TestHandleLogout:
    """Test cases for logout functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'body': json.dumps({
                'access_token': 'valid-token'
            })
        }
    
    @patch('auth.cognito_idp')
    def test_handle_logout_success(self, mock_cognito):
        """Test successful logout"""
        mock_cognito.revoke_token.return_value = {}
        
        result = handle_logout(self.mock_event)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Logout successful'
    
    def test_handle_logout_missing_token(self):
        """Test logout without access token"""
        self.mock_event['body'] = json.dumps({})
        
        result = handle_logout(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Access token is required' in body['error']


class TestHandleVerifyToken:
    """Test cases for token verification"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'body': json.dumps({
                'token': 'valid-token'
            })
        }
    
    @patch('auth.cognito_idp')
    def test_handle_verify_token_success(self, mock_cognito):
        """Test successful token verification"""
        mock_cognito.get_user.return_value = {
            'Username': 'testuser',
            'UserAttributes': [
                {'Name': 'email', 'Value': 'test@example.com'},
                {'Name': 'name', 'Value': 'Test User'}
            ]
        }
        
        result = handle_verify_token(self.mock_event)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['valid'] is True
        assert body['user']['username'] == 'testuser'
    
    def test_handle_verify_token_missing_token(self):
        """Test token verification without token"""
        self.mock_event['body'] = json.dumps({})
        
        result = handle_verify_token(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Token is required' in body['error']


class TestHandleRefreshToken:
    """Test cases for token refresh"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_event = {
            'body': json.dumps({
                'refresh_token': 'valid-refresh-token'
            })
        }
    
    @patch('auth.cognito_idp')
    def test_handle_refresh_token_success(self, mock_cognito):
        """Test successful token refresh"""
        mock_cognito.initiate_auth.return_value = {
            'AuthenticationResult': {
                'AccessToken': 'new-access-token',
                'IdToken': 'new-id-token'
            }
        }
        
        result = handle_refresh_token(self.mock_event)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['access_token'] == 'new-access-token'
        assert body['id_token'] == 'new-id-token'
    
    def test_handle_refresh_token_missing_token(self):
        """Test token refresh without refresh token"""
        self.mock_event['body'] = json.dumps({})
        
        result = handle_refresh_token(self.mock_event)
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Refresh token is required' in body['error']


class TestUtilityFunctions:
    """Test cases for utility functions"""
    
    @patch('auth.dynamodb')
    def test_get_user_details_success(self, mock_dynamodb):
        """Test getting user details from DynamoDB"""
        from auth import get_user_details
        
        mock_dynamodb.get_item.return_value = {
            'Item': {
                'user_id': {'S': 'testuser'},
                'name': {'S': 'Test User'},
                'email': {'S': 'test@example.com'}
            }
        }
        
        result = get_user_details('testuser')
        
        assert result['name'] == 'Test User'
        assert result['email'] == 'test@example.com'
    
    @patch('auth.dynamodb')
    def test_get_user_details_not_found(self, mock_dynamodb):
        """Test getting user details when user doesn't exist"""
        from auth import get_user_details
        
        mock_dynamodb.get_item.return_value = {}
        
        result = get_user_details('nonexistent')
        
        assert result is None
    
    @patch('auth.dynamodb')
    def test_store_user_details_success(self, mock_dynamodb):
        """Test storing user details in DynamoDB"""
        from auth import store_user_details
        
        details = {
            'name': 'Test User',
            'email': 'test@example.com',
            'created_at': '2023-01-01T00:00:00',
            'role': 'family_member'
        }
        
        store_user_details('testuser', details)
        
        mock_dynamodb.put_item.assert_called_once()
        call_args = mock_dynamodb.put_item.call_args[1]
        assert call_args['TableName'] == 'secure-multimedia-users'
        assert 'Item' in call_args


class TestResponseCreation:
    """Test cases for response creation utility"""
    
    def test_create_response_success(self):
        """Test creating successful response"""
        from auth import create_response
        
        result = create_response(200, {'message': 'Success'})
        
        assert result['statusCode'] == 200
        assert result['headers']['Content-Type'] == 'application/json'
        assert result['headers']['Access-Control-Allow-Origin'] == '*'
        body = json.loads(result['body'])
        assert body['message'] == 'Success'
    
    def test_create_response_error(self):
        """Test creating error response"""
        from auth import create_response
        
        result = create_response(400, {'error': 'Bad request'})
        
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert body['error'] == 'Bad request'


if __name__ == '__main__':
    pytest.main([__file__]) 