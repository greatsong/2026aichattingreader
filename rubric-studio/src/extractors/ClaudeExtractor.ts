import { Page } from 'puppeteer';
import { BaseExtractor } from './BaseExtractor';
import { ScrapedResult, ChatMessage } from '../types/extractor';

export class ClaudeExtractor extends BaseExtractor {
    canHandle(url: string): boolean {
        return url.includes('claude.ai');
    }

    async extract(page: Page, url: string): Promise<ScrapedResult> {
        // 1. Wait for render (Claude is heavier, improved timeout)
        try {
            // Wait for the main chat container or a message
            await page.waitForSelector('.font-user-message, .font-claude-message', { timeout: 15000 });
        } catch {
            // Proceed to try extraction anyway, maybe it loaded fast
        }

        // 2. Extract Data using DOM Traversal
        const messages = await page.evaluate(() => {
            const data: ChatMessage[] = [];

            // Strategy: Find all message-like blocks.
            // Claude specific: .font-user-message and .font-claude-message seem to be persistent for typography

            // Re-querying all potential messages in order
            const potentialMessages = document.querySelectorAll('.font-user-message, .font-claude-message');

            potentialMessages.forEach(msg => {
                let role: 'user' | 'assistant' = 'assistant';
                if (msg.classList.contains('font-user-message')) {
                    role = 'user';
                }

                // Traverse up to find the full message text block, 
                // sometimes the font class is on a request, sometimes on an inner span.
                // For Claude, usually the text is directly within or close.
                const text = (msg as HTMLElement).innerText;

                if (text) {
                    data.push({ role, content: text });
                }
            });

            return data;
        });

        if (messages.length === 0) {
            throw new Error('E_LAYOUT_CHANGED: Could not extract any messages from Claude.');
        }

        return {
            platform: 'claude',
            url,
            title: await page.title(),
            messages
        };
    }
}
