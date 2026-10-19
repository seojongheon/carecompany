import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",testMatch:["auth.spec.ts","operations-smoke.spec.ts"],fullyParallel:true,
 reporter:[["list"]],use:{baseURL:process.env.SMOKE_BASE_URL??"http://127.0.0.1:3100",trace:"off"},
 projects:[{name:"desktop-smoke",use:{...devices["Desktop Chrome"],viewport:{width:1440,height:900}}},{name:"mobile-smoke",use:{...devices["Pixel 5"],viewport:{width:390,height:844}}}],
});
