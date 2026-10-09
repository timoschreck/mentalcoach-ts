// Real Chromium UI; local static files and intercepted synthetic API only.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const artifacts = path.resolve(process.argv[2]);
const playwrightPath = process.env.PLAYWRIGHT_MODULE;
const chromePath = process.env.CHROME_EXECUTABLE;
if (!playwrightPath || !chromePath) throw new Error('Use existing Playwright/Chrome paths; do not install.');
const { chromium } = await import(pathToFileURL(playwrightPath));
const token = `1800000000.${'a'.repeat(32)}.${'b'.repeat(64)}`;
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, `.${name}`);
    if (!target.startsWith(root + path.sep) || !types[path.extname(target)]) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] });
    res.end(await readFile(target));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const checks = [];
try {
  await mkdir(artifacts, { recursive: true });
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  for (const [label, viewport] of [['desktop', { width: 1366, height: 768 }],
    ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('response', (response) => {
      if (response.url().startsWith(origin + '/') && response.status() >= 400) {
        errors.push(`HTTP ${response.status()} ${new URL(response.url()).pathname}`);
      }
    });
    let posts = 0;
    await context.route('**/*', async (route) => {
      const request = route.request();
      if (!request.url().startsWith(origin + '/')) return route.abort();
      if (request.url().includes('/contact.php')) {
        if (request.method() === 'POST') {
          ++posts;
          const body = request.postDataJSON();
          assert.equal(body.email, 'visitor@example.invalid');
          assert.equal(body.website, '');
          assert.equal(body.token, token);
          assert.equal(Object.hasOwn(body, 'to'), false);
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        return route.fulfill({ contentType: 'application/json',
          body: JSON.stringify(request.method() === 'GET'
            ? { ok: true, token } : { ok: true, code: 'accepted' }) });
      }
      return route.continue();
    });
    await page.goto(`${origin}/kontakt.html`, { waitUntil: 'networkidle' });
    const form = page.locator('#contactForm');
    await form.scrollIntoViewIfNeeded();
    assert.equal(await form.getAttribute('action'), 'contact.php');
    await form.locator('button').click();
    assert.equal(posts, 0, 'empty form bypassed validation');
    await form.locator('[name=name]').fill('Synthetische Testperson');
    await form.locator('[name=email]').fill('visitor@example.invalid');
    await form.locator('[name=message]').fill('Nur synthetische Browserprüfung.');
    await page.screenshot({ path: path.join(artifacts, `contact-${label}-prepared.png`) });
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(noOverflow, true, 'horizontal overflow');
    await form.locator('button').click();
    await form.locator('[role=status]').filter({ hasText: 'zum Versand angenommen' }).waitFor();
    assert.equal(posts, 1);
    assert.equal(await form.locator('button').isDisabled(), true);
    assert.equal(await form.locator('[name=message]').inputValue(), '');
    assert.deepEqual(errors, []);
    checks.push({ label, viewport, posts, result: 'PASS', transport: 'INTERCEPTED_MOCK_ONLY' });
    await context.close();
  }
  console.log(JSON.stringify({ checks, real_delivery: 'NOT_RUN' }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
