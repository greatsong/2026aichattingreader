import assert from 'node:assert/strict';
import test from 'node:test';
import evaluate from '../evaluate.js';
import configHandler from '../config.js';
import { isServerKeyModelAllowed } from './guard.js';
import { PROVIDER_MODELS } from '../../src/constants.js';

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

test('허용 출처의 정상 요청은 기존 처리로 이어진다', async () => {
  const res = await evaluate(post('/api/evaluate', { prompt: '평가', provider: 'gemini' }, { origin: ORIGIN }));
  assert.equal(res.status, 500);
  assert.match((await res.json()).error, /not configured/);
});

test('서버 키 모델 허용 목록은 화면의 기본 모델을 모두 포함한다', () => {
  for (const [provider, { defaults }] of Object.entries(PROVIDER_MODELS)) {
    for (const model of defaults) assert.ok(isServerKeyModelAllowed(provider, model), `${provider} ${model}`);
  }
  assert.ok(!isServerKeyModelAllowed('openai', 'gpt-expensive'));
  assert.ok(isServerKeyModelAllowed('claude', undefined));
});

test('서버 키로 목록 밖 모델을 호출하면 거절하고, 자기 키가 있으면 기존 처리로 간다', async () => {
  const headers = { origin: ORIGIN };
  const denied = await evaluate(post('/api/evaluate', { prompt: '평가', provider: 'openai', model: 'gpt-expensive' }, headers));
  assert.equal(denied.status, 400);
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

test('설정 저장은 PIN 없이 거절된다', async () => {
  process.env.SECRET_API_PIN = 'test-pin-value';
  const res = await configHandler(post('/api/config', { settings: { provider: 'gemini' } }, { 'x-forwarded-for': '203.0.113.21' }));
  assert.equal(res.status, 403);
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
