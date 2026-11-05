import assert from 'node:assert/strict';
import test from 'node:test';
import { createCounter, isAllowedOrigin, sanitizeConfig, secretEquals, validateEvaluateBody } from './guard.js';

test('허용 출처만 통과한다', () => {
  assert.ok(isAllowedOrigin('https://2026aichattingreader.vercel.app'));
  assert.ok(isAllowedOrigin('https://2026aichattingreader.vercel.app/admin'));
  assert.ok(isAllowedOrigin('https://2026aichattingreader-abc123-greatsongs-projects.vercel.app'));
  assert.ok(isAllowedOrigin('http://localhost:5173'));
  assert.ok(!isAllowedOrigin(''));
  assert.ok(!isAllowedOrigin(null));
  assert.ok(!isAllowedOrigin('https://evil.example'));
  assert.ok(!isAllowedOrigin('https://2026aichattingreader.vercel.app.evil.example'));
  assert.ok(isAllowedOrigin('https://school.example', { ALLOWED_ORIGINS: 'https://school.example' }));
});

test('평가 요청 형식을 검사한다', () => {
  assert.equal(validateEvaluateBody({ prompt: '평가', provider: 'claude', model: 'claude-haiku-4-5-20251001' }), null);
  assert.equal(validateEvaluateBody({ prompt: '평가' }), null);
  assert.equal(validateEvaluateBody({ prompt: '평가', provider: 'ensemble', model: '' }), null);
  assert.ok(validateEvaluateBody({ prompt: '' }));
  assert.ok(validateEvaluateBody({ prompt: 'x'.repeat(200001) }));
  assert.ok(validateEvaluateBody({ prompt: '평가', provider: 'other' }));
  assert.ok(validateEvaluateBody({ prompt: '평가', model: '../../v1/files?x=' }));
  assert.ok(validateEvaluateBody(null));
});

test('공개 설정에는 키와 토큰이 남지 않는다', () => {
  const clean = sanitizeConfig({ provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'secret', apiKeys: { gemini: 'secret' }, serverToken: 'secret' });
  assert.deepEqual(clean, { provider: 'gemini', model: 'gemini-2.5-flash' });
  assert.deepEqual(sanitizeConfig(null), {});
});

test('카운터는 시간 창이 지나면 초기화된다', () => {
  const counter = createCounter(1000);
  counter.add('a', 0);
  counter.add('a', 10);
  assert.equal(counter.count('a', 20), 2);
  assert.equal(counter.count('a', 2000), 0);
});

test('비밀값 비교', async () => {
  assert.ok(await secretEquals('1234', '1234'));
  assert.ok(!(await secretEquals('1235', '1234')));
  assert.ok(!(await secretEquals('', '')));
  assert.ok(!(await secretEquals(undefined, '1234')));
});
