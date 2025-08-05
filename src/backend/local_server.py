#!/usr/bin/env python3
"""
Local Development Server for Secure File Sharing System
Uses SQLite for file metadata and local file system for storage
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import hashlib

app = Flask(__name__)
CORS(app)  # Enable CORS for development

# Configuration
UPLOAD_FOLDER = 'uploads'
DATABASE_PATH = 'file_storage.db'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create files table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_type TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,
            file_path TEXT NOT NULL,
            is_deleted INTEGER DEFAULT 0
        )
    ''')
    
    # Create users table (for development)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            name TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def get_file_hash(file_path):
    """Calculate SHA256 hash of file"""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get user info (placeholder auth)
        user_id = request.form.get('user_id', 'dev-user-001')
        
        # Validate file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large'}), 400
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Secure filename
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        stored_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, stored_filename)
        
        # Save file
        file.save(file_path)
        
        # Calculate file hash
        file_hash = get_file_hash(file_path)
        
        # Store metadata in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO files (id, filename, original_filename, file_size, file_type, 
                             file_hash, uploaded_by, uploaded_at, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            file_id, stored_filename, original_filename, file_size, 
            file.content_type, file_hash, user_id, 
            datetime.now(timezone.utc).isoformat(), file_path
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': original_filename,
            'file_size': file_size,
            'message': 'File uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all files for a user"""
    try:
        user_id = request.args.get('user_id', 'dev-user-001')
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, original_filename, file_size, file_type, uploaded_at
            FROM files 
            WHERE uploaded_by = ? AND is_deleted = 0
            ORDER BY uploaded_at DESC
        ''', (user_id,))
        
        files = []
        for row in cursor.fetchall():
            files.append({
                'id': row[0],
                'filename': row[1],
                'file_size': row[2],
                'file_type': row[3],
                'uploaded_at': row[4]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>', methods=['GET'])
def download_file(file_id):
    """Download a file"""
    try:
        user_id = request.args.get('user_id', 'dev-user-001')
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT file_path, original_filename, file_type
            FROM files 
            WHERE id = ? AND uploaded_by = ? AND is_deleted = 0
        ''', (file_id, user_id))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'File not found'}), 404
        
        file_path, original_filename, file_type = row
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found on disk'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=original_filename,
            mimetype=file_type
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete a file (soft delete)"""
    try:
        user_id = request.args.get('user_id', 'dev-user-001')
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE files 
            SET is_deleted = 1
            WHERE id = ? AND uploaded_by = ? AND is_deleted = 0
        ''', (file_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'File not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'File deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'upload_folder': UPLOAD_FOLDER,
        'database': DATABASE_PATH
    })

if __name__ == '__main__':
    print("Initializing local development server...")
    init_database()
    print(f"Database initialized: {DATABASE_PATH}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("Starting server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000) 