
import { kv } from '@vercel/kv';
import { clientAddress, createCounter, sanitizeConfig, secretEquals } from './_lib/guard.js';

export const config = {
    runtime: 'edge',
};

const CONFIG_KEY = 'AI_EVAL_GLOBAL_CONFIG';
const PIN_FAILURE_LIMIT = 60; // 성공한 시도는 세지 않으므로 학급 단위 사용에는 걸리지 않는다
const pinFailures = createCounter(10 * 60 * 1000);

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
}

async function checkPin(req, pin) {
    const address = clientAddress(req);
    if (pinFailures.count(address) >= PIN_FAILURE_LIMIT) return 'blocked';
    if (await secretEquals(pin, process.env.SECRET_API_PIN || '')) return 'ok';
    pinFailures.add(address);
    return 'wrong';
}

export default async function handler(req) {
    // GET: Retrieve Global Config
    if (req.method === 'GET') {
        try {
            return json(200, sanitizeConfig(await kv.get(CONFIG_KEY)));
        } catch (error) {
            console.error('KV Get Error:', error);
            // Fallback to empty if KV not configured yet
            return json(200, { error: 'Failed to fetch config (KV not connected?)' });
        }
    }

    // POST: Update Global Config or PIN Unlock
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const result = await checkPin(req, body?.pin);

            if (result === 'blocked') {
                return json(429, { unlocked: false, error: '시도가 너무 많습니다. 잠시 뒤 다시 시도해 주세요.' });
            }

            // PIN unlock: 서버에서 PIN 검증 후 서버 키 사용 권한 부여
            if (body?.action === 'unlock') {
                return result === 'ok' ? json(200, { unlocked: true }) : json(403, { unlocked: false });
            }

            // Config save: PIN을 확인한 요청만 저장하고, 허용 필드만 남긴다
            if (result !== 'ok') return json(403, { error: 'PIN이 필요합니다.' });
            const settings = sanitizeConfig(body?.settings);
            await kv.set(CONFIG_KEY, settings);
            return json(200, { success: true, settings });
        } catch (error) {
            console.error('Config Error:', error);
            return json(500, { error: '설정을 처리하지 못했습니다.' });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}
