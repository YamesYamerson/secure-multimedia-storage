/**
 * Secure File Sharing System - Frontend Application
 * Phase 1, Milestone 1.4 - Frontend Authentication
 * 
 * Main application entry point with authentication and file management
 */

import { AuthManager } from './auth.js';
import { FileManager } from './files.js';
import { UI } from './ui.js';

class SecureFileApp {
    constructor() {
        this.auth = new AuthManager();
        this.files = new FileManager();
        this.ui = new UI();
        
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Show loading screen
            this.ui.showLoading();
            
            // Check for existing session
            const token = localStorage.getItem('access_token');
            if (token) {
                const isValid = await this.auth.verifyToken(token);
                if (isValid) {
                    this.isAuthenticated = true;
                    this.currentUser = JSON.parse(localStorage.getItem('user'));
                    this.showMainApp();
                } else {
                    this.clearSession();
                    this.showAuth();
                }
            } else {
                this.showAuth();
            }
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showAuth();
        } finally {
            this.ui.hideLoading();
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Authentication form
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }
        
        // Toggle auth mode
        const toggleAuthBtn = document.getElementById('toggle-auth-mode');
        if (toggleAuthBtn) {
            toggleAuthBtn.addEventListener('click', () => this.toggleAuthMode());
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // File upload
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Search and sort
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value));
        }
        
        // Drag and drop for file upload
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const dropZone = document.querySelector('.border-dashed');
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }
    
    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        
        if (!username || !password) {
            this.ui.showError('Please fill in all fields');
            return;
        }
        
        try {
            this.ui.showLoading();
            
            const isLoginMode = document.getElementById('auth-title').textContent === 'Sign In';
            
            if (isLoginMode) {
                await this.handleLogin(username, password);
            } else {
                await this.handleRegister(username, password);
            }
            
        } catch (error) {
            console.error('Authentication error:', error);
            this.ui.showError(error.message || 'Authentication failed');
        } finally {
            this.ui.hideLoading();
        }
    }
    
    async handleLogin(username, password) {
        const response = await this.auth.login(username, password);
        
        if (response.success) {
            this.isAuthenticated = true;
            this.currentUser = response.user;
            
            // Store session data
            localStorage.setItem('access_token', response.tokens.access_token);
            localStorage.setItem('refresh_token', response.tokens.refresh_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            this.showMainApp();
            this.ui.showSuccess('Login successful!');
        } else {
            throw new Error(response.error || 'Login failed');
        }
    }
    
    async handleRegister(username, password) {
        const response = await this.auth.register(username, password);
        
        if (response.success) {
            this.ui.showSuccess('Registration successful! Please check your email for confirmation.');
            this.toggleAuthMode(); // Switch back to login
        } else {
            throw new Error(response.error || 'Registration failed');
        }
    }
    
    async handleLogout() {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await this.auth.logout(token);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            this.showAuth();
        }
    }
    
    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.isAuthenticated = false;
        this.currentUser = null;
    }
    
    toggleAuthMode() {
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        const submitBtn = document.getElementById('auth-submit');
        const toggleBtn = document.getElementById('toggle-auth-mode');
        
        const isLoginMode = title.textContent === 'Sign In';
        
        if (isLoginMode) {
            // Switch to register mode
            title.textContent = 'Create Account';
            subtitle.textContent = 'Join your family\'s secure file storage';
            submitBtn.textContent = 'Sign Up';
            toggleBtn.textContent = 'Already have an account? Sign in';
        } else {
            // Switch to login mode
            title.textContent = 'Sign In';
            subtitle.textContent = 'Access your secure family file storage';
            submitBtn.textContent = 'Sign In';
            toggleBtn.textContent = 'Need an account? Sign up';
        }
        
        // Clear form
        document.getElementById('auth-form').reset();
        this.ui.hideError();
    }
    
    showAuth() {
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('storage-section').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
    }
    
    showMainApp() {
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('storage-section').classList.remove('hidden');
        
        // Show user info
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        userInfo.classList.remove('hidden');
        userName.textContent = this.currentUser?.name || this.currentUser?.username || 'User';
        
        // Load files
        this.loadFiles();
    }
    
    async loadFiles() {
        try {
            this.ui.showFilesLoading();
            
            const files = await this.files.getFiles();
            this.ui.displayFiles(files);
            
        } catch (error) {
            console.error('Error loading files:', error);
            this.ui.showError('Failed to load files');
        }
    }
    
    async handleFileUpload(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
    }
    
    async handleFiles(files) {
        if (files.length === 0) return;
        
        try {
            this.ui.showUploadProgress();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;
                
                this.ui.updateUploadProgress(progress, `Uploading ${file.name}...`);
                
                await this.files.uploadFile(file);
            }
            
            this.ui.hideUploadProgress();
            this.ui.showSuccess('Files uploaded successfully!');
            
            // Reload files list
            this.loadFiles();
            
        } catch (error) {
            console.error('Upload error:', error);
            this.ui.hideUploadProgress();
            this.ui.showError('Upload failed: ' + error.message);
        }
    }
    
    async handleSearch(query) {
        try {
            const files = await this.files.searchFiles(query);
            this.ui.displayFiles(files);
        } catch (error) {
            console.error('Search error:', error);
        }
    }
    
    async handleSort(sortBy) {
        try {
            const files = await this.files.getFiles(sortBy);
            this.ui.displayFiles(files);
        } catch (error) {
            console.error('Sort error:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecureFileApp();
});

// Export for testing
export { SecureFileApp }; 