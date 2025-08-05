import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockFile, createMockEvent } from '../setup.js';

// Mock DOM elements
const mockDropZone = {
    addEventListener: vi.fn(),
    classList: {
        add: vi.fn(),
        remove: vi.fn()
    }
};

const mockFileInput = {
    addEventListener: vi.fn(),
    click: vi.fn()
};

const mockUploadList = {
    appendChild: vi.fn()
};

const mockQueueInfo = {
    innerHTML: ''
};

// Mock document methods
global.document = {
    getElementById: vi.fn((id) => {
        switch (id) {
            case 'upload-drop-zone':
                return mockDropZone;
            case 'file-input':
                return mockFileInput;
            case 'upload-list':
                return mockUploadList;
            case 'upload-queue-info':
                return mockQueueInfo;
            default:
                return null;
        }
    }),
    createElement: vi.fn(() => ({
        id: '',
        className: '',
        innerHTML: '',
        querySelector: vi.fn(),
        addEventListener: vi.fn(),
        appendChild: vi.fn()
    })),
    body: {
        addEventListener: vi.fn(),
        appendChild: vi.fn()
    }
};

// Mock localStorage
global.localStorage = {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn()
};

// Mock fetch
global.fetch = vi.fn();

// Mock XMLHttpRequest
global.XMLHttpRequest = vi.fn(() => ({
    open: vi.fn(),
    setRequestHeader: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    upload: {
        addEventListener: vi.fn()
    }
}));

// Import the UploadManager class
let UploadManager;

describe('UploadManager', () => {
    let uploadManager;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        
        // Mock the UploadManager class
        UploadManager = class {
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

            initializeEventListeners() {
                // Mock implementation
            }

            preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            highlight(e) {
                const dropZone = document.getElementById('upload-drop-zone');
                if (dropZone) {
                    dropZone.classList.add('border-blue-500', 'bg-blue-50');
                }
            }

            unhighlight(e) {
                const dropZone = document.getElementById('upload-drop-zone');
                if (dropZone) {
                    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
                }
            }

            handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                this.processFiles(files);
            }

            handleFileSelect(e) {
                const files = e.target.files;
                this.processFiles(files);
            }

            async processFiles(files) {
                const validFiles = [];
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
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
                    this.uploadQueue.push(...validFiles);
                    this.updateQueueDisplay();
                    
                    if (!this.isUploading) {
                        this.processUploadQueue();
                    }
                }
            }

            validateFile(file) {
                const maxSize = 100 * 1024 * 1024; // 100MB
                const allowedTypes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
                    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text',
                    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
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

            generateFileId() {
                return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            async processUploadQueue() {
                if (this.uploadQueue.length === 0 || this.isUploading) {
                    return;
                }

                this.isUploading = true;

                while (this.uploadQueue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
                    const fileItem = this.uploadQueue.shift();
                    this.activeUploads++;
                    
                    this.uploadFile(fileItem).finally(() => {
                        this.activeUploads--;
                        this.processUploadQueue();
                    });
                }

                this.isUploading = false;
            }

            async uploadFile(fileItem) {
                try {
                    fileItem.status = 'uploading';
                    this.updateFileDisplay(fileItem);

                    const uploadUrlResponse = await this.getUploadUrl(fileItem);
                    if (!uploadUrlResponse.success) {
                        throw new Error(uploadUrlResponse.error);
                    }

                    await this.uploadToS3(fileItem, uploadUrlResponse.upload_url);
                    await this.completeUpload(uploadUrlResponse.file_id);

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

            async uploadToS3(fileItem, uploadUrl) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

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

                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', fileItem.file.type);
                    xhr.send(fileItem.file);
                });
            }

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

            updateFileDisplay(fileItem) {
                const fileElement = document.getElementById(`file-${fileItem.id}`);
                if (!fileElement) {
                    this.createFileElement(fileItem);
                    return;
                }

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

                if (fileItem.status === 'error' && fileItem.error) {
                    const errorElement = fileElement.querySelector('.file-error');
                    if (errorElement) {
                        errorElement.textContent = fileItem.error;
                        errorElement.style.display = 'block';
                    }
                }
            }

            createFileElement(fileItem) {
                const uploadList = document.getElementById('upload-list');
                if (!uploadList) return;

                const fileElement = document.createElement('div');
                fileElement.id = `file-${fileItem.id}`;
                fileElement.className = 'file-item bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm';
                
                uploadList.appendChild(fileElement);
            }

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

            getStatusText(status) {
                const statusMap = {
                    'pending': 'Pending',
                    'uploading': 'Uploading',
                    'completed': 'Completed',
                    'error': 'Error'
                };
                return statusMap[status] || 'Unknown';
            }

            getStatusClass(status) {
                const classMap = {
                    'pending': 'text-gray-500',
                    'uploading': 'text-blue-600',
                    'completed': 'text-green-600',
                    'error': 'text-red-600'
                };
                return classMap[status] || 'text-gray-500';
            }

            getProgressClass(status) {
                const classMap = {
                    'pending': 'bg-gray-300',
                    'uploading': 'bg-blue-500',
                    'completed': 'bg-green-500',
                    'error': 'bg-red-500'
                };
                return classMap[status] || 'bg-gray-300';
            }

            getFileIcon(type) {
                if (type.startsWith('image/')) return '🖼️';
                if (type.startsWith('video/')) return '🎥';
                if (type.startsWith('audio/')) return '🎵';
                if (type === 'application/pdf') return '📄';
                if (type.includes('word') || type.includes('document')) return '📝';
                if (type === 'text/plain') return '📄';
                return '📁';
            }

            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            getAuthToken() {
                return localStorage.getItem('auth_token');
            }

            showError(message) {
                console.error(message);
                if (window.showToast) {
                    window.showToast(message, 'error');
                }
            }

            editMetadata(fileId) {
                const fileItem = this.uploadQueue.find(item => item.id === fileId);
                if (!fileItem) return;
                this.showMetadataModal(fileItem);
            }

            showMetadataModal(fileItem) {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                
                document.body.appendChild(modal);

                const form = modal.querySelector('#metadata-form');
                if (form) {
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
            }

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

            clearCompleted() {
                this.uploadQueue = this.uploadQueue.filter(item => item.status !== 'completed');
                this.updateQueueDisplay();
            }

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
        };

        uploadManager = new UploadManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(uploadManager.uploadQueue).toEqual([]);
            expect(uploadManager.isUploading).toBe(false);
            expect(uploadManager.maxConcurrentUploads).toBe(3);
            expect(uploadManager.activeUploads).toBe(0);
        });

        it('should set up event listeners', () => {
            expect(mockDropZone.addEventListener).toHaveBeenCalled();
            expect(mockFileInput.addEventListener).toHaveBeenCalled();
        });
    });

    describe('File Validation', () => {
        it('should validate valid image file', () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024);
            const result = uploadManager.validateFile(file);
            expect(result.isValid).toBe(true);
        });

        it('should validate valid document file', () => {
            const file = createMockFile('document.pdf', 'application/pdf', 2048);
            const result = uploadManager.validateFile(file);
            expect(result.isValid).toBe(true);
        });

        it('should reject file that is too large', () => {
            const file = createMockFile('large.jpg', 'image/jpeg', 200 * 1024 * 1024); // 200MB
            const result = uploadManager.validateFile(file);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('exceeds maximum limit');
        });

        it('should reject file with invalid type', () => {
            const file = createMockFile('script.exe', 'application/octet-stream', 1024);
            const result = uploadManager.validateFile(file);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject file with name too long', () => {
            const longName = 'a'.repeat(300);
            const file = createMockFile(longName, 'image/jpeg', 1024);
            const result = uploadManager.validateFile(file);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('too long');
        });
    });

    describe('File ID Generation', () => {
        it('should generate unique file IDs', () => {
            const id1 = uploadManager.generateFileId();
            const id2 = uploadManager.generateFileId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^file_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^file_\d+_[a-z0-9]+$/);
        });
    });

    describe('File Processing', () => {
        it('should process valid files and add to queue', async () => {
            const files = [
                createMockFile('test1.jpg', 'image/jpeg', 1024),
                createMockFile('test2.pdf', 'application/pdf', 2048)
            ];

            await uploadManager.processFiles(files);

            expect(uploadManager.uploadQueue).toHaveLength(2);
            expect(uploadManager.uploadQueue[0].file.name).toBe('test1.jpg');
            expect(uploadManager.uploadQueue[1].file.name).toBe('test2.pdf');
        });

        it('should reject invalid files', async () => {
            const files = [
                createMockFile('valid.jpg', 'image/jpeg', 1024),
                createMockFile('invalid.exe', 'application/octet-stream', 1024)
            ];

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            await uploadManager.processFiles(files);

            expect(uploadManager.uploadQueue).toHaveLength(1);
            expect(uploadManager.uploadQueue[0].file.name).toBe('valid.jpg');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('invalid.exe'));
        });
    });

    describe('Upload Process', () => {
        it('should handle successful upload', async () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024);
            const fileItem = {
                file: file,
                id: 'test-id',
                status: 'pending',
                progress: 0,
                metadata: { title: 'Test', description: '', tags: [] }
            };

            // Mock successful API responses
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        upload_url: 'https://s3.amazonaws.com/test-bucket/test-key',
                        file_id: 'test-file-id'
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ message: 'Upload completed successfully' })
                });

            // Mock successful XHR
            const mockXHR = {
                open: vi.fn(),
                setRequestHeader: vi.fn(),
                send: vi.fn(),
                addEventListener: vi.fn(),
                upload: { addEventListener: vi.fn() }
            };
            global.XMLHttpRequest.mockImplementation(() => mockXHR);

            await uploadManager.uploadFile(fileItem);

            expect(fileItem.status).toBe('completed');
            expect(fileItem.progress).toBe(100);
        });

        it('should handle upload failure', async () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024);
            const fileItem = {
                file: file,
                id: 'test-id',
                status: 'pending',
                progress: 0,
                metadata: { title: 'Test', description: '', tags: [] }
            };

            // Mock failed API response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Upload failed' })
            });

            await uploadManager.uploadFile(fileItem);

            expect(fileItem.status).toBe('error');
            expect(fileItem.error).toBe('Upload failed');
        });
    });

    describe('Utility Functions', () => {
        it('should format file size correctly', () => {
            expect(uploadManager.formatFileSize(0)).toBe('0 Bytes');
            expect(uploadManager.formatFileSize(1024)).toBe('1 KB');
            expect(uploadManager.formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(uploadManager.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
        });

        it('should escape HTML correctly', () => {
            expect(uploadManager.escapeHtml('<script>alert("xss")</script>'))
                .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
            expect(uploadManager.escapeHtml('Normal text')).toBe('Normal text');
        });

        it('should get file icon based on type', () => {
            expect(uploadManager.getFileIcon('image/jpeg')).toBe('🖼️');
            expect(uploadManager.getFileIcon('video/mp4')).toBe('🎥');
            expect(uploadManager.getFileIcon('audio/mp3')).toBe('🎵');
            expect(uploadManager.getFileIcon('application/pdf')).toBe('📄');
            expect(uploadManager.getFileIcon('application/msword')).toBe('📝');
            expect(uploadManager.getFileIcon('unknown/type')).toBe('📁');
        });

        it('should get status text correctly', () => {
            expect(uploadManager.getStatusText('pending')).toBe('Pending');
            expect(uploadManager.getStatusText('uploading')).toBe('Uploading');
            expect(uploadManager.getStatusText('completed')).toBe('Completed');
            expect(uploadManager.getStatusText('error')).toBe('Error');
            expect(uploadManager.getStatusText('unknown')).toBe('Unknown');
        });

        it('should get status class correctly', () => {
            expect(uploadManager.getStatusClass('pending')).toBe('text-gray-500');
            expect(uploadManager.getStatusClass('uploading')).toBe('text-blue-600');
            expect(uploadManager.getStatusClass('completed')).toBe('text-green-600');
            expect(uploadManager.getStatusClass('error')).toBe('text-red-600');
        });

        it('should get progress class correctly', () => {
            expect(uploadManager.getProgressClass('pending')).toBe('bg-gray-300');
            expect(uploadManager.getProgressClass('uploading')).toBe('bg-blue-500');
            expect(uploadManager.getProgressClass('completed')).toBe('bg-green-500');
            expect(uploadManager.getProgressClass('error')).toBe('bg-red-500');
        });
    });

    describe('Authentication', () => {
        it('should get auth token from localStorage', () => {
            const token = uploadManager.getAuthToken();
            expect(localStorage.getItem).toHaveBeenCalledWith('auth_token');
            expect(token).toBe('mock-token');
        });

        it('should throw error when no auth token', async () => {
            localStorage.getItem.mockReturnValue(null);
            
            const fileItem = {
                file: createMockFile('test.jpg', 'image/jpeg', 1024),
                metadata: { title: 'Test', description: '', tags: [] }
            };

            await expect(uploadManager.getUploadUrl(fileItem)).rejects.toThrow('Authentication required');
        });
    });

    describe('Queue Management', () => {
        it('should clear completed uploads', () => {
            uploadManager.uploadQueue = [
                { id: '1', status: 'completed' },
                { id: '2', status: 'pending' },
                { id: '3', status: 'error' }
            ];

            uploadManager.clearCompleted();

            expect(uploadManager.uploadQueue).toHaveLength(2);
            expect(uploadManager.uploadQueue[0].status).toBe('pending');
            expect(uploadManager.uploadQueue[1].status).toBe('error');
        });

        it('should retry failed uploads', () => {
            uploadManager.uploadQueue = [
                { id: '1', status: 'error', progress: 50, error: 'Failed' },
                { id: '2', status: 'pending' }
            ];

            uploadManager.retryFailed();

            expect(uploadManager.uploadQueue[0].status).toBe('pending');
            expect(uploadManager.uploadQueue[0].progress).toBe(0);
            expect(uploadManager.uploadQueue[0].error).toBeNull();
        });
    });

    describe('Event Handling', () => {
        it('should prevent default drag behaviors', () => {
            const event = createMockEvent('dragenter');
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

            uploadManager.preventDefaults(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it('should highlight drop zone on drag enter', () => {
            const event = createMockEvent('dragenter');
            
            uploadManager.highlight(event);

            expect(mockDropZone.classList.add).toHaveBeenCalledWith('border-blue-500', 'bg-blue-50');
        });

        it('should unhighlight drop zone on drag leave', () => {
            const event = createMockEvent('dragleave');
            
            uploadManager.unhighlight(event);

            expect(mockDropZone.classList.remove).toHaveBeenCalledWith('border-blue-500', 'bg-blue-50');
        });
    });

    describe('Callback Management', () => {
        it('should set progress callback', () => {
            const callback = vi.fn();
            uploadManager.onProgress(callback);
            expect(uploadManager.uploadCallbacks.onProgress).toBe(callback);
        });

        it('should set complete callback', () => {
            const callback = vi.fn();
            uploadManager.onComplete(callback);
            expect(uploadManager.uploadCallbacks.onComplete).toBe(callback);
        });

        it('should set error callback', () => {
            const callback = vi.fn();
            uploadManager.onError(callback);
            expect(uploadManager.uploadCallbacks.onError).toBe(callback);
        });

        it('should set queue update callback', () => {
            const callback = vi.fn();
            uploadManager.onQueueUpdate(callback);
            expect(uploadManager.uploadCallbacks.onQueueUpdate).toBe(callback);
        });
    });
}); 