import assert from 'node:assert/strict';
import test from 'node:test';
import evaluate from '../evaluate.js';
import configHandler from '../config.js';

const ORIGIN = 'https://2026aichattingreader.vercel.app';

function post(path, body, headers = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.20', ...headers },
    body: JSON.stringify(body),
  });
}

test('평가 API는 허용되지 않은 출처를 AI 호출 전에 거절한다', async () => {
  assert.equal((await evaluate(post('/api/evaluate', { prompt: '평가' }))).status, 403);
  assert.equal((await evaluate(post('/api/evaluate', { prompt: '평가' }, { origin: 'https://evil.example' }))).status, 403);
});

test('평가 API는 형식이 틀린 요청을 400으로 거절한다', async () => {
  const headers = { origin: ORIGIN };
  assert.equal((await evaluate(post('/api/evaluate', { prompt: '' }, headers))).status, 400);
  assert.equal((await evaluate(post('/api/evaluate', { prompt: '평가', provider: 'other' }, headers))).status, 400);
  assert.equal((await evaluate(post('/api/evaluate', { prompt: '평가', model: '../x' }, headers))).status, 400);
});

test('사용자 키가 없으면 서버 키를 사용하지 않는다', async () => {
  delete process.env.ALLOW_SERVER_KEYS;
  for (const provider of ['gemini', 'claude', 'openai', 'ensemble']) {
    const res = await evaluate(post('/api/evaluate', { prompt: '평가', provider }, { origin: ORIGIN }));
    assert.equal(res.status, 403, provider);
  }
});

test('사용자 키가 있으면 목록 밖 모델도 기존 처리로 간다', async () => {
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 });
  };
  try {
    const res = await evaluate(post('/api/evaluate', { prompt: '평가', provider: 'openai', model: 'custom-model', apiKey: 'user-key' }, { origin: ORIGIN }));
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer user-key');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('ALLOW_SERVER_KEYS=1이면 서버 키 경로가 다시 열린다', async () => {
  process.env.ALLOW_SERVER_KEYS = '1';
  const res = await evaluate(post('/api/evaluate', { prompt: '평가', provider: 'gemini' }, { origin: ORIGIN, 'x-forwarded-for': '203.0.113.30' }));
  delete process.env.ALLOW_SERVER_KEYS;
  assert.equal(res.status, 500);
  assert.match((await res.json()).error, /not configured/);
});

test('PIN이 없는 저장은 실패 횟수에 들어가지 않는다', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  const headers = { 'x-forwarded-for': '203.0.113.23' };
  for (let i = 0; i < 70; i += 1) {
    assert.equal((await configHandler(post('/api/config', { settings: { provider: 'gemini' } }, headers))).status, 403);
  }
  assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'test-pin-value' }, headers))).status, 200);
});

test('병렬 PIN 대입은 한도를 넘겨 비교되지 않는다', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  const headers = { 'x-forwarded-for': '203.0.113.24' };
  const results = await Promise.all(Array.from({ length: 100 }, () => configHandler(post('/api/config', { action: 'unlock', pin: 'wrong' }, headers))));
  assert.equal(results.filter((res) => res.status === 403).length, 60);
  assert.equal(results.filter((res) => res.status === 429).length, 40);
});

test('설정 저장은 관리자 비밀번호 없이 거절되고, 학생용 PIN으로도 저장되지 않는다', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  process.env.ADMIN_PASSWORD = 'test-admin-value';
  const headers = { 'x-forwarded-for': '203.0.113.21' };
  assert.equal((await configHandler(post('/api/config', { settings: { provider: 'gemini' } }, headers))).status, 403);
  assert.equal((await configHandler(post('/api/config', { pin: 'test-pin-value', settings: { provider: 'gemini' } }, headers))).status, 403);
  assert.equal((await configHandler(post('/api/config', { adminPassword: 'test-pin-value', settings: { provider: 'gemini' } }, headers))).status, 403);
});

test('올바른 PIN의 병렬 요청은 끝난 뒤 실패로 남지 않는다', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  const headers = { 'x-forwarded-for': '203.0.113.25' };
  await Promise.all(Array.from({ length: 50 }, () => configHandler(post('/api/config', { action: 'unlock', pin: 'test-pin-value' }, headers))));
  for (let i = 0; i < 59; i += 1) {
    assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'wrong' }, headers))).status, 403);
  }
  assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'test-pin-value' }, headers))).status, 200);
});

test('PIN 잠금 해제와 실패 제한', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  const headers = { 'x-forwarded-for': '203.0.113.22' };
  assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'test-pin-value' }, headers))).status, 200);
  for (let i = 0; i < 60; i += 1) {
    assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'wrong' }, headers))).status, 403);
  }
  assert.equal((await configHandler(post('/api/config', { action: 'unlock', pin: 'test-pin-value' }, headers))).status, 429);
});

test('KV가 없을 때 GET은 기존과 같이 200으로 응답한다', async () => {
  const res = await configHandler(new Request(`${ORIGIN}/api/config`));
  assert.equal(res.status, 200);
  assert.equal(typeof (await res.json()).error, 'string');
});
