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
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    tokens: data.tokens,
                    user: data.user
                };
            } else {
                return {
                    success: false,
                    error: data.error || 'Login failed'
                };
            }
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Network error. Please try again.'
            };
        }
    }
    
    async register(username, password, email, name) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email, name })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    userId: data.user_id
                };
            } else {
                return {
                    success: false,
                    error: data.error || 'Registration failed'
                };
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'Network error. Please try again.'
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
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });
            
            const data = await response.json();
            return data.valid === true;
            
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