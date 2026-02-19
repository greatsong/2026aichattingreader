import { IChatExtractor } from '../types/extractor';
import { ChatGPTExtractor } from './ChatGPTExtractor';
import { ClaudeExtractor } from './ClaudeExtractor';
import { GeminiExtractor } from './GeminiExtractor';

export class ExtractorFactory {
    private static extractors: IChatExtractor[] = [
        new ChatGPTExtractor(),
        new ClaudeExtractor(),
        new GeminiExtractor()
    ];

    static getExtractor(url: string): IChatExtractor {
        const extractor = this.extractors.find(e => e.canHandle(url));
        if (!extractor) {
            throw new Error(`No extractor found for URL: ${url}`);
        }
        return extractor;
    }
}
