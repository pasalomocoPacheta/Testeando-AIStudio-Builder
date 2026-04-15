import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzVisTqPz3PFf84Cbdz42rcaAPG7An9WlimR57dAIS6NJX7GvipXOvLpk5HUW420jGm/exec";

const RECAPTCHA_SITE_KEY = "PUT_YOUR_RECAPTCHA_V3_SITE_KEY_HERE";
const RECAPTCHA_ACTION = "submit_contact_form";
const BACKEND_TIMEOUT_MS = 30000;

type BackendPayload = {
  source: string;
  ok: boolean;
  code: string;
  message: string;
  requestId: string;
  debug?: unknown;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function BackendTest(): JSX.Element {
  const formRef = useRef<HTMLFormElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [hearAbout, setHearAbout] = useState("");
  const [otherText, setOtherText] = useState("");
  const [message, setMessage] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [addressField, setAddressField] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [loadTimestamp, setLoadTimestamp] = useState<number>(() => Date.now());
  const [submittedAt, setSubmittedAt] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const [userAgent, setUserAgent] = useState(
    () => (typeof navigator !== "undefined" ? navigator.userAgent : "")
  );
  const [language, setLanguage] = useState(
    () => (typeof navigator !== "undefined" ? navigator.language : "")
  );
  const [screenValue, setScreenValue] = useState(
    () => (typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "")
  );
  const [timezone, setTimezone] = useState(
    () => (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "")
  );
  const [tzOffset, setTzOffset] = useState(
    () => String(new Date().getTimezoneOffset())
  );
  const [page, setPage] = useState(
    () => (typeof location !== "undefined" ? location.href : "")
  );
  const [origin, setOrigin] = useState(
    () => (typeof location !== "undefined" ? location.origin : "")
  );

  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusType, setStatusType] = useState<"" | "info" | "ok" | "err">("");
  const [statusText, setStatusText] = useState("");
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const isOtherSelected = hearAbout === "Other:";

  const styles = useMemo(
    () => ({
      page: {
        fontFamily: "Arial, sans-serif",
        margin: 0,
        padding: 24,
        background: "#f5f5f5",
        minHeight: "100vh",
        boxSizing: "border-box" as const
      },
      wrap: {
        maxWidth: 720,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 24,
        boxSizing: "border-box" as const
      },
      title: {
        marginTop: 0,
        fontSize: 24
      },
      field: {
        marginBottom: 16
      },
      label: {
        display: "block",
        marginBottom: 6,
        fontWeight: 600
      },
      input: {
        width: "100%",
        boxSizing: "border-box" as const,
        padding: 10,
        border: "1px solid #bbb",
        borderRadius: 6,
        fontSize: 14
      },
      textarea: {
        width: "100%",
        boxSizing: "border-box" as const,
        padding: 10,
        border: "1px solid #bbb",
        borderRadius: 6,
        fontSize: 14,
        minHeight: 140,
        resize: "vertical" as const
      },
      option: {
        marginBottom: 8
      },
      otherWrap: {
        display: isOtherSelected ? "block" : "none",
        marginTop: 8,
        marginLeft: 24
      },
      hp: {
        position: "absolute" as const,
        left: -9999,
        top: -9999,
        opacity: 0,
        pointerEvents: "none" as const,
        height: 0,
        overflow: "hidden" as const
      },
      button: {
        width: "100%",
        padding: 12,
        border: 0,
        borderRadius: 6,
        background: isSubmitting ? "#888" : "#111",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        cursor: isSubmitting ? "not-allowed" : "pointer"
      },
      msg: {
        marginTop: 16,
        minHeight: 20,
        fontWeight: 700,
        color:
          statusType === "ok"
            ? "#1f7a1f"
            : statusType === "err"
              ? "#b00020"
              : "#444"
      },
      debug: {
        marginTop: 24,
        padding: 12,
        background: "#fafafa",
        border: "1px solid #ddd",
        borderRadius: 6,
        fontFamily: "monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap" as const,
        wordBreak: "break-word" as const
      },
      iframe: {
        display: "none"
      }
    }),
    [isOtherSelected, isSubmitting, statusType]
  );

  const log = useCallback((msg: string, obj?: unknown): void => {
    setDebugLines((prev) => [
      ...prev,
      obj === undefined ? msg : `${msg} ${JSON.stringify(obj, null, 2)}`
    ]);
  }, []);

  const setStatus = useCallback((type: "" | "info" | "ok" | "err", text: string): void => {
    setStatusType(type);
    setStatusText(text);
  }, []);

  const normalizeText = useCallback((str: string): string => {
    return String(str || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const validateClient = useCallback((): void => {
    const cleanEmail = normalizeText(email);
    const cleanName = normalizeText(fullName);
    const cleanMessage = normalizeText(message);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      throw new Error("Invalid email");
    }
    if (cleanName.length < 2) {
      throw new Error("Invalid full name");
    }
    if (!hearAbout) {
      throw new Error("Please select how you heard about us");
    }
    if (hearAbout === "Other:" && normalizeText(otherText).length < 2) {
      throw new Error("Please specify the other source");
    }
    if (cleanMessage.length < 10) {
      throw new Error("Message too short");
    }
    if (!privacyConsent) {
      throw new Error("Privacy consent required");
    }
    if (!isRecaptchaReady) {
      throw new Error("reCAPTCHA is not ready yet");
    }
  }, [
    email,
    fullName,
    hearAbout,
    otherText,
    message,
    privacyConsent,
    isRecaptchaReady,
    normalizeText
  ]);

  const loadRecaptcha = useCallback(async (): Promise<void> => {
    if (window.grecaptcha) {
      setIsRecaptchaReady(true);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-role="beluga-recaptcha"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load reCAPTCHA")), {
          once: true
        });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
        RECAPTCHA_SITE_KEY
      )}`;
      script.async = true;
      script.defer = true;
      script.dataset.role = "beluga-recaptcha";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(script);
    });

    if (!window.grecaptcha) {
      throw new Error("reCAPTCHA API unavailable");
    }

    await new Promise<void>((resolve) => {
      window.grecaptcha!.ready(() => resolve());
    });

    setIsRecaptchaReady(true);
  }, []);

  const executeRecaptcha = useCallback(async (): Promise<string> => {
    if (!window.grecaptcha) {
      throw new Error("reCAPTCHA API unavailable");
    }

    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
      action: RECAPTCHA_ACTION
    });

    if (!token) {
      throw new Error("Failed to get reCAPTCHA token");
    }

    return token;
  }, []);

  const refreshRuntimeFields = useCallback(() => {
    setUserAgent(navigator.userAgent || "");
    setLanguage(navigator.language || "");
    setScreenValue(`${window.screen.width}x${window.screen.height}`);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    setTzOffset(String(new Date().getTimezoneOffset()));
    setPage(location.href || "");
    setOrigin(location.origin || "");
  }, []);

  const clearSubmitTimeout = useCallback(() => {
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
  }, []);

  const resetFormAfterSuccess = useCallback(() => {
    const now = Date.now();
    setEmail("");
    setFullName("");
    setHearAbout("");
    setOtherText("");
    setMessage("");
    setMarketingConsent(false);
    setPrivacyConsent(false);
    setAddressField("");
    setCompanyWebsite("");
    setLoadTimestamp(now);
    setSubmittedAt("");
    setRecaptchaToken("");
    refreshRuntimeFields();
  }, [refreshRuntimeFields]);

  useEffect(() => {
    refreshRuntimeFields();

    loadRecaptcha().catch((error: unknown) => {
      const text = error instanceof Error ? error.message : "Failed to load reCAPTCHA";
      log("reCAPTCHA load error:", text);
      setStatus("err", text);
    });

    const onMessage = (event: MessageEvent<BackendPayload>) => {
      const expectedOrigin = new URL(APPS_SCRIPT_URL).origin;
      if (event.origin !== expectedOrigin) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== "beluga-app-script-form") {
        return;
      }

      clearSubmitTimeout();
      setIsSubmitting(false);

      log("Backend response:", data);

      if (data.ok) {
        setStatus("ok", data.message || "Form submitted successfully");
        resetFormAfterSuccess();
      } else {
        setStatus("err", data.message || "Submission rejected");
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      clearSubmitTimeout();
      window.removeEventListener("message", onMessage);
    };
  }, [clearSubmitTimeout, loadRecaptcha, log, refreshRuntimeFields, resetFormAfterSuccess, setStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      validateClient();
      refreshRuntimeFields();

      setStatus("info", "Verifying and submitting...");
      setIsSubmitting(true);

      const token = await executeRecaptcha();
      const now = Date.now();

      setSubmittedAt(String(now));
      setRecaptchaToken(token);

      log("Submit payload prepared:", {
        action: APPS_SCRIPT_URL,
        page: location.href,
        origin: location.origin,
        hearAbout
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      submitTimerRef.current = window.setTimeout(() => {
        setIsSubmitting(false);
        setStatus("err", "Backend response timeout");
        log("Submit timeout after ms:", BACKEND_TIMEOUT_MS);
      }, BACKEND_TIMEOUT_MS);

      formRef.current?.submit();
    } catch (error) {
      clearSubmitTimeout();
      setIsSubmitting(false);
      const text = error instanceof Error ? error.message : "Submit failed";
      log("Submit error:", text);
      setStatus("err", text);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Backend test form</h1>

        <form
          ref={formRef}
          method="post"
          action={APPS_SCRIPT_URL}
          target="submitFrame"
          noValidate
          onSubmit={handleSubmit}
        >
          <div style={styles.hp} aria-hidden="true">
            <label htmlFor="address_field">Leave this empty</label>
            <input
              id="address_field"
              name="address_field"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={addressField}
              onChange={(e) => setAddressField(e.target.value)}
            />
          </div>

          <div style={styles.hp} aria-hidden="true">
            <label htmlFor="company_website">Website</label>
            <input
              id="company_website"
              name="company_website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={190}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="fullName" style={styles.label}>Full name *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              maxLength={100}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>How did you hear about us? *</label>

            {[
              "Search Engine (Google, Bing, etc.)",
              "Social Media (LinkedIn, YouTube, etc.)",
              "Referral/Word of Mouth",
              "LocLunch"
            ].map((option) => (
              <div key={option} style={styles.option}>
                <label>
                  <input
                    type="radio"
                    name="hearAbout"
                    value={option}
                    checked={hearAbout === option}
                    onChange={(e) => setHearAbout(e.target.value)}
                  />{" "}
                  {option}
                </label>
              </div>
            ))}

            <div style={styles.option}>
              <label>
                <input
                  id="otherRadio"
                  type="radio"
                  name="hearAbout"
                  value="Other:"
                  checked={hearAbout === "Other:"}
                  onChange={(e) => setHearAbout(e.target.value)}
                />{" "}
                Other...
              </label>
            </div>

            <div style={styles.otherWrap}>
              <input
                id="otherText"
                name="otherText"
                type="text"
                maxLength={200}
                placeholder="Please specify..."
                disabled={!isOtherSelected}
                required={isOtherSelected}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="message" style={styles.label}>Message *</label>
            <textarea
              id="message"
              name="message"
              maxLength={3000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={styles.textarea}
            />
          </div>

          <div style={styles.field}>
            <label>
              <input
                id="marketingConsent"
                name="marketingConsent"
                type="checkbox"
                value="true"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
              />{" "}
              Marketing consent
            </label>
          </div>

          <div style={styles.field}>
            <label>
              <input
                id="privacyConsent"
                name="privacyConsent"
                type="checkbox"
                value="true"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
              />{" "}
              Privacy consent *
            </label>
          </div>

          <input name="loadTimestamp" type="hidden" value={String(loadTimestamp)} readOnly />
          <input name="submittedAt" type="hidden" value={submittedAt} readOnly />
          <input name="recaptchaToken" type="hidden" value={recaptchaToken} readOnly />
          <input name="userAgent" type="hidden" value={userAgent} readOnly />
          <input name="language" type="hidden" value={language} readOnly />
          <input name="screen" type="hidden" value={screenValue} readOnly />
          <input name="timezone" type="hidden" value={timezone} readOnly />
          <input name="tzOffset" type="hidden" value={tzOffset} readOnly />
          <input name="page" type="hidden" value={page} readOnly />
          <input name="origin" type="hidden" value={origin} readOnly />

          <button type="submit" disabled={isSubmitting || !isRecaptchaReady} style={styles.button}>
            {isSubmitting ? "Verifying..." : isRecaptchaReady ? "Submit" : "Loading reCAPTCHA..."}
          </button>

          <div style={styles.msg}>{statusText}</div>
        </form>

        <iframe
          ref={iframeRef}
          id="submitFrame"
          name="submitFrame"
          title="hidden submit frame"
          style={styles.iframe}
        />

        <div style={styles.debug}>{debugLines.join("\n")}</div>
      </div>
    </div>
  );
}
