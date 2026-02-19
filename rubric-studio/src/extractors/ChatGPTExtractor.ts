import { Page } from 'puppeteer';
import { BaseExtractor } from './BaseExtractor';
import { ScrapedResult, ChatMessage } from '../types/extractor';

export class ChatGPTExtractor extends BaseExtractor {
    canHandle(url: string): boolean {
        return url.includes('chatgpt.com') || url.includes('openai.com');
    }

    async extract(page: Page, url: string): Promise<ScrapedResult> {
        // 1. Wait for render (prioritizing the conversation turn data attribute)
        try {
            await page.waitForSelector('[data-testid^="conversation-turn-"]', { timeout: 10000 });
        } catch {
            // Fallback or explicit check if it's just slow
        }

        // 2. Extract Data using DOM Traversal
        const messages = await page.evaluate(() => {
            const data: ChatMessage[] = [];
            // Use the stable data-testid if available
            const turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');

            if (turns.length > 0) {
                // Strategy A: Best Practice (Data Attributes)
                turns.forEach(turn => {
                    const roleEl = turn.querySelector('[data-message-author-role]');
                    const roleAttr = roleEl?.getAttribute('data-message-author-role');
                    const role = roleAttr === 'user' ? 'user' : (roleAttr === 'assistant' ? 'assistant' : 'unknown');

                    // Try to get markdown content, fall back to simple text
                    const text = turn.querySelector('.markdown') ? (turn.querySelector('.markdown') as HTMLElement).innerText : (turn as HTMLElement).innerText;

                    data.push({ role, content: text });
                });
            } else {
                // Strategy B: Class Name Heuristics (Common patterns)
                // Note: Class names are very unstable in ChatGPT
                const genericTurns = document.querySelectorAll('main div.text-base');
                genericTurns.forEach(turn => {
                    // Heuristic: User messages usually have different background or structure.
                    // This is simplified; robust fallback needs more logic.
                    const isUser = turn.innerHTML.includes('data-message-author-role="user"'); // simplified check
                    const role = isUser ? 'user' : 'assistant';
                    const text = (turn as HTMLElement).innerText;
                    data.push({ role, content: text });
                });
            }
            return data;
        });

        if (messages.length === 0) {
            // We might want to screenshot or dump HTML here in a real scenario
            throw new Error('E_LAYOUT_CHANGED: Could not extract any messages from ChatGPT.');
        }

        return {
            platform: 'chatgpt',
            url,
            title: await page.title(),
            messages
        };
    }
}
