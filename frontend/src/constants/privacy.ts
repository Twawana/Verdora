/**
 * Privacy & data collection copy — shown at signup and in settings.
 */
export const DATA_CONSENT_NOTICE =
  'This app collects farming and usage data to improve services and generate agricultural insights.';

export const DATA_CONSENT_DETAILS = [
  'We collect: location, crops planted, scan results, weather interactions, and chat questions.',
  'Data is used only for aggregated agricultural insights — we do not sell your personal data.',
  'You can opt out of analytics collection anytime in Privacy Settings.',
  'Regional trends and disease reports use anonymized, aggregated data only.',
] as const;

export const PRIVACY_STORAGE_KEY = '@verdora_data_consent';
