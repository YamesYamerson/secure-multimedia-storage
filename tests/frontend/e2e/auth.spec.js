/**
 * E2E tests for authentication workflow
 * Tests the complete user authentication experience
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display login form by default', async ({ page }) => {
    // Check that the login form is visible
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#auth-title')).toHaveText('Sign In');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#auth-submit')).toHaveText('Sign In');
  });

  test('should switch to registration mode', async ({ page }) => {
    // Click the toggle button to switch to registration
    await page.click('#toggle-auth-mode');
    
    // Verify the form has switched to registration mode
    await expect(page.locator('#auth-title')).toHaveText('Create Account');
    await expect(page.locator('#auth-submit')).toHaveText('Sign Up');
    await expect(page.locator('#toggle-auth-mode')).toHaveText('Already have an account? Sign in');
  });

  test('should switch back to login mode', async ({ page }) => {
    // First switch to registration mode
    await page.click('#toggle-auth-mode');
    
    // Then switch back to login mode
    await page.click('#toggle-auth-mode');
    
    // Verify the form has switched back to login mode
    await expect(page.locator('#auth-title')).toHaveText('Sign In');
    await expect(page.locator('#auth-submit')).toHaveText('Sign In');
    await expect(page.locator('#toggle-auth-mode')).toHaveText('Need an account? Sign up');
  });

  test('should show error for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.click('#auth-submit');
    
    // Check that form validation prevents submission
    // (This would typically show browser validation messages)
    await expect(page.locator('#username')).toBeFocused();
  });

  test('should show error for missing password', async ({ page }) => {
    // Fill only username
    await page.fill('#username', 'testuser');
    
    // Try to submit
    await page.click('#auth-submit');
    
    // Check that password field is required
    await expect(page.locator('#password')).toBeFocused();
  });

  test('should show error for missing username', async ({ page }) => {
    // Fill only password
    await page.fill('#password', 'testpass');
    
    // Try to submit
    await page.click('#auth-submit');
    
    // Check that username field is required
    await expect(page.locator('#username')).toBeFocused();
  });

  test('should handle form input correctly', async ({ page }) => {
    // Fill in the form fields
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpassword123');
    
    // Verify the values are set correctly
    await expect(page.locator('#username')).toHaveValue('testuser');
    await expect(page.locator('#password')).toHaveValue('testpassword123');
  });

  test('should clear form when switching modes', async ({ page }) => {
    // Fill in the form
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    
    // Switch to registration mode
    await page.click('#toggle-auth-mode');
    
    // Verify form is cleared
    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify form is still accessible and properly styled
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#auth-form')).toBeVisible();
    
    // Check that form elements are properly sized for mobile
    const usernameField = page.locator('#username');
    const passwordField = page.locator('#password');
    const submitButton = page.locator('#auth-submit');
    
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Navigate through form fields using Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('#username')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#auth-submit')).toBeFocused();
  });

  test('should handle Enter key submission', async ({ page }) => {
    // Fill in the form
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    
    // Submit using Enter key
    await page.keyboard.press('Enter');
    
    // Verify form validation or submission attempt
    // (In a real app, this would trigger the form submission)
  });

  test('should maintain focus after error display', async ({ page }) => {
    // Fill in invalid data and submit
    await page.fill('#username', 'testuser');
    await page.fill('#password', '');
    await page.click('#auth-submit');
    
    // Verify password field maintains focus for correction
    await expect(page.locator('#password')).toBeFocused();
  });
});

test.describe('Authentication API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });

    // Fill and submit login form
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    await page.click('#auth-submit');
    
    // Verify successful login (would show main app)
    // This would typically navigate to the main application
    await expect(page.locator('#storage-section')).toBeVisible();
  });

  test('should handle login failure', async ({ page }) => {
    // Mock failed login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      });
    });

    // Fill and submit login form
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'wrongpass');
    await page.click('#auth-submit');
    
    // Verify error message is displayed
    await expect(page.locator('#auth-error')).toBeVisible();
    await expect(page.locator('#auth-error p')).toContainText('Invalid credentials');
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed');
    });

    // Fill and submit login form
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    await page.click('#auth-submit');
    
    // Verify error message is displayed
    await expect(page.locator('#auth-error')).toBeVisible();
    await expect(page.locator('#auth-error p')).toContainText('Network error');
  });
});

test.describe('Session Management', () => {
  test('should redirect to main app if already authenticated', async ({ page }) => {
    // Mock existing session
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'existing-token');
      localStorage.setItem('user', JSON.stringify({
        username: 'testuser',
        name: 'Test User'
      }));
    });

    // Navigate to app
    await page.goto('/');
    
    // Should skip login and go directly to main app
    await expect(page.locator('#storage-section')).toBeVisible();
    await expect(page.locator('#auth-section')).not.toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'existing-token');
      localStorage.setItem('user', JSON.stringify({
        username: 'testuser',
        name: 'Test User'
      }));
    });

    // Navigate to app
    await page.goto('/');
    
    // Click logout button
    await page.click('#logout-btn');
    
    // Should return to login screen
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#storage-section')).not.toBeVisible();
  });
}); 