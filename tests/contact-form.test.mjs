import test from 'node:test';
import assert from 'node:assert/strict';
import { attachContactForm } from '../assets/contact-form.mjs';

const token = `1800000000.${'a'.repeat(32)}.${'b'.repeat(64)}`;
const response = (data, status = 200) => ({ ok: status < 300, status, json: async () => data });
function formFixture(valid = true) {
  const button = { disabled: false, textContent: '' };
  const status = { textContent: '' };
  const values = { name: 'Testperson', email: 'visitor@example.invalid',
    message: 'Synthetische Testnachricht.', website: '' };
  let handler;
  const form = { action: 'https://mentalcoach-ts.de/contact.php',
    querySelector: (selector) => selector.includes('button') ? button : status,
    elements: { namedItem: (name) => ({ value: values[name] }) },
    reportValidity: () => valid,
    reset: () => { form.wasReset = true; },
    addEventListener: (type, callback) => { handler = callback; } };
  return { form, button, status, submit: () => handler({ preventDefault() {} }) };
}

test('valid submission uses same-origin JSON, omits cookies and resets only after acceptance', async () => {
  const ui = formFixture();
  const calls = [];
  attachContactForm(ui.form, async (url, options) => {
    calls.push({ url, options });
    return response(options.method === 'GET' ? { ok: true, token } : { ok: true, code: 'accepted' });
  });
  await ui.submit();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${ui.form.action}?token=1`);
  assert.equal(calls[1].options.credentials, 'omit');
  assert.equal(calls[1].options.redirect, 'error');
  assert.deepEqual(Object.keys(JSON.parse(calls[1].options.body)).sort(), ['email', 'message', 'name', 'token', 'website']);
  assert.equal(ui.form.wasReset, true);
  assert.equal(ui.button.disabled, true);
  await ui.submit();
  assert.equal(calls.length, 2);
});

test('invalid browser fields do not request a token or send', async () => {
  const ui = formFixture(false);
  attachContactForm(ui.form, async () => { assert.fail('unexpected fetch'); });
  await ui.submit();
  assert.equal(ui.button.disabled, false);
});

test('double click cannot start another POST while pending', async () => {
  const ui = formFixture();
  let release;
  let count = 0;
  attachContactForm(ui.form, async (url, options) => {
    if (options.method === 'GET') return response({ ok: true, token });
    ++count;
    await new Promise((resolve) => { release = resolve; });
    return response({ ok: true, code: 'accepted' });
  });
  const first = ui.submit();
  await new Promise((resolve) => setImmediate(resolve));
  await ui.submit();
  assert.equal(count, 1);
  release();
  await first;
});

test('network error after POST preserves text and blocks blind retry', async () => {
  const ui = formFixture();
  let count = 0;
  attachContactForm(ui.form, async (url, options) => {
    ++count;
    if (options.method === 'GET') return response({ ok: true, token });
    throw new Error('SMTP password must never be rendered');
  });
  await ui.submit();
  assert.equal(ui.form.wasReset, undefined);
  assert.equal(ui.button.disabled, true);
  assert.match(ui.status.textContent, /unklar/);
  assert.doesNotMatch(ui.status.textContent, /password/);
  await ui.submit();
  assert.equal(count, 2);
});

test('token failure permits safe retry without POST', async () => {
  const ui = formFixture();
  const methods = [];
  attachContactForm(ui.form, async (url, options) => { methods.push(options.method); return response({}, 503); });
  await ui.submit();
  assert.deepEqual(methods, ['GET']);
  assert.equal(ui.button.disabled, false);
});

for (const [code, status] of [['invalid', 400], ['rate_limit', 429]]) {
  test(`${code} response retains input, ignores server text and permits correction`, async () => {
    const ui = formFixture();
    attachContactForm(ui.form, async (url, options) => response(options.method === 'GET'
      ? { ok: true, token } : { ok: false, code, message: '<script>secret</script>' }, options.method === 'GET' ? 200 : status));
    await ui.submit();
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.form.wasReset, undefined);
    assert.doesNotMatch(ui.status.textContent, /script|secret/);
  });
}

test('malformed success cannot claim acceptance', async () => {
  const ui = formFixture();
  attachContactForm(ui.form, async (url, options) => response(options.method === 'GET'
    ? { ok: true, token } : { ok: true }));
  await ui.submit();
  assert.match(ui.status.textContent, /unklar/);
  assert.equal(ui.form.wasReset, undefined);
});

test('expired/forged token shape stops before POST', async () => {
  const ui = formFixture();
  let count = 0;
  attachContactForm(ui.form, async () => { ++count; return response({ ok: true, token: 'forged' }); });
  await ui.submit();
  assert.equal(count, 1);
  assert.equal(ui.form.wasReset, undefined);
});
