import {measurementConfig} from './measurement-config.mjs';
import {createMeasurement} from './measurement-core.mjs';

/** Only explicit allowlisted contact actions; no automatic outbound/form tracking. */
export function initHomepageMeasurement(config, documentRoot = document) {
  const engine = createMeasurement(config);
  if (!engine.ready) return engine;
  const settings = documentRoot.querySelector('[data-measurement-settings]');
  if (!settings || typeof documentRoot.createElement('dialog').showModal !== 'function') return engine;
  const dialog = documentRoot.createElement('dialog');
  dialog.className = 'measurement-dialog';
  dialog.setAttribute('aria-labelledby', 'measurement-title');
  dialog.setAttribute('aria-describedby', 'measurement-description');
  dialog.innerHTML = `
    <h2 id="measurement-title">Optionale Reichweitenmessung</h2>
    <p id="measurement-description">Mit Deiner Erlaubnis misst Google Analytics Seitenaufruf und Kontaktklicks dieser Startseite sowie technische Nutzungsdaten. Google verwendet pseudonyme Kennungen und Cookies; auch erste Besuche, Sitzungsbeginn und Nutzungsdauer können automatisch erfasst werden. Kontaktklicks bestätigen keine Anfrage oder Buchung. Wir übergeben keine Formularinhalte, Kontaktadressen oder URL-Parameter. <a href="datenschutz.html">Datenschutzhinweise</a></p>
    <p data-measurement-provider></p>
    <p>Deine Auswahl gilt nur für diese geöffnete Seite. Du kannst sie jederzeit hier widerrufen. Die Kontaktwege funktionieren auch ohne Zustimmung.</p>
    <p class="measurement-state" role="status" aria-live="polite"></p>
    <div class="measurement-choices">
      <button type="button" class="measurement-choice" data-deny autofocus>Ablehnen</button>
      <button type="button" class="measurement-choice" data-allow>Zustimmen</button>
    </div>
    <button type="button" class="measurement-choice" data-revoke hidden>Einwilligung widerrufen</button>
    <button type="button" class="measurement-close" data-close>Schließen</button>`;
  dialog.querySelector('[data-measurement-provider]').textContent = `Anbieter: ${config.providerLabel}`;
  documentRoot.body.append(dialog);
  const status = dialog.querySelector('[role="status"]');
  const revoke = dialog.querySelector('[data-revoke]');
  let opener = documentRoot.activeElement;
  const update = () => {
    status.textContent = engine.consent === 'granted' ? 'Optionale Messung ist für diese Seite erlaubt.'
      : 'Optionale Messung ist ausgeschaltet.';
    revoke.hidden = engine.consent !== 'granted';
  };
  const close = () => {
    dialog.close();
    if (opener?.isConnected && !opener.inert) opener.focus({preventScroll:true});
  };
  settings.hidden = false;
  settings.addEventListener('click', () => {
    opener = documentRoot.activeElement;
    update();
    dialog.showModal();
  });
  dialog.querySelector('[data-deny]').addEventListener('click', () => { engine.deny(); update(); close(); });
  dialog.querySelector('[data-allow]').addEventListener('click', () => {
    const wasGranted = engine.consent === 'granted';
    if (engine.grant() && !wasGranted) void engine.track('page_view');
    update(); close();
  });
  revoke.addEventListener('click', () => { engine.revoke(); update(); close(); });
  dialog.querySelector('[data-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', () => {
    // Escape dismisses; it never grants permission or changes an existing choice.
    queueMicrotask(() => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
  });
  documentRoot.querySelectorAll('[data-contact-action]').forEach(link => {
    link.addEventListener('click', () => {
      const event = {form:'contact_form_click',email:'contact_email_click',phone:'contact_phone_click'}[link.dataset.contactAction];
      if (event) void engine.track(event, {placement:link.dataset.contactPlacement ?? 'other'});
    });
  });
  // Explicit first-layer choice only when a separately approved provider is configured.
  update();
  dialog.showModal();
  return engine;
}

if (typeof document !== 'undefined') initHomepageMeasurement(measurementConfig);
