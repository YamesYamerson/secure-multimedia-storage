/**
 * File Manager for Secure File Sharing System
 * Handles file upload, download, and metadata operations
 */

export class FileManager {
    constructor() {
        // For development, use localhost. In production, these would be environment variables
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : 'https://api.secure-multimedia-storage.com';
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/zip', 'application/x-rar-compressed'
        ];
    }
    
    async getFiles(sortBy = 'date-desc') {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files?sort=${sortBy}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.files || [];
            } else {
                throw new Error('Failed to fetch files');
            }
            
        } catch (error) {
            console.error('Get files error:', error);
            throw error;
        }
    }
    
    async uploadFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Get upload URL
            const uploadUrl = await this.getUploadUrl(file);
            
            // Upload file directly to S3
            const uploadResponse = await fetch(uploadUrl.url, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                    'x-amz-server-side-encryption': 'AES256'
                },
                body: file
            });
            
            if (!uploadResponse.ok) {
                throw new Error('File upload failed');
            }
            
            // Save metadata
            const metadata = {
                file_id: uploadUrl.file_id,
                filename: file.name,
                size: file.size,
                type: file.type,
                uploaded_by: await this.getCurrentUserId(),
                uploaded_at: new Date().toISOString()
            };
            
            await this.saveFileMetadata(metadata);
            
            return {
                success: true,
                file_id: uploadUrl.file_id,
                filename: file.name
            };
            
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }
    
    async downloadFile(fileId) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/download/${fileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.download_url;
            } else {
                throw new Error('Failed to get download URL');
            }
            
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }
    
    async deleteFile(fileId) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                return { success: true };
            } else {
                throw new Error('Failed to delete file');
            }
            
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }
    
    async searchFiles(query) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.files || [];
            } else {
                throw new Error('Search failed');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
    
    async updateFileMetadata(fileId, metadata) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files/${fileId}/metadata`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata)
            });
            
            if (response.ok) {
                return { success: true };
            } else {
                throw new Error('Failed to update metadata');
            }
            
        } catch (error) {
            console.error('Update metadata error:', error);
            throw error;
        }
    }
    
    async getFileMetadata(fileId) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files/${fileId}/metadata`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.metadata;
            } else {
                throw new Error('Failed to get metadata');
            }
            
        } catch (error) {
            console.error('Get metadata error:', error);
            throw error;
        }
    }
    
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds maximum limit of ${this.formatFileSize(this.maxFileSize)}`);
        }
        
        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('File type not allowed');
        }
        
        // Check file name
        if (!file.name || file.name.trim() === '') {
            throw new Error('Invalid file name');
        }
    }
    
    async getUploadUrl(file) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: file.name,
                    content_type: file.type,
                    size: file.size
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    url: data.upload_url,
                    file_id: data.file_id
                };
            } else {
                throw new Error('Failed to get upload URL');
            }
            
        } catch (error) {
            console.error('Get upload URL error:', error);
            throw error;
        }
    }
    
    async saveFileMetadata(metadata) {
        try {
            const token = await this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/files/${metadata.file_id}/metadata`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save metadata');
            }
            
        } catch (error) {
            console.error('Save metadata error:', error);
            throw error;
        }
    }
    
    async getAuthToken() {
        // This would typically come from the AuthManager
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token available');
        }
        return token;
    }
    
    async getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.username || 'unknown';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getFileTypeIcon(fileType) {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('video/')) return 'video';
        if (fileType.startsWith('audio/')) return 'audio';
        if (fileType.includes('pdf') || fileType.includes('document')) return 'document';
        if (fileType.includes('zip') || fileType.includes('rar')) return 'archive';
        return 'document';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
} 