import puppeteerCore, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium'; // This will be used in Vercel
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// We need to conditionally load the full puppeteer in local development
// to avoid bundling it in Vercel/Lambda where size matters.

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

export async function getBrowser(): Promise<Browser> {
    // Apply stealth plugin
    // Note: We need to apply it to the specific instance we use

    if (isProduction) {
        // ---------------------------------------------------------
        // VERCEL / LAMBDA ENVIRONMENT
        // ---------------------------------------------------------
        console.log('🚀 Launching Puppeteer Core (Vercel Mode)...');

        // We utilize puppeteer-extra's addExtra to wrap puppeteer-core
        // This allows us to use stealth plugin with core.

        // Explicitly casting to avoid type mismatch if versions drift slightly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const puppeteer = addExtra(puppeteerCore as any);
        puppeteer.use(StealthPlugin());

        const executablePath = await chromium.executablePath();

        return puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: { width: 1920, height: 1080 },
            executablePath,
            headless: true,
        }) as unknown as Promise<Browser>;
    } else {
        // ---------------------------------------------------------
        // LOCAL DEVELOPMENT ENVIRONMENT
        // ---------------------------------------------------------
        console.log('💻 Launching Puppeteer Full (Local Mode)...');

        try {
            // Dynamic import to prevent 'puppeteer' from being included in the production bundle
            const { default: puppeteerFull } = await import('puppeteer');

            const puppeteer = addExtra(puppeteerFull);
            puppeteer.use(StealthPlugin());

            return puppeteer.launch({
                headless: false, // Run visible for debugging
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1280, height: 800 }
            }) as unknown as Promise<Browser>;
        } catch (error) {
            console.error("❌ Failed to launch local puppeteer. Make sure 'puppeteer' is installed in devDependencies.");
            throw error;
        }
    }
}
