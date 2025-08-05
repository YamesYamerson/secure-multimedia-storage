"""
Authentication Handler for Secure File Sharing System
Phase 1, Milestone 1.2 - Authentication System

Handles user authentication, registration, and session management
"""

import json
import boto3
import os
from botocore.exceptions import ClientError
from jose import jwt
import requests

# AWS clients
cognito_idp = boto3.client('cognito-idp')
cognito_identity = boto3.client('cognito-identity')
dynamodb = boto3.client('dynamodb')

# Configuration
USER_POOL_ID = os.environ.get('USER_POOL_ID', 'us-east-1_xxxxxxxxx')
IDENTITY_POOL_ID = os.environ.get('IDENTITY_POOL_ID', 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
CLIENT_ID = os.environ.get('CLIENT_ID', 'xxxxxxxxxxxxxxxxxxxxxxxxxx')
USERS_TABLE = os.environ.get('USERS_TABLE', 'secure-multimedia-users')

def handler(event, context):
    """
    Main handler for authentication requests
    """
    try:
        # Parse the request
        path = event.get('pathParameters', {}).get('proxy', '')
        method = event.get('httpMethod', 'GET')
        
        # Route the request
        if path == 'login' and method == 'POST':
            return handle_login(event)
        elif path == 'register' and method == 'POST':
            return handle_register(event)
        elif path == 'logout' and method == 'POST':
            return handle_logout(event)
        elif path == 'verify' and method == 'POST':
            return handle_verify_token(event)
        elif path == 'refresh' and method == 'POST':
            return handle_refresh_token(event)
        else:
            return create_response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_login(event):
    """
    Handle user login
    """
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')
        
        if not username or not password:
            return create_response(400, {'error': 'Username and password are required'})
        
        # Authenticate with Cognito
        response = cognito_idp.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        
        # Get user details from DynamoDB
        user_details = get_user_details(username)
        
        return create_response(200, {
            'message': 'Login successful',
            'tokens': {
                'access_token': response['AuthenticationResult']['AccessToken'],
                'refresh_token': response['AuthenticationResult']['RefreshToken'],
                'id_token': response['AuthenticationResult']['IdToken']
            },
            'user': user_details
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return create_response(401, {'error': 'Invalid credentials'})
        elif error_code == 'UserNotConfirmedException':
            return create_response(400, {'error': 'User not confirmed'})
        else:
            return create_response(400, {'error': str(e)})

def handle_register(event):
    """
    Handle user registration
    """
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')
        email = body.get('email')
        name = body.get('name')
        
        if not all([username, password, email, name]):
            return create_response(400, {'error': 'All fields are required'})
        
        # Create user in Cognito
        response = cognito_idp.sign_up(
            ClientId=CLIENT_ID,
            Username=username,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name}
            ]
        )
        
        # Store additional user data in DynamoDB
        store_user_details(username, {
            'name': name,
            'email': email,
            'created_at': get_current_timestamp(),
            'role': 'family_member'
        })
        
        return create_response(200, {
            'message': 'Registration successful. Please check your email for confirmation.',
            'user_id': response['UserSub']
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UsernameExistsException':
            return create_response(400, {'error': 'Username already exists'})
        elif error_code == 'InvalidPasswordException':
            return create_response(400, {'error': 'Password does not meet requirements'})
        else:
            return create_response(400, {'error': str(e)})

def handle_logout(event):
    """
    Handle user logout
    """
    try:
        body = json.loads(event.get('body', '{}'))
        access_token = body.get('access_token')
        
        if not access_token:
            return create_response(400, {'error': 'Access token is required'})
        
        # Revoke the token
        cognito_idp.revoke_token(
            ClientId=CLIENT_ID,
            Token=access_token
        )
        
        return create_response(200, {'message': 'Logout successful'})
        
    except ClientError as e:
        return create_response(400, {'error': str(e)})

def handle_verify_token(event):
    """
    Verify JWT token validity
    """
    try:
        body = json.loads(event.get('body', '{}'))
        token = body.get('token')
        
        if not token:
            return create_response(400, {'error': 'Token is required'})
        
        # Verify token with Cognito
        response = cognito_idp.get_user(
            AccessToken=token
        )
        
        return create_response(200, {
            'valid': True,
            'user': {
                'username': response['Username'],
                'attributes': {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
            }
        })
        
    except ClientError as e:
        return create_response(200, {'valid': False, 'error': str(e)})

def handle_refresh_token(event):
    """
    Refresh access token using refresh token
    """
    try:
        body = json.loads(event.get('body', '{}'))
        refresh_token = body.get('refresh_token')
        
        if not refresh_token:
            return create_response(400, {'error': 'Refresh token is required'})
        
        # Refresh the token
        response = cognito_idp.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token
            }
        )
        
        return create_response(200, {
            'access_token': response['AuthenticationResult']['AccessToken'],
            'id_token': response['AuthenticationResult']['IdToken']
        })
        
    except ClientError as e:
        return create_response(400, {'error': str(e)})

def get_user_details(username):
    """
    Get user details from DynamoDB
    """
    try:
        response = dynamodb.get_item(
            TableName=USERS_TABLE,
            Key={'user_id': {'S': username}}
        )
        
        if 'Item' in response:
            return unmarshall_dynamodb_item(response['Item'])
        return None
        
    except ClientError:
        return None

def store_user_details(username, details):
    """
    Store user details in DynamoDB
    """
    try:
        item = {
            'user_id': {'S': username},
            'name': {'S': details['name']},
            'email': {'S': details['email']},
            'created_at': {'S': details['created_at']},
            'role': {'S': details['role']}
        }
        
        dynamodb.put_item(
            TableName=USERS_TABLE,
            Item=item
        )
        
    except ClientError as e:
        print(f"Error storing user details: {str(e)}")

def get_current_timestamp():
    """
    Get current timestamp in ISO format
    """
    from datetime import datetime
    return datetime.utcnow().isoformat()

def unmarshall_dynamodb_item(item):
    """
    Convert DynamoDB item to Python dict
    """
    result = {}
    for key, value in item.items():
        if 'S' in value:
            result[key] = value['S']
        elif 'N' in value:
            result[key] = int(value['N'])
        elif 'BOOL' in value:
            result[key] = value['BOOL']
    return result

def create_response(status_code, body):
    """
    Create API Gateway response
    """
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