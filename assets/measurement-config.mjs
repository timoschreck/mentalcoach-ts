import {createGa4BasicAdapter} from './ga4-basic-adapter.mjs';
import {createGoogleTagDriver} from './ga4-google-driver.mjs';

// Mentalcoach binding verified from provider readback. Ads personalization and real SDK checks remain open.
// Importing the available driver never loads Google; enabled and deployment gates stay false.
export const ga4BasicStatus = createGa4BasicAdapter({
  enabled: false,
  deploymentApproved: false,
  measurementId: 'G-1KCTKLLL98',
  projectBindingVerified: true,
  streamSettingsVerified: false,
  noticeReviewed: false,
  driverPrivacyVerified: false
}, createGoogleTagDriver);
export const measurementConfig = Object.freeze({
  enabled: false,
  provider: 'ga4',
  deploymentApproved: false,
  pageId: 'home',
  providerLabel: 'Google Analytics 4',
  transport: ga4BasicStatus.transport
});
