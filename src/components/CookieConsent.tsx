import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, Settings, Info, ChevronLeft, ExternalLink } from 'lucide-react';
import { CookiePreferences, DEFAULT_PREFERENCES, getSavedConsent, saveConsentToStorage } from '../utils/cookieUtils';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

interface CookieDetail {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  type: string;
}

const COOKIE_DETAILS: Record<CookieCategory, { title: string; description: string; cookies: CookieDetail[] }> = {
  necessary: {
    title: 'Necessary Cookies',
    description: 'These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.',
    cookies: [
      { name: '__cf_bm', provider: 'Cloudflare', purpose: 'Cloudflare bot management', expiry: '30 minutes', type: 'HTTP' },
      { name: 'XSRF-TOKEN', provider: 'Website', purpose: 'Used to prevent Cross-Site Request Forgery (CSRF) attacks.', expiry: 'Session', type: 'HTTP' },
      { name: 'session_id', provider: 'Website', purpose: 'Maintains user session state across page requests.', expiry: 'Session', type: 'HTTP' },
      { name: 'cookie-consent-preferences', provider: 'Website', purpose: 'Stores your cookie consent preferences.', expiry: '1 year', type: 'Local Storage' }
    ]
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.',
    cookies: [
      { name: '_ga', provider: 'Google Analytics', purpose: 'Used to distinguish users.', expiry: '2 years', type: 'HTTP' },
      { name: '_gid', provider: 'Google Analytics', purpose: 'Used to distinguish users.', expiry: '24 hours', type: 'HTTP' },
      { name: '_gat', provider: 'Google Analytics', purpose: 'Used to throttle request rate.', expiry: '1 minute', type: 'HTTP' },
      { name: 'hubspotutk', provider: 'HubSpot', purpose: 'Keeps track of a visitor\'s identity. It is passed to HubSpot on form submission and used when deduplicating contacts.', expiry: '6 months', type: 'HTTP' }
    ]
  },
  marketing: {
    title: 'Advertisement Cookies',
    description: 'These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.',
    cookies: [
      { name: '_fbp', provider: 'Meta', purpose: 'Used by Facebook to deliver a series of advertisement products such as real time bidding from third party advertisers.', expiry: '3 months', type: 'HTTP' },
      { name: 'ads/ga-audiences', provider: 'Google', purpose: 'Used by Google AdWords to re-engage visitors that are likely to convert to customers based on the visitor\'s online behaviour across websites.', expiry: 'Session', type: 'Pixel' },
      { name: 'test_cookie', provider: 'Google', purpose: 'Used to check if the user\'s browser supports cookies.', expiry: '15 minutes', type: 'HTTP' }
    ]
  },
  preferences: {
    title: 'Functionality Cookies',
    description: 'These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality (like videos) may become unavailable.',
    cookies: [
      { name: 'messagesUtk', provider: 'HubSpot', purpose: 'Used to recognize visitors who chat with us via the messages tool. If the visitor leaves the site before they\'re added as a contact, this cookie will stay in their browser.', expiry: '6 months', type: 'HTTP' },
      { name: 'lang', provider: 'Website', purpose: 'Remembers the user\'s selected language version of a website.', expiry: 'Session', type: 'HTTP' },
      { name: 'recent_viewed_products', provider: 'Website', purpose: 'Stores a list of recently viewed products to enhance user experience.', expiry: '1 day', type: 'Local Storage' }
    ]
  }
};

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [activeDetail, setActiveDetail] = React.useState<CookieCategory | null>(null);
  const [preferences, setPreferences] = React.useState<CookiePreferences>(() => {
    return getSavedConsent() || DEFAULT_PREFERENCES;
  });

  React.useEffect(() => {
    const savedConsent = localStorage.getItem('cookie-consent-preferences');
    const sessionDismissed = sessionStorage.getItem('cookie-banner-dismissed');
    const cookieDismissed = document.cookie.includes('cookie-consent-dismissed=true');

    if (!savedConsent && !sessionDismissed && !cookieDismissed) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(allRejected);
  };

  const handleSaveSettings = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    saveConsentToStorage(prefs);
    setPreferences(prefs);
    setIsVisible(false);
    setShowSettings(false);
    
    // Technical implementation: Trigger actual script loading/unloading
    applyTechnicalConsent(prefs);
    
    // Trigger custom event for other components to react to consent changes
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  const applyTechnicalConsent = (prefs: CookiePreferences) => {
    // Technical implementation for Google Analytics (Consent Mode v2)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'ad_user_data': prefs.marketing ? 'granted' : 'denied',
        'ad_personalization': prefs.marketing ? 'granted' : 'denied',
        'personalization_storage': prefs.preferences ? 'granted' : 'denied',
        'functionality_storage': 'granted', // Necessary
        'security_storage': 'granted', // Necessary
      });
      console.log('Technical: Updated Google Analytics Consent Mode', prefs);
    }

    // Example: Handle other scripts
    if (prefs.analytics) {
      console.log('Technical: Analytics allowed');
    }
    
    if (prefs.marketing) {
      console.log('Technical: Marketing allowed');
    }
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto bg-white text-black rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-black/5 overflow-hidden pointer-events-auto">
              {!showSettings ? (
                /* Main Banner View */
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center text-black">
                    <Cookie size={32} />
                  </div>
                  
                  <div className="flex-grow space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Cookie Policy</h3>
                    <div className="text-gray-600 text-sm leading-relaxed max-w-2xl space-y-2">
                      <p>
                        This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website and allow us to remember you. We use this information in order to improve and customize your browsing experience and for analytics and metrics about our visitors both on this website and other media. To find out more about the cookies we use, please visit our Cookie Policy.
                      </p>
                      <p>
                        If you decline, your information won’t be tracked when you visit this website. A single cookie will be used in your browser to remember your preference not to be tracked.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 rounded-full font-semibold text-sm border border-black/10 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings size={16} />
                      Configure
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="px-6 py-3 rounded-full font-semibold text-sm border border-black/10 hover:bg-gray-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-6 py-3 rounded-full font-semibold text-sm bg-black text-white hover:bg-black/90 transition-colors shadow-lg shadow-black/10"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              ) : (
                /* Detailed Settings View */
                <div className="flex flex-col h-full max-h-[80vh]">
                  <div className="p-6 border-bottom border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="text-black" size={24} />
                      <h3 className="text-xl font-bold tracking-tight">About Cookies</h3>
                    </div>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="px-6 py-2">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      This site uses cookies. We use cookies mainly to improve and analyze your experience on our websites and for marketing purposes. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change your default settings. Blocking some types of cookies may negatively impact your experience on the site and limit the services we are able to provide.
                    </p>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {/* Necessary */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Necessary</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-black text-white px-2 py-0.5 rounded-full">Always Active</span>
                        </div>
                        <p className="text-sm text-gray-600">These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms. <button onClick={() => setActiveDetail('necessary')} className="text-black underline font-medium hover:opacity-70">Learn more about necessary cookies.</button></p>
                      </div>
                      <div className="w-12 h-6 bg-black rounded-full relative opacity-50 cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${preferences.analytics ? 'border-black bg-black/5' : 'border-black/5 bg-transparent'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Analytics</span>
                        </div>
                        <p className="text-sm text-gray-600">These cookies help us to understand how visitors engage with the website. We may use a set of cookies to collect information and report site usage statistics. In addition to reporting site usage statistics, data collected may also be used, together with some of the advertising cookies described, to help show more relevant ads across the web and to measure interactions with the ads we show. <button onClick={() => setActiveDetail('analytics')} className="text-black underline font-medium hover:opacity-70">Learn more about analytics cookies.</button></p>
                      </div>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences.analytics ? 'bg-black' : 'bg-gray-100 border border-black/5'}`}
                      >
                        <motion.div
                          initial={false}
                          animate={{ x: preferences.analytics ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Marketing */}
                    <div className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${preferences.marketing ? 'border-black bg-black/5' : 'border-black/5 bg-transparent'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Advertisement</span>
                        </div>
                        <p className="text-sm text-gray-600">We use cookies to make our ads more engaging and valuable to site visitors. Some common applications of cookies are to select advertising based on what’s relevant to a user; to improve reporting on ad campaign performance; and to avoid showing ads the user has already seen. <button onClick={() => setActiveDetail('marketing')} className="text-black underline font-medium hover:opacity-70">Learn more about advertisement cookies.</button></p>
                      </div>
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences.marketing ? 'bg-black' : 'bg-gray-100 border border-black/5'}`}
                      >
                        <motion.div
                          initial={false}
                          animate={{ x: preferences.marketing ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Preferences */}
                    <div className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${preferences.preferences ? 'border-black bg-black/5' : 'border-black/5 bg-transparent'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Functionality</span>
                        </div>
                        <p className="text-sm text-gray-600">We use a set of cookies that are optional for the website to function. They are usually only set in response to information provided to the website to personalize and optimize your experience as well as remember your chat history. <button onClick={() => setActiveDetail('preferences')} className="text-black underline font-medium hover:opacity-70">Learn more about functionality cookies.</button></p>
                      </div>
                      <button
                        onClick={() => togglePreference('preferences')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences.preferences ? 'bg-black' : 'bg-gray-100 border border-black/5'}`}
                      >
                        <motion.div
                          initial={false}
                          animate={{ x: preferences.preferences ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50/50 border-t border-black/5 flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest mb-2 sm:mb-0 sm:mr-auto">
                      <Info size={12} />
                      <span>GDPR Compliant</span>
                    </div>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 px-6 py-3 rounded-full font-semibold text-sm border border-black/10 hover:bg-gray-50 transition-colors"
                    >
                      Decline All
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      className="flex-1 px-6 py-3 rounded-full font-semibold text-sm bg-black text-white hover:bg-black/90 transition-colors shadow-lg shadow-black/10"
                    >
                      Save Settings
                    </button>
                  </div>

                  {/* Detailed Modal Overlay */}
                  <AnimatePresence>
                    {activeDetail && (
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="absolute inset-0 z-[100] bg-white flex flex-col"
                      >
                        <div className="p-6 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white z-10">
                          <button 
                            onClick={() => setActiveDetail(null)}
                            className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
                          >
                            <ChevronLeft size={20} />
                            Back to Settings
                          </button>
                          <h4 className="font-bold text-lg">{COOKIE_DETAILS[activeDetail].title}</h4>
                          <div className="w-10" /> {/* Spacer */}
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 space-y-8">
                          <div className="space-y-4">
                            <p className="text-gray-600 leading-relaxed">
                              {COOKIE_DETAILS[activeDetail].description}
                            </p>
                            <a 
                              href="https://knowledge.hubspot.com/privacy-and-consent/what-cookies-does-hubspot-set-in-a-visitor-s-browser"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-black underline font-medium"
                            >
                              View full policy on HubSpot <ExternalLink size={14} />
                            </a>
                          </div>

                          <div className="space-y-4">
                            <h5 className="font-bold text-sm uppercase tracking-wider text-gray-400">Cookies used in this category</h5>
                            <div className="overflow-hidden border border-black/5 rounded-2xl">
                              <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-50 border-b border-black/5">
                                  <tr>
                                    <th className="p-4 font-bold">Name</th>
                                    <th className="p-4 font-bold">Provider</th>
                                    <th className="p-4 font-bold">Purpose</th>
                                    <th className="p-4 font-bold">Expiry</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                  {COOKIE_DETAILS[activeDetail].cookies.map((cookie, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="p-4 font-mono text-xs">{cookie.name}</td>
                                      <td className="p-4">{cookie.provider}</td>
                                      <td className="p-4 text-gray-600">{cookie.purpose}</td>
                                      <td className="p-4 text-gray-500">{cookie.expiry}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border-t border-black/5 bg-gray-50/50">
                          <button
                            onClick={() => setActiveDetail(null)}
                            className="w-full py-3 rounded-full font-semibold text-sm bg-black text-white hover:bg-black/90 transition-colors"
                          >
                            Close Details
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CookieConsent;
