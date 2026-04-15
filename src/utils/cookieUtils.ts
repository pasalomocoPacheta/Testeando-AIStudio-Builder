export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export const getSavedConsent = (): CookiePreferences | null => {
  try {
    const saved = localStorage.getItem('cookie-consent-preferences');
    if (saved) {
      return JSON.parse(saved) as CookiePreferences;
    }
    // Fallback to session storage if local is empty but session was dismissed
    if (sessionStorage.getItem('cookie-banner-dismissed')) {
      return DEFAULT_PREFERENCES;
    }
    // Fallback to cookie
    if (document.cookie.includes('cookie-consent-dismissed=true')) {
      return DEFAULT_PREFERENCES;
    }
  } catch (e) {
    console.warn('Storage access failed:', e);
  }
  return null;
};

export const saveConsentToStorage = (prefs: CookiePreferences) => {
  try {
    localStorage.setItem('cookie-consent-preferences', JSON.stringify(prefs));
    sessionStorage.setItem('cookie-banner-dismissed', 'true');
    // Set a basic cookie as a final fallback
    document.cookie = `cookie-consent-dismissed=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch (e) {
    console.warn('Failed to save consent to storage:', e);
  }
};

export const hasCookieConsent = (category: keyof CookiePreferences): boolean => {
  const prefs = getSavedConsent();
  if (!prefs) return category === 'necessary';
  return prefs[category] || category === 'necessary';
};
