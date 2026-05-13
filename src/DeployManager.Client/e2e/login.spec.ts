import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard and stays there', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)

    // Fill in credentials
    await page.fill('#username', 'admin')
    await page.fill('#password', 'Admin123!')

    // Click Sign In button
    await page.click('button[type="submit"]')

    // Wait for SweetAlert success toast to appear
    const swalToast = page.locator('.swal2-popup')
    await expect(swalToast).toBeVisible({ timeout: 10000 })
    await expect(swalToast).toContainText('Inicio de sesión exitoso')

    // Wait for SweetAlert to close (1.5s timer)
    await expect(swalToast).not.toBeVisible({ timeout: 5000 })

    // Check localStorage has auth_user
    const storedUser = await page.evaluate(() => localStorage.getItem('auth_user'))
    expect(storedUser).not.toBeNull()

    // Verify we are on the dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    // Wait 3 seconds to confirm we stay on dashboard (no redirect back to login)
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
