import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'

async function createZipFile(files: { name: string; content: string }[]): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-e2e-'))
  for (const f of files) {
    const fullPath = path.join(tmpDir, f.name)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, f.content)
  }
  const zipPath = path.join(os.tmpdir(), `deploy-test-${Date.now()}.zip`)
  execSync(
    `powershell -Command "Compress-Archive -Path '${tmpDir}\\*' -DestinationPath '${zipPath}' -Force"`,
  )
  fs.rmSync(tmpDir, { recursive: true, force: true })
  return zipPath
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.fill('#username', 'admin')
  await page.fill('#password', 'Admin123!')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
}

async function seedEnvAndSite(page: import('@playwright/test').Page): Promise<void> {
  const token = await page.evaluate(() => {
    const stored = localStorage.getItem('auth_user')
    if (!stored) return null
    return JSON.parse(stored).token
  })
  if (!token) throw new Error('No auth token')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const ts = Date.now()

  // Create environment with unique name per test
  const envRes = await page.request.post('/api/environments', {
    data: { name: `Test E2E ${ts}`, description: 'Entorno de prueba', targetType: 'IIS', targetUrl: 'http://test.local' },
    headers,
  })
  if (!envRes.ok()) {
    const body = await envRes.text()
    throw new Error(`Failed to create environment: ${envRes.status()} ${body}`)
  }
  const envId = String(await envRes.json())
  if (!envId) throw new Error('Could not get environment ID')

  // Create site
  const siteRes = await page.request.post('/api/sites', {
    data: { code: `E2E-${ts}`, name: 'Sitio E2E', environmentId: envId, targetType: 'IIS', rootPath: 'C:\\sites\\e2e' },
    headers,
  })
  if (!siteRes.ok()) {
    const body = await siteRes.text()
    throw new Error(`Failed to create site: ${siteRes.status()} ${body}`)
  }
}

async function selectFirstSite(page: import('@playwright/test').Page) {
  await page.goto('/new-deploy')
  await expect(page).toHaveURL(/\/new-deploy/)
  // Wait for sites to load from API
  await page.waitForSelector('button.rounded-xl.border-2', { timeout: 20000 })
  const siteCards = page.locator('button.rounded-xl.border-2')
  await expect(siteCards.first()).toBeVisible({ timeout: 5000 })
  await siteCards.first().click()
  await page.click('text=Siguiente: Subir Paquete')
}

test.describe('Módulo de Despliegue — Subida de Paquetes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await seedEnvAndSite(page)
  })

  test('TC1: Rechazar archivo que no es ZIP', async ({ page }) => {
    await selectFirstSite(page)

    const nonZipPath = path.join(os.tmpdir(), `test-${Date.now()}.txt`)
    fs.writeFileSync(nonZipPath, 'this is not a zip file')

    const fileInput = page.locator('input#zip-upload')
    await fileInput.setInputFiles(nonZipPath)
    await page.click('text=Siguiente: Vista Previa')

    // Backend validates .zip extension and returns 400 with {"error":"Only ZIP files are allowed."}
    await expect(page.locator('text=Error al subir')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Error al subir')).toContainText('Only ZIP files are allowed')

    fs.unlinkSync(nonZipPath)
  })

  test('TC2: ZIP con contenido que no coincide con reglas muestra preview con acciones por defecto', async ({ page }) => {
    await selectFirstSite(page)

    const zipPath = await createZipFile([
      { name: 'readme.txt', content: 'hello' },
      { name: 'data.csv', content: 'a,b,c' },
      { name: 'assets/image.png', content: 'fake-png-bytes' },
    ])

    const fileInput = page.locator('input#zip-upload')
    await fileInput.setInputFiles(zipPath)
    await page.click('text=Siguiente: Vista Previa')

    // Preview step renders after successful upload
    await expect(page.locator('text=Vista Previa de Cambios')).toBeVisible({ timeout: 20000 })

    // All files from the ZIP appear in preview
    await expect(page.locator('text=readme.txt')).toBeVisible()
    await expect(page.locator('text=data.csv')).toBeVisible()
    await expect(page.locator('text=assets/image.png')).toBeVisible()

    // Files without matching rules get default action "Copiar y Sobrescribir"
    await expect(page.locator('text=Copiar y Sobrescribir').first()).toBeVisible()

    // Summary shows file count
    await expect(page.locator('text=archivo(s) en')).toBeVisible()

    fs.unlinkSync(zipPath)
  })

  test('TC3: Interfaz muestra límite de tamaño de archivo (500 MB)', async ({ page }) => {
    await selectFirstSite(page)

    // UI must display the max file size constraint
    await expect(page.locator('text=máx 500 MB')).toBeVisible()
  })

  test('TC4: Flujo exitoso — subir ZIP, previsualizar y confirmar despliegue', async ({ page }) => {
    await selectFirstSite(page)

    const zipPath = await createZipFile([
      { name: 'bin/app.dll', content: 'fake-dll' },
      { name: 'bin/app.pdb', content: 'fake-pdb' },
      { name: 'Views/Home/index.cshtml', content: 'fake-view' },
      { name: 'Web.config', content: 'fake-config' },
    ])

    // === STEP 2: Upload ZIP ===
    const fileInput = page.locator('input#zip-upload')
    await fileInput.setInputFiles(zipPath)
    await page.click('text=Siguiente: Vista Previa')

    await expect(page.locator('text=Vista Previa de Cambios')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=bin/app.dll')).toBeVisible()
    await expect(page.locator('text=bin/app.pdb')).toBeVisible()
    await expect(page.locator('text=Views/Home/index.cshtml')).toBeVisible()
    await expect(page.locator('text=Web.config')).toBeVisible()

    // === STEP 3: Confirm ===
    await page.click('text=Siguiente: Confirmar')
    await expect(page.locator('text=Revisa el resumen a continuación')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Archivos totales')).toBeVisible()
    await expect(page.locator('dt:has-text("Archivos totales") + dd')).toHaveText('4')

    // === STEP 4: Deploy ===
    await page.click('text=Iniciar Despliegue')
    await expect(page.locator('text=Progreso del Despliegue')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=Despliegue #')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Registro de despliegue')).toBeVisible()

    fs.unlinkSync(zipPath)
  })
})
