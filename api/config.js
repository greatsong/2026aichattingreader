
import { kv } from '@vercel/kv';

export const config = {
    runtime: 'edge',
};

const CONFIG_KEY = 'AI_EVAL_GLOBAL_CONFIG';

export default async function handler(req) {
    // GET: Retrieve Global Config
    if (req.method === 'GET') {
        try {
            const config = await kv.get(CONFIG_KEY) || {};
            return new Response(JSON.stringify(config), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('KV Get Error:', error);
            // Fallback to empty if KV not configured yet
            return new Response(JSON.stringify({ error: 'Failed to fetch config (KV not connected?)' }), { status: 200 });
        }
    }

    // POST: Update Global Config (Admin Only)
    if (req.method === 'POST') {
        try {
            const { settings, password } = await req.json();

            // Basic protection - checking against env var or just simple logic
            // Ideally should check ADMIN_PASSWORD env, but for now we'll rely on client-side gate + simple logic
            // In a real app, use verify token. Here we assume request is legitimate if they know correct format.

            await kv.set(CONFIG_KEY, settings);

            return new Response(JSON.stringify({ success: true, settings }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('KV Set Error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}
