// Actual loopback PHP route; fixture SMTP adapter is a mock, never a real send.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const [origin, output] = process.argv.slice(2);
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback only');
const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE, headless: true });
const checks = [];
try {
  for (const [label, viewport, message, expected] of [
    ['desktop-accepted', { width: 1366, height: 768 }, 'Synthetischer PHP-Browsertest.', 'zum Versand angenommen'],
    ['mobile-uncertain', { width: 390, height: 844 }, 'FORCE_MOCK_FAILURE', 'Versandstatus ist unklar']]) {
    const context = await browser.newContext({ viewport });
    let posts = 0;
    await context.route('**/*', async (route) => {
      const req = route.request();
      if (!req.url().startsWith(origin + '/')) return route.abort();
      if (req.url().includes('/contact.php') && req.method() === 'POST') {
        ++posts;
        // Test harness only: exercise the unchanged production Origin gate on loopback.
        const response = await route.fetch({ headers: { ...req.headers(), origin: 'https://mentalcoach-ts.de' } });
        return route.fulfill({ response });
      }
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`${origin}/kontakt.html`, { waitUntil: 'networkidle' });
    const form = page.locator('#contactForm');
    await form.locator('[name=name]').fill('PHP Browser Testperson');
    await form.locator('[name=email]').fill('visitor@example.invalid');
    await form.locator('[name=message]').fill(message);
    await form.locator('button').click();
    await form.locator('[role=status]').filter({ hasText: expected }).waitFor({ timeout: 10000 });
    assert.equal(posts, 1);
    assert.equal(await form.locator('button').isDisabled(), true);
    assert.equal(await form.locator('[name=message]').inputValue(), label.startsWith('desktop') ? '' : message);
    assert.deepEqual(errors, []);
    await form.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `php-${label}.png`) });
    checks.push({ label, result: 'PASS', backend: 'REAL_PHP_HTTP', smtp: 'FIXTURE_MOCK', posts });
    await context.close();
  }
  console.log(JSON.stringify({ checks, origin_header: 'TEST_HARNESS_OVERRIDE_ONLY', real_delivery: 'NOT_RUN' }, null, 2));
} finally { await browser.close(); }
