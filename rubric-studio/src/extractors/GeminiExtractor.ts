import { Page } from 'puppeteer';
import { BaseExtractor } from './BaseExtractor';
import { ScrapedResult, ChatMessage } from '../types/extractor';

export class GeminiExtractor extends BaseExtractor {
    canHandle(url: string): boolean {
        return url.includes('gemini.google.com') || url.includes('g.co/gemini');
    }

    async extract(page: Page, url: string): Promise<ScrapedResult> {
        // 1. Wait for render
        try {
            await page.waitForSelector('message-content, [role="article"]', { timeout: 10000 });
        } catch {
            // ignore
        }

        // 2. Extract Data using DOM Traversal
        const messages = await page.evaluate(() => {
            const data: ChatMessage[] = [];

            // Gemini often uses <message-content> or standard Angular components
            // Also check for role="article" which is good for accessibility and scraping
            const nodes = document.querySelectorAll('message-content, [role="article"]');

            nodes.forEach(node => {
                let role: 'user' | 'assistant' | 'unknown' = 'unknown';

                // Heuristic for role:
                // Check for dataset attributes or nearby profile images
                const textContent = (node as HTMLElement).innerText;

                // In shared pages, the layout is slightly different than the app.
                // Often User/Model labels are present.

                // Try to find a preceding sibling or parent that indicates role
                // This is tricky without exact DOM structure.

                // Assumption: The message-content often has a attribute like [is-model] or similar class
                // Alternative: Check for "User" or "Gemini" headers nearby
                // Traversing up to find a container
                const container = node.closest('.conversation-turn') || node.parentElement;
                if (container) {
                    const header = container.querySelector('h2, .role-label, .author-name');
                    if (header) {
                        const headerText = (header as HTMLElement).innerText.toLowerCase();
                        if (headerText.includes('gemini') || headerText.includes('model')) role = 'assistant';
                        if (headerText.includes('user') || headerText.includes('you')) role = 'user';
                    }
                }

                // Fallback if role is still unknown but we found text:
                // We might alternate roles if we assume a conversation flow? 
                // Unsafe. Default to unknown.

                // Let's rely on a more specific selector if possible.
                // In many Google apps, `data-test-id` or distinct directives are used.
                // Let's assume non-empty text is relevant.

                if (textContent.trim().length > 0) {
                    data.push({ role, content: textContent });
                }
            });

            return data;
        });

        if (messages.length === 0) {
            throw new Error('E_LAYOUT_CHANGED: Could not extract any messages from Gemini.');
        }

        return {
            platform: 'gemini',
            url,
            title: await page.title(),
            messages
        };
    }
}
