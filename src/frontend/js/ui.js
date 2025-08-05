/**
 * UI Manager for Secure File Sharing System
 * Handles user interface interactions and display
 */

export class UI {
    constructor() {
        this.alertTimeout = null;
    }
    
    // Loading states
    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
    
    showFilesLoading() {
        this.hideAllFileStates();
        const loading = document.getElementById('files-loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    hideAllFileStates() {
        const states = ['files-loading', 'files-empty', 'files-list'];
        states.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }
    
    // Upload progress
    showUploadProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.classList.remove('hidden');
        }
    }
    
    hideUploadProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.classList.add('hidden');
        }
    }
    
    updateUploadProgress(percentage, text) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = text;
        }
    }
    
    // File display
    displayFiles(files) {
        this.hideAllFileStates();
        
        if (!files || files.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.showFilesList(files);
    }
    
    showEmptyState() {
        const empty = document.getElementById('files-empty');
        if (empty) {
            empty.classList.remove('hidden');
        }
    }
    
    showFilesList(files) {
        const list = document.getElementById('files-list');
        if (!list) return;
        
        list.classList.remove('hidden');
        list.innerHTML = '';
        
        files.forEach(file => {
            const fileElement = this.createFileElement(file);
            list.appendChild(fileElement);
        });
    }
    
    createFileElement(file) {
        const div = document.createElement('div');
        div.className = 'file-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200';
        
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        const uploadDate = this.formatDate(file.uploaded_at);
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="file-icon ${fileIcon.class}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            ${fileIcon.svg}
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">${this.escapeHtml(file.filename)}</h4>
                        <p class="text-xs text-gray-500">${fileSize} • Uploaded ${uploadDate}</p>
                        <p class="text-xs text-gray-400">by ${this.escapeHtml(file.uploaded_by)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="download-btn text-primary-600 hover:text-primary-700 p-2 rounded-md hover:bg-primary-50" 
                            data-file-id="${file.file_id}" title="Download">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50" 
                            data-file-id="${file.file_id}" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const downloadBtn = div.querySelector('.download-btn');
        const deleteBtn = div.querySelector('.delete-btn');
        
        downloadBtn.addEventListener('click', () => this.handleDownload(file.file_id));
        deleteBtn.addEventListener('click', () => this.handleDelete(file.file_id, file.filename));
        
        return div;
    }
    
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) {
            return {
                class: 'image',
                svg: '<path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />'
            };
        }
        if (fileType.startsWith('video/')) {
            return {
                class: 'video',
                svg: '<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />'
            };
        }
        if (fileType.startsWith('audio/')) {
            return {
                class: 'audio',
                svg: '<path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />'
            };
        }
        if (fileType.includes('pdf')) {
            return {
                class: 'document',
                svg: '<path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />'
            };
        }
        if (fileType.includes('zip') || fileType.includes('rar')) {
            return {
                class: 'archive',
                svg: '<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />'
            };
        }
        return {
            class: 'document',
            svg: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
        };
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Error handling
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showWarning(message) {
        this.showAlert(message, 'warning');
    }
    
    showInfo(message) {
        this.showAlert(message, 'info');
    }
    
    showAlert(message, type = 'info') {
        // Clear existing alert
        this.hideAlert();
        
        // Create alert element
        const alert = document.createElement('div');
        alert.id = 'alert';
        alert.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
        
        alert.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    ${this.getAlertIcon(type)}
                    <p class="ml-2 text-sm">${this.escapeHtml(message)}</p>
                </div>
                <button class="ml-4 text-sm hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-hide after 5 seconds
        this.alertTimeout = setTimeout(() => {
            this.hideAlert();
        }, 5000);
    }
    
    hideAlert() {
        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }
        
        const alert = document.getElementById('alert');
        if (alert) {
            alert.remove();
        }
    }
    
    getAlertIcon(type) {
        const icons = {
            success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
            error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
            warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>',
            info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
        };
        
        return icons[type] || icons.info;
    }
    
    hideError() {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    // File operations
    async handleDownload(fileId) {
        try {
            // This would typically call the FileManager
            this.showInfo('Download started...');
            // Implementation would be in the main app
        } catch (error) {
            this.showError('Download failed: ' + error.message);
        }
    }
    
    async handleDelete(fileId, filename) {
        if (confirm(`Are you sure you want to delete "${filename}"?`)) {
            try {
                // This would typically call the FileManager
                this.showInfo('File deleted successfully');
                // Implementation would be in the main app
            } catch (error) {
                this.showError('Delete failed: ' + error.message);
            }
        }
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
} 