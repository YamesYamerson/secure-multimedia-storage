import json
import boto3
import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from botocore.exceptions import ClientError
from jose import jwt
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cognito_idp = boto3.client('cognito-idp')

# Environment variables
S3_BUCKET = os.environ.get('S3_BUCKET')
FILES_TABLE = os.environ.get('FILES_TABLE')
USERS_TABLE = os.environ.get('USERS_TABLE')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')

# File validation constants
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg']
}

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

def verify_token(token):
    """Verify JWT token and return user info"""
    try:
        # Decode token without verification first to get claims
        decoded = jwt.get_unverified_claims(token)
        user_id = decoded.get('sub')
        
        # Verify with Cognito
        response = cognito_idp.get_user(
            AccessToken=token
        )
        return {
            'user_id': user_id,
            'username': response['Username'],
            'attributes': {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
        }
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return None

def validate_file(file_info):
    """Validate file information"""
    errors = []
    
    # Check file size
    if file_info.get('size', 0) > MAX_FILE_SIZE:
        errors.append(f"File size exceeds maximum limit of {MAX_FILE_SIZE} bytes")
    
    # Check file extension
    filename = file_info.get('name', '')
    file_extension = os.path.splitext(filename)[1].lower()
    
    allowed_extensions = []
    for extensions in ALLOWED_EXTENSIONS.values():
        allowed_extensions.extend(extensions)
    
    if file_extension not in allowed_extensions:
        errors.append(f"File type {file_extension} is not allowed")
    
    # Check filename
    if not filename or len(filename) > 255:
        errors.append("Invalid filename")
    
    return errors

def generate_file_id(user_id, filename):
    """Generate unique file ID"""
    timestamp = datetime.now(timezone.utc).isoformat()
    file_hash = hashlib.md5(f"{user_id}{filename}{timestamp}".encode()).hexdigest()
    return f"{user_id}_{file_hash[:8]}"

def create_signed_url(file_id, filename, user_id, operation='put_object'):
    """Generate signed URL for S3 operation"""
    try:
        # Determine content type based on file extension
        file_extension = os.path.splitext(filename)[1].lower()
        content_type = 'application/octet-stream'
        
        for file_type, extensions in ALLOWED_EXTENSIONS.items():
            if file_extension in extensions:
                if file_type == 'image':
                    content_type = f'image/{file_extension[1:]}'
                elif file_type == 'document':
                    content_type = 'application/pdf' if file_extension == '.pdf' else 'application/msword'
                elif file_type == 'video':
                    content_type = f'video/{file_extension[1:]}'
                elif file_type == 'audio':
                    content_type = f'audio/{file_extension[1:]}'
                break
        
        # Generate signed URL
        if operation == 'put_object':
            url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': f"uploads/{user_id}/{file_id}/{filename}",
                    'ContentType': content_type
                },
                ExpiresIn=3600  # 1 hour
            )
        else:  # get_object
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': f"uploads/{user_id}/{file_id}/{filename}"
                },
                ExpiresIn=3600  # 1 hour
            )
        
        return url
    except Exception as e:
        logger.error(f"Error generating signed URL: {str(e)}")
        return None

def store_file_metadata(file_id, user_id, filename, file_info, metadata):
    """Store file metadata in DynamoDB"""
    try:
        table = dynamodb.Table(FILES_TABLE)
        
        # Determine file type
        file_extension = os.path.splitext(filename)[1].lower()
        file_type = 'other'
        for type_name, extensions in ALLOWED_EXTENSIONS.items():
            if file_extension in extensions:
                file_type = type_name
                break
        
        item = {
            'file_id': file_id,
            'user_id': user_id,
            'filename': filename,
            'file_type': file_type,
            'file_size': file_info.get('size', 0),
            'content_type': file_info.get('type', 'application/octet-stream'),
            's3_key': f"uploads/{user_id}/{file_id}/{filename}",
            'title': metadata.get('title', filename),
            'description': metadata.get('description', ''),
            'tags': metadata.get('tags', []),
            'upload_date': datetime.now(timezone.utc).isoformat(),
            'last_modified': datetime.now(timezone.utc).isoformat(),
            'version': 1,
            'status': 'uploading'
        }
        
        table.put_item(Item=item)
        return True
    except Exception as e:
        logger.error(f"Error storing file metadata: {str(e)}")
        return False

def handler(event, context):
    """Main Lambda handler for file upload operations"""
    try:
        # Parse request
        if event.get('httpMethod') == 'OPTIONS':
            return create_response(200, {'message': 'OK'})
        
        # Verify authentication
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return create_response(401, {'error': 'Missing or invalid authorization header'})
        
        token = auth_header.split(' ')[1]
        user_info = verify_token(token)
        if not user_info:
            return create_response(401, {'error': 'Invalid or expired token'})
        
        user_id = user_info['user_id']
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Handle different upload operations
        operation = body.get('operation', 'get_upload_url')
        
        if operation == 'get_upload_url':
            return handle_get_upload_url(body, user_id)
        elif operation == 'complete_upload':
            return handle_complete_upload(body, user_id)
        elif operation == 'get_download_url':
            return handle_get_download_url(body, user_id)
        else:
            return create_response(400, {'error': 'Invalid operation'})
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_upload_url(body, user_id):
    """Handle request to get signed upload URL"""
    file_info = body.get('file_info', {})
    metadata = body.get('metadata', {})
    
    # Validate file
    validation_errors = validate_file(file_info)
    if validation_errors:
        return create_response(400, {'error': 'File validation failed', 'details': validation_errors})
    
    filename = file_info.get('name', '')
    file_id = generate_file_id(user_id, filename)
    
    # Generate signed URL
    upload_url = create_signed_url(file_id, filename, user_id, 'put_object')
    if not upload_url:
        return create_response(500, {'error': 'Failed to generate upload URL'})
    
    # Store initial metadata
    if not store_file_metadata(file_id, user_id, filename, file_info, metadata):
        return create_response(500, {'error': 'Failed to store file metadata'})
    
    return create_response(200, {
        'upload_url': upload_url,
        'file_id': file_id,
        'expires_in': 3600
    })

def handle_complete_upload(body, user_id):
    """Handle upload completion notification"""
    file_id = body.get('file_id')
    if not file_id:
        return create_response(400, {'error': 'Missing file_id'})
    
    try:
        table = dynamodb.Table(FILES_TABLE)
        
        # Update file status to completed
        response = table.update_item(
            Key={'file_id': file_id, 'user_id': user_id},
            UpdateExpression='SET #status = :status, last_modified = :last_modified',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'completed',
                ':last_modified': datetime.now(timezone.utc).isoformat(),
                ':user_id': user_id
            },
            ConditionExpression='attribute_exists(file_id) AND user_id = :user_id'
        )
        
        return create_response(200, {'message': 'Upload completed successfully'})
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return create_response(404, {'error': 'File not found or access denied'})
        else:
            logger.error(f"DynamoDB error: {str(e)}")
            return create_response(500, {'error': 'Database error'})

def handle_get_download_url(body, user_id):
    """Handle request to get signed download URL"""
    file_id = body.get('file_id')
    if not file_id:
        return create_response(400, {'error': 'Missing file_id'})
    
    try:
        table = dynamodb.Table(FILES_TABLE)
        
        # Get file metadata
        response = table.get_item(
            Key={'file_id': file_id, 'user_id': user_id}
        )
        
        if 'Item' not in response:
            return create_response(404, {'error': 'File not found'})
        
        file_item = response['Item']
        
        # Generate download URL
        download_url = create_signed_url(
            file_id, 
            file_item['filename'], 
            user_id, 
            'get_object'
        )
        
        if not download_url:
            return create_response(500, {'error': 'Failed to generate download URL'})
        
        return create_response(200, {
            'download_url': download_url,
            'file_info': {
                'filename': file_item['filename'],
                'file_type': file_item['file_type'],
                'file_size': file_item['file_size'],
                'title': file_item.get('title', ''),
                'description': file_item.get('description', ''),
                'tags': file_item.get('tags', [])
            },
            'expires_in': 3600
        })
        
    except Exception as e:
        logger.error(f"Error getting download URL: {str(e)}")
        return create_response(500, {'error': 'Internal server error'}) 