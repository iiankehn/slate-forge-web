import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,timeout:90000,expect:{timeout:15000},retries:process.env.CI?1:0,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173/slate-forge-web/',acceptDownloads:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:{command:'node scripts/serve-dist.mjs',url:'http://127.0.0.1:4173/slate-forge-web/',reuseExistingServer:false,timeout:15000},
 projects:[{name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1280,height:900}}},{name:'desktop-firefox',use:{browserName:'firefox',viewport:{width:1280,height:900}}},{name:'desktop-webkit',use:{browserName:'webkit',viewport:{width:1280,height:900}}},{name:'phone-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},{name:'phone-webkit',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});
