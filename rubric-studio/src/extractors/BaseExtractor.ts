import { Page } from 'puppeteer';
import { IChatExtractor, ScrapedResult } from '../types/extractor';

export abstract class BaseExtractor implements IChatExtractor {
    abstract canHandle(url: string): boolean;

    protected async getText(page: Page, selector: string): Promise<string> {
        // Text extraction helper (includes null check)
        return page.$eval(selector, el => el.textContent?.trim() || '').catch(() => '');
    }

    protected async getAttribute(page: Page, selector: string, attribute: string): Promise<string> {
        return page.$eval(selector, (el, attr) => el.getAttribute(attr) || '', attribute).catch(() => '');
    }

    abstract extract(page: Page, url: string): Promise<ScrapedResult>;
}
