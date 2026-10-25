# Mentalcoach frontend and local form-cache fix: review only

Current local candidate: **mc-v4-cachefix-3980c90aaa40bba2**, based on frozen V4 mc-ga4-v4-e316edbf9d2a71e7. This remains **NOT APPROVED FOR LIVE RELEASE**. Do not merge, deploy or activate tracking from this draft. The coordinating hosting task reported a form regression and subsequent production rollback; current live equality is not asserted here.

## Exact follow-up change

Only kontakt.html changes in the public package: assets/contact-form.mjs becomes assets/contact-form.mjs?v=ac9845e62fdb. The version is bound to the unchanged module SHA256 ac9845e62fdbc10c57c4d59540fdb2d67b8a6a8f2ced680394e82dd878c2e170. Fixed HTML SHA256081b220f1d4732da5f4bbebdc4b4021a714c7c624acb85a298eb2f17e6b95d75. All other68 files in the full69-file local package remain byte-identical to V4. No backend/PHP/mail/DNS/analytics implementation or credentials changed.

## Local fix verification completed

**4 Node regression tests PASS** and **9 actual Chrome/Playwright browser cases PASS** on the integrated local candidate: fresh desktop homepage-to-contact keyboard path; unchanged V4 after a cached legacy module reproduces the disabled form; versioned URL restores initialization in the same old cache; corrected normal reload; HTTP404, wrong MIME/nosniff and script-blocking CSP fallback; actual browser JavaScript disabled with visible keyboard-accessible mailto fallback; mobile390px keyboard path and layout. The synthetic accepted flow used an in-memory mock only, not an HTTP or mail submission.

The real browser cache was retained. No second bare-module server GET occurred when the old cache was reused; the versioned URL fetched the current module. Fixture headers are controlled and are not evidence of historical production headers. The compatibility failure is locally reproduced; it is **not proven to be the sole historical production cause**.

Nine cases completed across three retained test runs: test-helper fieldset-state and noscript-text assertions were corrected; already-passed cases were retained rather than repeated. Earlier failed evidence remains local. The public site code was not changed for those assertion corrections. Existing historical tests are distinguished from these newly executed fix tests.

Package integrity:69 files, only kontakt.html changed,1,379 local references checked with no missing targets. Minimal raw-byte patch apply/roundtrip PASS. Original V4 and hand-off source files remained unchanged. Zero real HTTP POSTs, backend requests, external requests, emails or analytics events across the fix tests; no PHP started. Test browsers and loopback servers closed. No new tests/events run merely to update this draft.

## Remaining release boundaries

The local form/cache regression check is now completed in the stated scope. Live versioned-module HTTPS/MIME/hash/redirect acceptance, fresh target drift/backup binding and a complete verified rollback path remain separate release gates. A future separately authorized release must provide the module first, verify its versioned URL, then switch HTML and check initialization without a real message. No production permission is implied by this local fix or GitHub backup.

Tracking remains enabled=false/deploymentApproved=false and transport=null through closed gates. G-1KCTKLLL98 is a public Mentalcoach-specific ID, not an activation. Prior isolated SDK HTTP204 responses were not confirmed dashboard processing. Legal/transparency and real analytics activation remain separate decisions. The frontend expects the existing contact.php route; backend preparation remains separately in draft PR#3 and is not installed/modified by this frontend draft. No new mail-delivery evidence is claimed.
