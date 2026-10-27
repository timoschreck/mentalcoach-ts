const EVENTS = new Set(['page_view', 'contact_form_click', 'contact_email_click', 'contact_phone_click']);
const PLACEMENTS = new Set(['hero', 'mobile', 'process', 'contact', 'faq', 'footer', 'other']);
const PAGES = new Set(['home', 'contact']);

/** No SDK, network, storage, URL inspection, identifiers, buffering or retries. */
export function createMeasurement(config = {}) {
  const pageId = config.pageId;
  const transport = config.transport;
  const ready = config.enabled === true && config.deploymentApproved === true
    && typeof config.provider === 'string' && config.provider !== 'none' && config.provider.length > 0
    && typeof config.providerLabel === 'string' && config.providerLabel.trim().length > 0
    && PAGES.has(pageId) && typeof transport === 'function';
  let consent = 'unset';
  let controller = null;
  let pageViewAttempted = false;
  const revoke = () => {
    consent = 'denied';
    controller?.abort();
    controller = null;
  };
  return Object.freeze({
    ready,
    get consent() { return consent; },
    grant() {
      if (!ready) return false;
      if (consent !== 'granted') controller = new AbortController();
      consent = 'granted';
      return true;
    },
    deny: revoke,
    revoke,
    async track(eventName, fields = {}) {
      if (!ready || consent !== 'granted' || !EVENTS.has(eventName)) return false;
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)
        || Object.keys(fields).some(key => key !== 'placement')) return false;
      const placement = fields.placement ?? 'other';
      if (!PLACEMENTS.has(placement)) return false;
      const payload = Object.freeze({event_name: eventName, page_id: pageId, placement, source: 'unknown'});
      const signal = controller.signal;
      if (eventName === 'page_view') {
        if (pageViewAttempted) return false;
        pageViewAttempted = true;
      }
      try {
        // A transport refusal or failure is not an accepted measurement.
        const accepted = await transport(payload, {signal});
        return accepted !== false && !signal.aborted;
      } catch {
        return false; // Measurement failure never affects contact/navigation.
      }
    }
  });
}
