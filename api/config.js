
import { kv } from '@vercel/kv';
import { clientAddress, createCounter, sanitizeConfig, secretEquals } from './_lib/guard.js';

export const config = {
    runtime: 'edge',
};

const CONFIG_KEY = 'AI_EVAL_GLOBAL_CONFIG';
const FAILURE_LIMIT = 60; // 성공한 시도는 세지 않으므로 학급 단위 사용에는 걸리지 않는다
const failures = createCounter(10 * 60 * 1000);
const inFlight = new Map(); // 비교 중인 요청. 병렬 대입이 한도 검사를 함께 통과하지 못하게 한다.

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
}

async function checkSecret(req, input, expected) {
    const address = clientAddress(req);
    const running = inFlight.get(address) || 0;
    if (failures.count(address) + running >= FAILURE_LIMIT) return 'blocked';
    // 값이 없는 요청은 대입이 아니므로 세지 않는다
    if (typeof input !== 'string' || input === '') return 'wrong';
    inFlight.set(address, running + 1);
    const ok = await secretEquals(input, expected);
    const left = (inFlight.get(address) || 1) - 1;
    if (left > 0) inFlight.set(address, left);
    else inFlight.delete(address);
    if (ok) return 'ok';
    failures.add(address);
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
            const isUnlock = body?.action === 'unlock';
            // 학생에게 알려 주는 PIN과 전역 설정 권한을 분리한다
            const result = isUnlock
                ? await checkSecret(req, body?.pin, process.env.SECRET_API_PIN || '')
                : await checkSecret(req, body?.adminPassword, process.env.ADMIN_PASSWORD || '');

            if (result === 'blocked') {
                return json(429, { unlocked: false, error: '시도가 너무 많습니다. 잠시 뒤 다시 시도해 주세요.' });
            }

            // PIN unlock: 서버에서 PIN 검증 후 서버 키 사용 권한 부여
            if (isUnlock) {
                return result === 'ok' ? json(200, { unlocked: true }) : json(403, { unlocked: false });
            }

            // Config save: 관리자 비밀번호를 확인한 요청만 저장하고, 허용 필드만 남긴다
            if (result !== 'ok') return json(403, { error: '관리자 비밀번호가 필요합니다.' });
            const settings = sanitizeConfig(body?.settings);
            if (!settings.provider) return json(400, { error: '저장할 설정이 올바르지 않습니다.' });
            await kv.set(CONFIG_KEY, settings);
            return json(200, { success: true, settings });
        } catch (error) {
            console.error('Config Error:', error);
            return json(500, { error: '설정을 처리하지 못했습니다.' });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}
