import { Page } from 'puppeteer';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'unknown';
    content: string; // Markdown or text
    timestamp?: string;
}

export interface ScrapedResult {
    platform: 'chatgpt' | 'claude' | 'gemini';
    title: string;
    url: string;
    messages: ChatMessage[];
    metadata?: Record<string, unknown>; // model name, date, etc.
}

export interface IChatExtractor {
    // Platform detection (URL pattern matching)
    canHandle(url: string): boolean;

    // Actual extraction logic (Page object is injected with stealth settings already applied)
    extract(page: Page, url: string): Promise<ScrapedResult>;
}
