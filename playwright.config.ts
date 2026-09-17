import {defineConfig} from "@playwright/test";
export default defineConfig({testDir:"tests/e2e",timeout:60000,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL??"http://localhost:3000",trace:"retain-on-failure"},webServer:process.env.PLAYWRIGHT_EXTERNAL_SERVER?undefined:{command:"pnpm dev",url:"http://127.0.0.1:3000/api/health",reuseExistingServer:true,timeout:120000}});
