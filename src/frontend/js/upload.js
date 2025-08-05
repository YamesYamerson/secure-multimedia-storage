/**
 * File Upload Manager
 * Handles file upload operations with drag-and-drop support, progress tracking, and metadata management
 */

class UploadManager {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.maxConcurrentUploads = 3;
        this.activeUploads = 0;
        this.uploadCallbacks = {
            onProgress: null,
            onComplete: null,
            onError: null,
            onQueueUpdate: null
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for drag and drop
     */
    initializeEventListeners() {
        const dropZone = document.getElementById('upload-drop-zone');
        const fileInput = document.getElementById('file-input');
        
        if (dropZone) {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.preventDefaults, false);
                document.body.addEventListener(eventName, this.preventDefaults, false);
            });

            // Highlight drop zone when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.unhighlight, false);
            });

            // Handle dropped files
            dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
            
            // Handle click to select files
            dropZone.addEventListener('click', () => fileInput?.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Highlight drop zone
     */
    highlight(e) {
        const dropZone = document.getElementById('upload-drop-zone');
        if (dropZone) {
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        }
    }

    /**
     * Unhighlight drop zone
     */
    unhighlight(e) {
        const dropZone = document.getElementById('upload-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        }
    }

    /**
     * Handle files dropped on drop zone
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.processFiles(files);
    }

    /**
     * Handle files selected via file input
     */
    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    /**
     * Process selected files and add to upload queue
     */
    async processFiles(files) {
        const validFiles = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push({
                    file: file,
                    id: this.generateFileId(),
                    status: 'pending',
                    progress: 0,
                    metadata: {
                        title: file.name,
                        description: '',
                        tags: []
                    }
                });
            } else {
                this.showError(`File "${file.name}" is invalid: ${validation.error}`);
            }
        }

        if (validFiles.length > 0) {
            // Add to upload queue
            this.uploadQueue.push(...validFiles);
            this.updateQueueDisplay();
            
            // Start upload process if not already running
            if (!this.isUploading) {
                this.processUploadQueue();
            }
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text',
            // Videos
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'
        ];

        if (file.size > maxSize) {
            return {
                isValid: false,
                error: `File size (${this.formatFileSize(file.size)}) exceeds maximum limit of 100MB`
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: `File type "${file.type}" is not allowed`
            };
        }

        if (file.name.length > 255) {
            return {
                isValid: false,
                error: 'Filename is too long (maximum 255 characters)'
            };
        }

        return { isValid: true };
    }

    /**
     * Generate unique file ID
     */
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Process upload queue
     */
    async processUploadQueue() {
        if (this.uploadQueue.length === 0 || this.isUploading) {
            return;
        }

        this.isUploading = true;

        while (this.uploadQueue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
            const fileItem = this.uploadQueue.shift();
            this.activeUploads++;
            
            // Start upload in background
            this.uploadFile(fileItem).finally(() => {
                this.activeUploads--;
                this.processUploadQueue();
            });
        }

        this.isUploading = false;
    }

    /**
     * Upload a single file
     */
    async uploadFile(fileItem) {
        try {
            fileItem.status = 'uploading';
            this.updateFileDisplay(fileItem);

            // Step 1: Get upload URL from backend
            const uploadUrlResponse = await this.getUploadUrl(fileItem);
            if (!uploadUrlResponse.success) {
                throw new Error(uploadUrlResponse.error);
            }

            // Step 2: Upload file to S3
            await this.uploadToS3(fileItem, uploadUrlResponse.upload_url);

            // Step 3: Complete upload
            await this.completeUpload(uploadUrlResponse.file_id);

            // Success
            fileItem.status = 'completed';
            fileItem.progress = 100;
            this.updateFileDisplay(fileItem);

            if (this.uploadCallbacks.onComplete) {
                this.uploadCallbacks.onComplete(fileItem);
            }

        } catch (error) {
            console.error('Upload failed:', error);
            fileItem.status = 'error';
            fileItem.error = error.message;
            this.updateFileDisplay(fileItem);

            if (this.uploadCallbacks.onError) {
                this.uploadCallbacks.onError(fileItem, error);
            }
        }
    }

    /**
     * Get signed upload URL from backend
     */
    async getUploadUrl(fileItem) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                operation: 'get_upload_url',
                file_info: {
                    name: fileItem.file.name,
                    size: fileItem.file.size,
                    type: fileItem.file.type
                },
                metadata: fileItem.metadata
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to get upload URL'
            };
        }

        return {
            success: true,
            upload_url: data.upload_url,
            file_id: data.file_id
        };
    }

    /**
     * Upload file to S3 using signed URL
     */
    async uploadToS3(fileItem, uploadUrl) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    fileItem.progress = progress;
                    this.updateFileDisplay(fileItem);

                    if (this.uploadCallbacks.onProgress) {
                        this.uploadCallbacks.onProgress(fileItem, progress);
                    }
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            // Start upload
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', fileItem.file.type);
            xhr.send(fileItem.file);
        });
    }

    /**
     * Complete upload process
     */
    async completeUpload(fileId) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                operation: 'complete_upload',
                file_id: fileId
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to complete upload');
        }
    }

    /**
     * Update file display in UI
     */
    updateFileDisplay(fileItem) {
        const fileElement = document.getElementById(`file-${fileItem.id}`);
        if (!fileElement) {
            this.createFileElement(fileItem);
            return;
        }

        // Update status and progress
        const statusElement = fileElement.querySelector('.file-status');
        const progressElement = fileElement.querySelector('.file-progress');
        const progressBar = fileElement.querySelector('.progress-bar');

        if (statusElement) {
            statusElement.textContent = this.getStatusText(fileItem.status);
            statusElement.className = `file-status ${this.getStatusClass(fileItem.status)}`;
        }

        if (progressElement) {
            progressElement.textContent = `${fileItem.progress}%`;
        }

        if (progressBar) {
            progressBar.style.width = `${fileItem.progress}%`;
            progressBar.className = `progress-bar ${this.getProgressClass(fileItem.status)}`;
        }

        // Show error if applicable
        if (fileItem.status === 'error' && fileItem.error) {
            const errorElement = fileElement.querySelector('.file-error');
            if (errorElement) {
                errorElement.textContent = fileItem.error;
                errorElement.style.display = 'block';
            }
        }
    }

    /**
     * Create file element in UI
     */
    createFileElement(fileItem) {
        const uploadList = document.getElementById('upload-list');
        if (!uploadList) return;

        const fileElement = document.createElement('div');
        fileElement.id = `file-${fileItem.id}`;
        fileElement.className = 'file-item bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm';
        
        fileElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="file-icon text-2xl">
                        ${this.getFileIcon(fileItem.file.type)}
                    </div>
                    <div class="file-info flex-1">
                        <div class="file-name font-medium text-gray-900 truncate">
                            ${this.escapeHtml(fileItem.file.name)}
                        </div>
                        <div class="file-details text-sm text-gray-500">
                            ${this.formatFileSize(fileItem.file.size)} • ${fileItem.file.type}
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="edit-metadata-btn text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onclick="uploadManager.editMetadata('${fileItem.id}')">
                        Edit
                    </button>
                </div>
            </div>
            <div class="mt-3">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span class="file-status ${this.getStatusClass(fileItem.status)}">
                        ${this.getStatusText(fileItem.status)}
                    </span>
                    <span class="file-progress">${fileItem.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="progress-bar ${this.getProgressClass(fileItem.status)} h-2 rounded-full transition-all duration-300"
                         style="width: ${fileItem.progress}%"></div>
                </div>
                <div class="file-error text-red-600 text-sm mt-1" style="display: none;"></div>
            </div>
        `;

        uploadList.appendChild(fileElement);
    }

    /**
     * Update queue display
     */
    updateQueueDisplay() {
        const queueInfo = document.getElementById('upload-queue-info');
        if (queueInfo) {
            const pendingCount = this.uploadQueue.filter(item => item.status === 'pending').length;
            const uploadingCount = this.uploadQueue.filter(item => item.status === 'uploading').length;
            const completedCount = this.uploadQueue.filter(item => item.status === 'completed').length;
            const errorCount = this.uploadQueue.filter(item => item.status === 'error').length;

            queueInfo.innerHTML = `
                <div class="text-sm text-gray-600">
                    Queue: ${pendingCount} pending, ${uploadingCount} uploading, ${completedCount} completed, ${errorCount} failed
                </div>
            `;
        }

        if (this.uploadCallbacks.onQueueUpdate) {
            this.uploadCallbacks.onQueueUpdate(this.uploadQueue);
        }
    }

    /**
     * Get status text
     */
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'uploading': 'Uploading',
            'completed': 'Completed',
            'error': 'Error'
        };
        return statusMap[status] || 'Unknown';
    }

    /**
     * Get status CSS class
     */
    getStatusClass(status) {
        const classMap = {
            'pending': 'text-gray-500',
            'uploading': 'text-blue-600',
            'completed': 'text-green-600',
            'error': 'text-red-600'
        };
        return classMap[status] || 'text-gray-500';
    }

    /**
     * Get progress bar CSS class
     */
    getProgressClass(status) {
        const classMap = {
            'pending': 'bg-gray-300',
            'uploading': 'bg-blue-500',
            'completed': 'bg-green-500',
            'error': 'bg-red-500'
        };
        return classMap[status] || 'bg-gray-300';
    }

    /**
     * Get file icon based on type
     */
    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type.startsWith('audio/')) return '🎵';
        if (type === 'application/pdf') return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type === 'text/plain') return '📄';
        return '📁';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem('auth_token');
    }

    /**
     * Show error message
     */
    showError(message) {
        // You can implement this to show errors in your UI
        console.error(message);
        // Example: show toast notification
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }

    /**
     * Edit file metadata
     */
    editMetadata(fileId) {
        const fileItem = this.uploadQueue.find(item => item.id === fileId);
        if (!fileItem) return;

        // Create modal for editing metadata
        this.showMetadataModal(fileItem);
    }

    /**
     * Show metadata editing modal
     */
    showMetadataModal(fileItem) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4">Edit File Metadata</h3>
                <form id="metadata-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input type="text" id="metadata-title" value="${this.escapeHtml(fileItem.metadata.title)}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea id="metadata-description" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${this.escapeHtml(fileItem.metadata.description)}</textarea>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                        <input type="text" id="metadata-tags" value="${fileItem.metadata.tags.join(', ')}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="family, vacation, 2024">
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="this.closest('.fixed').remove()"
                                class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#metadata-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            fileItem.metadata.title = document.getElementById('metadata-title').value;
            fileItem.metadata.description = document.getElementById('metadata-description').value;
            fileItem.metadata.tags = document.getElementById('metadata-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            this.updateFileDisplay(fileItem);
            modal.remove();
        });
    }

    /**
     * Set callback functions
     */
    onProgress(callback) {
        this.uploadCallbacks.onProgress = callback;
    }

    onComplete(callback) {
        this.uploadCallbacks.onComplete = callback;
    }

    onError(callback) {
        this.uploadCallbacks.onError = callback;
    }

    onQueueUpdate(callback) {
        this.uploadCallbacks.onQueueUpdate = callback;
    }

    /**
     * Clear completed uploads
     */
    clearCompleted() {
        this.uploadQueue = this.uploadQueue.filter(item => item.status !== 'completed');
        this.updateQueueDisplay();
        
        // Remove completed file elements from UI
        const completedElements = document.querySelectorAll('.file-item');
        completedElements.forEach(element => {
            const fileId = element.id.replace('file-', '');
            const fileItem = this.uploadQueue.find(item => item.id === fileId);
            if (!fileItem) {
                element.remove();
            }
        });
    }

    /**
     * Retry failed uploads
     */
    retryFailed() {
        const failedItems = this.uploadQueue.filter(item => item.status === 'error');
        failedItems.forEach(item => {
            item.status = 'pending';
            item.progress = 0;
            item.error = null;
            this.updateFileDisplay(item);
        });

        this.uploadQueue.push(...failedItems);
        this.updateQueueDisplay();
        
        if (!this.isUploading) {
            this.processUploadQueue();
        }
    }
}

// Initialize upload manager
const uploadManager = new UploadManager();

// Export for use in other modules
window.uploadManager = uploadManager; 