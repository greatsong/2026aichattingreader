import { NextRequest, NextResponse } from 'next/server';
import { getBrowser } from '@/lib/browser';
import { ExtractorFactory } from '@/extractors/ExtractorFactory';
import { type Browser } from 'puppeteer-core';

// This API route handles the POST request to scrape chat data from a shared URL.
// It manages the browser lifecycle carefully to avoid memory leaks.

export async function POST(req: NextRequest) {
    let browser: Browser | null = null;

    try {
        const body = await req.json();
        const { url } = body;

        // 1. Validation
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'Invalid URL provided.' },
                { status: 400 }
            );
        }

        // 2. Extractor Selection (Fast-fail if URL is not supported)
        // We try to get the extractor first to avoid launching a browser if the URL is invalid.
        let extractor;
        try {
            extractor = ExtractorFactory.getExtractor(url);
        } catch (e: unknown) {
            return NextResponse.json(
                { error: e instanceof Error ? e.message : 'Unsupported URL' },
                { status: 400 }
            );
        }

        // 3. Browser Launch
        browser = await getBrowser();
        const page = await browser.newPage();

        // 4. Extraction
        // Stealth settings are already applied in getBrowser()

        // Set a reasonable timeout for the navigation
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const result = await extractor.extract(page, url);

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error('Scraping failed:', error);

        // Differentiate between known errors (layout changed) and unknown (timeout, etc)
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    } finally {
        // 5. Cleanup
        if (browser) {
            await browser.close();
        }
    }
}
