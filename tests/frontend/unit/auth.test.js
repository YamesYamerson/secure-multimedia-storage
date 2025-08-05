/**
 * Unit tests for authentication module
 * Tests the AuthManager class functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthManager } from '../../../src/frontend/js/auth.js'

describe('AuthManager', () => {
  let authManager
  let mockFetch

  beforeEach(() => {
    authManager = new AuthManager()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            id_token: 'test-id-token'
          },
          user: {
            username: 'testuser',
            name: 'Test User'
          }
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.login('testuser', 'password123')

      expect(result.success).toBe(true)
      expect(result.tokens.access_token).toBe('test-access-token')
      expect(result.user.username).toBe('testuser')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.secure-multimedia-storage.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        })
      )
    })

    it('should handle login failure', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Invalid credentials'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.login('testuser', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await authManager.login('testuser', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error. Please try again.')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Registration successful',
          user_id: 'test-user-id'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.register('newuser', 'password123', 'test@example.com', 'New User')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Registration successful')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.secure-multimedia-storage.com/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            password: 'password123',
            email: 'test@example.com',
            name: 'New User'
          })
        })
      )
    })

    it('should handle registration failure', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Username already exists'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.register('existinguser', 'password123', 'test@example.com', 'Test User')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username already exists')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          valid: true,
          user: {
            username: 'testuser',
            attributes: { email: 'test@example.com' }
          }
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.verifyToken('valid-token')

      expect(result).toBe(true)
    })

    it('should reject invalid token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          valid: false,
          error: 'Token expired'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.verifyToken('invalid-token')

      expect(result).toBe(false)
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'new-access-token',
          id_token: 'new-id-token'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.refreshToken('valid-refresh-token')

      expect(result.success).toBe(true)
      expect(result.access_token).toBe('new-access-token')
    })

    it('should handle refresh failure', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Refresh token expired'
        })
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authManager.refreshToken('expired-refresh-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Refresh token expired')
    })
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzQ1Njc4NzB9.signature'
      expect(authManager.isTokenExpired(expiredToken)).toBe(true)
    })

    it('should return false for valid token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature'
      expect(authManager.isTokenExpired(validToken)).toBe(false)
    })

    it('should return true for invalid token', () => {
      expect(authManager.isTokenExpired('invalid-token')).toBe(true)
    })

    it('should return true for null token', () => {
      expect(authManager.isTokenExpired(null)).toBe(true)
    })
  })

  describe('getValidToken', () => {
    it('should return stored token if valid', async () => {
      const validToken = 'valid-token'
      localStorage.setItem('access_token', validToken)
      vi.spyOn(authManager, 'isTokenExpired').mockReturnValue(false)

      const result = await authManager.getValidToken()

      expect(result).toBe(validToken)
    })

    it('should refresh token if expired', async () => {
      const expiredToken = 'expired-token'
      const refreshToken = 'refresh-token'
      const newToken = 'new-token'
      
      localStorage.setItem('access_token', expiredToken)
      localStorage.setItem('refresh_token', refreshToken)
      
      vi.spyOn(authManager, 'isTokenExpired')
        .mockReturnValueOnce(true) // First call for access token
        .mockReturnValue(false) // Second call for new token
      
      vi.spyOn(authManager, 'refreshToken').mockResolvedValue({
        success: true,
        access_token: newToken
      })

      const result = await authManager.getValidToken()

      expect(result).toBe(newToken)
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', newToken)
    })

    it('should return null if refresh fails', async () => {
      const expiredToken = 'expired-token'
      const refreshToken = 'refresh-token'
      
      localStorage.setItem('access_token', expiredToken)
      localStorage.setItem('refresh_token', refreshToken)
      
      vi.spyOn(authManager, 'isTokenExpired').mockReturnValue(true)
      vi.spyOn(authManager, 'refreshToken').mockResolvedValue({
        success: false,
        error: 'Refresh failed'
      })

      const result = await authManager.getValidToken()

      expect(result).toBe(null)
    })
  })

  describe('clearStoredTokens', () => {
    it('should clear all stored tokens', () => {
      localStorage.setItem('access_token', 'token1')
      localStorage.setItem('refresh_token', 'token2')
      localStorage.setItem('user', 'userdata')

      authManager.clearStoredTokens()

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })
}) 