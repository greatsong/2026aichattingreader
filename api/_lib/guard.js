/**
 * 서버 API 공통 방어 로직. 외부 의존성 없이 Edge 런타임에서 동작한다.
 */

export const MAX_PROMPT_LENGTH = 200000;
const ALLOWED_PROVIDERS = ['gemini', 'openai', 'claude', 'ensemble'];
const MODEL_RE = /^[A-Za-z0-9._:-]{1,100}$/;
const ALLOWED_ORIGINS = [
    'https://2026aichattingreader.vercel.app',
    /^https:\/\/2026aichattingreader(?:-[a-z0-9-]+)?-greatsongs-projects\.vercel\.app$/,
    'http://localhost:5173',
    'http://localhost:3000',
];

function originOf(value) {
    try {
        return new URL(value).origin;
    } catch {
        return '';
    }
}

/** 브라우저의 같은 출처 POST에는 Origin이 항상 붙는다. 위조할 수 있으므로 1차 차단으로만 사용한다. */
export function isAllowedOrigin(headerValue, env = {}) {
    const origin = originOf(headerValue || '');
    if (!origin) return false;
    const extra = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return [...ALLOWED_ORIGINS, ...extra].some((entry) => (
        typeof entry === 'string' ? entry === origin : entry.test(origin)
    ));
}

/**
 * 서버에 저장된 AI 키는 기본으로 사용하지 않는다. 요청에 사용자의 키가 없으면 거절한다.
 * Origin은 위조할 수 있고 평가 요청을 증명할 세션이 없으므로, 인증을 넣기 전까지 서버 키를 열어 두지 않는다.
 * 다시 열려면 Vercel 환경변수 ALLOW_SERVER_KEYS=1을 설정한다.
 */
export function serverKeysAllowed(env = {}) {
    return env.ALLOW_SERVER_KEYS === '1';
}

export function validateEvaluateBody(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return '요청 본문이 올바르지 않습니다.';
    const { prompt, provider = 'gemini', model } = body;
    if (typeof prompt !== 'string' || !prompt.trim()) return 'prompt가 필요합니다.';
    if (prompt.length > MAX_PROMPT_LENGTH) return 'prompt가 너무 깁니다.';
    if (!ALLOWED_PROVIDERS.includes(provider)) return '허용되지 않은 provider입니다.';
    if (model !== undefined && model !== null && model !== '' && !(typeof model === 'string' && MODEL_RE.test(model))) {
        return '모델 이름 형식이 올바르지 않습니다.';
    }
    return null;
}

/** 인스턴스 메모리 기반 카운터. 여러 인스턴스 사이에는 공유되지 않는다. */
export function createCounter(windowMs) {
    const entries = new Map();
    const current = (key, now) => {
        const entry = entries.get(key);
        return entry && entry.resetAt > now ? entry : null;
    };
    return {
        count(key, now = Date.now()) {
            return current(key, now)?.count || 0;
        },
        add(key, now = Date.now()) {
            const entry = current(key, now);
            if (entry) entry.count += 1;
            else entries.set(key, { count: 1, resetAt: now + windowMs });
        },
    };
}

export function clientAddress(req) {
    return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}

/** 해시로 길이를 맞춘 뒤 모든 바이트를 비교한다. */
export async function secretEquals(input, expected) {
    if (typeof input !== 'string' || typeof expected !== 'string' || expected === '') return false;
    const encoder = new TextEncoder();
    const [a, b] = await Promise.all([
        crypto.subtle.digest('SHA-256', encoder.encode(input)),
        crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    ]);
    const left = new Uint8Array(a);
    const right = new Uint8Array(b);
    let diff = 0;
    for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
    return diff === 0;
}

/** /api/config가 저장하고 공개로 돌려주는 값의 허용 목록. API 키는 포함하지 않는다. */
export function sanitizeConfig(settings) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
    const clean = {};
    if (ALLOWED_PROVIDERS.includes(settings.provider)) clean.provider = settings.provider;
    if (typeof settings.model === 'string' && MODEL_RE.test(settings.model)) clean.model = settings.model;
    if (typeof settings.allowEnsemble === 'boolean') clean.allowEnsemble = settings.allowEnsemble;
    if (settings.ensembleModels && typeof settings.ensembleModels === 'object' && !Array.isArray(settings.ensembleModels)) {
        const models = {};
        for (const provider of ALLOWED_PROVIDERS) {
            const value = settings.ensembleModels[provider];
            if (typeof value === 'string' && MODEL_RE.test(value)) models[provider] = value;
        }
        clean.ensembleModels = models;
    }
    return clean;
}
