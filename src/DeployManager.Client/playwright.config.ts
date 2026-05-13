import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'dotnet run --project ../DeployManager.Api',
      port: 5042,
      timeout: 60000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      port: 5173,
  timeout: 60000,
      reuseExistingServer: true,
    },
  ],
})
