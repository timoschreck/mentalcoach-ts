export function attachContactForm(form, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[role="status"]');
  let busy = false;
  let completed = false;
  let token = null;

  const say = (message) => { status.textContent = message; };
  const request = async (url, options) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal,
        credentials: 'omit', cache: 'no-store', redirect: 'error' });
      return { response, data: await response.json() };
    } finally {
      clearTimeout(timeout);
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || completed || !form.reportValidity()) return;
    busy = true;
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    say('Deine Anfrage wird vorbereitet.');
    let postStarted = false;
    try {
      if (!token) {
        const result = await request(`${form.action}?token=1`, { method: 'GET' });
        if (!result.response.ok || !result.data.ok
          || typeof result.data.token !== 'string'
          || !/^\d{10}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(result.data.token)) {
          throw new Error('token unavailable');
        }
        token = result.data.token;
      }
      const value = (name) => form.elements.namedItem(name).value;
      const payload = { name: value('name'), email: value('email'), message: value('message'),
        website: value('website'), token };
      postStarted = true;
      const { response, data } = await request(form.action, { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.ok && data.ok === true && data.code === 'accepted') {
        completed = true;
        form.reset();
        say('Deine Nachricht wurde zum Versand angenommen. Vielen Dank!');
      } else if (['invalid', 'rate_limit'].includes(data.code)
        && [400, 403, 413, 415, 429].includes(response.status)) {
        say(data.code === 'rate_limit'
          ? 'Zu viele Anfragen. Bitte versuche es später oder nutze office@mentalcoach-ts.de.'
          : 'Bitte prüfe Deine Eingaben. Ist das Formular länger geöffnet, lade es neu.');
      } else {
        completed = true;
        say('Der Versandstatus ist unklar. Bitte sende nicht erneut und kontaktiere Timo per Mail.');
      }
    } catch (error) {
      completed = postStarted;
      say(postStarted
        ? 'Der Versandstatus ist unklar. Bitte sende nicht erneut und kontaktiere Timo per Mail.'
        : 'Das Formular ist momentan nicht verfügbar. Bitte nutze office@mentalcoach-ts.de.');
    } finally {
      busy = false;
      button.disabled = completed;
      button.textContent = completed ? 'Sendeversuch abgeschlossen' : 'Senden';
    }
  });
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('contactForm');
  if (form) attachContactForm(form);
}
