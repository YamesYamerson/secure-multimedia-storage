/**
 * Authentication Manager for Secure File Sharing System
 * Handles AWS Cognito authentication and session management
 */

export class AuthManager {
    constructor() {
        // For development, use localhost. In production, these would be environment variables
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : 'https://api.secure-multimedia-storage.com';
        this.userPoolId = 'us-east-1_xxxxxxxxx'; // Will be configured when AWS is set up
        this.clientId = 'xxxxxxxxxxxxxxxxxxxxxxxxxx'; // Will be configured when AWS is set up
    }
    
    async login(username, password) {
        // DEVELOPMENT MODE: Accept any input for placeholder authentication
        // This will be replaced with proper OAuth later
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Accept any non-empty username and password
            if (username && password && username.trim() && password.trim()) {
                const mockUser = {
                    id: 'dev-user-001',
                    username: username,
                    email: `${username}@example.com`,
                    name: username,
                    created_at: new Date().toISOString()
                };
                
                const mockToken = {
                    access_token: `dev-token-${Date.now()}`,
                    refresh_token: `dev-refresh-${Date.now()}`,
                    expires_in: 3600
                };
                
                // Store in localStorage for development
                localStorage.setItem('access_token', mockToken.access_token);
                localStorage.setItem('refresh_token', mockToken.refresh_token);
                localStorage.setItem('user', JSON.stringify(mockUser));
                
                return {
                    success: true,
                    tokens: mockToken,
                    user: mockUser
                };
            } else {
                return {
                    success: false,
                    error: 'Username and password are required'
                };
            }
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Login failed. Please try again.'
            };
        }
    }
    
    async register(username, password, email, name) {
        // DEVELOPMENT MODE: Accept any input for placeholder registration
        // This will be replaced with proper OAuth later
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Accept any non-empty input
            if (username && password && username.trim() && password.trim()) {
                const mockUserId = `dev-user-${Date.now()}`;
                
                return {
                    success: true,
                    message: 'Registration successful! You can now log in.',
                    userId: mockUserId
                };
            } else {
                return {
                    success: false,
                    error: 'Username and password are required'
                };
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'Registration failed. Please try again.'
            };
        }
    }
    
    async logout(accessToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_token: accessToken })
            });
            
            return response.ok;
            
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }
    
    async verifyToken(token) {
        // DEVELOPMENT MODE: Accept any dev token
        // This will be replaced with proper JWT verification later
        try {
            // Accept any token that starts with 'dev-token-'
            if (token && token.startsWith('dev-token-')) {
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }
    
    async refreshToken(refreshToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    access_token: data.access_token,
                    id_token: data.id_token
                };
            } else {
                return {
                    success: false,
                    error: data.error || 'Token refresh failed'
                };
            }
            
        } catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                error: 'Network error during token refresh'
            };
        }
    }
    
    getStoredToken() {
        return localStorage.getItem('access_token');
    }
    
    getStoredRefreshToken() {
        return localStorage.getItem('refresh_token');
    }
    
    isTokenExpired(token) {
        if (!token) return true;
        
        // DEVELOPMENT MODE: Dev tokens never expire
        // This will be replaced with proper JWT expiration check later
        if (token.startsWith('dev-token-')) {
            return false;
        }
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (error) {
            console.error('Token parsing error:', error);
            return true;
        }
    }
    
    async getValidToken() {
        let token = this.getStoredToken();
        
        if (!token || this.isTokenExpired(token)) {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
                const refreshResult = await this.refreshToken(refreshToken);
                if (refreshResult.success) {
                    localStorage.setItem('access_token', refreshResult.access_token);
                    token = refreshResult.access_token;
                } else {
                    // Refresh failed, clear session
                    this.clearStoredTokens();
                    return null;
                }
            } else {
                return null;
            }
        }
        
        return token;
    }
    
    clearStoredTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
} 