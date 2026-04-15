import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChallengeResponse = {
  ok: true;
  token: string;
  nonce: string;
  ts: number;
  difficulty: number;
  expiresIn: number;
};

type PowResult = {
  uaHash: string;
  powNonce: string;
  powHash: string;
};

type HiddenFieldRefs = {
  loadTimestamp: HTMLInputElement | null;
  submittedAt: HTMLInputElement | null;
  challengeToken: HTMLInputElement | null;
  challengeTs: HTMLInputElement | null;
  powNonce: HTMLInputElement | null;
  powHash: HTMLInputElement | null;
  uaHash: HTMLInputElement | null;
  formFingerprint: HTMLInputElement | null;
  formSeal: HTMLInputElement | null;
  userAgent: HTMLInputElement | null;
  language: HTMLInputElement | null;
  screen: HTMLInputElement | null;
  timezone: HTMLInputElement | null;
  tzOffset: HTMLInputElement | null;
  page: HTMLInputElement | null;
  origin: HTMLInputElement | null;
  recaptchaToken: HTMLInputElement | null;
};

type BackendMessage = {
  source?: string;
  ok?: boolean;
  code?: string;
  message?: string;
  requestId?: string;
  debug?: unknown;
};

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzViR2BMtubvPV8slAJz9E5rLjOyJz8_iKB19wFJhCrMIcRYfMsHVLT4APferiKu4mX/exec";

const RECAPTCHA_SITE_KEY = "6LcvwrgsAAAAABZ663yUOiMEB6bqyAD4KYQOBrb4";
const RECAPTCHA_ACTION = "submit_contact_form";
const CHALLENGE_CALLBACK_NAME = "__belugaChallengeCallback";

declare global {
  interface Window {
    __belugaChallengeCallback?: (data: unknown) => void;
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function BackendTest(): JSX.Element {
  const formRef = useRef<HTMLFormElement | null>(null);
  const submitFrameRef = useRef<HTMLIFrameElement | null>(null);
  const hiddenRefs = useRef<HiddenFieldRefs>({
    loadTimestamp: null,
    submittedAt: null,
    challengeToken: null,
    challengeTs: null,
    powNonce: null,
    powHash: null,
    uaHash: null,
    formFingerprint: null,
    formSeal: null,
    userAgent: null,
    language: null,
    screen: null,
    timezone: null,
    tzOffset: null,
    page: null,
    origin: null,
    recaptchaToken: null,
  });

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

  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageType, setMessageType] = useState<"" | "info" | "ok" | "err">("");
  const [messageText, setMessageText] = useState("");
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const pendingChallengeResolveRef = useRef<((value: ChallengeResponse) => void) | null>(null);
  const pendingChallengeRejectRef = useRef<((reason?: unknown) => void) | null>(null);
  const pendingChallengeTimerRef = useRef<number | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);
  const recaptchaReadyPromiseRef = useRef<Promise<void> | null>(null);

  const isOtherSelected = hearAbout === "Other:";

  const styles = useMemo(
    () => ({
      page: {
        fontFamily: "Arial, sans-serif",
        margin: 0,
        padding: 24,
        background: "#f5f5f5",
        minHeight: "100vh",
        boxSizing: "border-box" as const,
      },
      wrap: {
        maxWidth: 640,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 24,
        boxSizing: "border-box" as const,
      },
      title: {
        marginTop: 0,
        fontSize: 24,
      },
      field: {
        marginBottom: 16,
      },
      label: {
        display: "block",
        marginBottom: 6,
        fontWeight: 600,
      },
      input: {
        width: "100%",
        boxSizing: "border-box" as const,
        padding: 10,
        border: "1px solid #bbb",
        borderRadius: 6,
        fontSize: 14,
      },
      textarea: {
        width: "100%",
        boxSizing: "border-box" as const,
        padding: 10,
        border: "1px solid #bbb",
        borderRadius: 6,
        fontSize: 14,
        minHeight: 120,
        resize: "vertical" as const,
      },
      option: {
        marginBottom: 8,
      },
      otherWrap: {
        display: isOtherSelected ? "block" : "none",
        marginTop: 8,
        marginLeft: 24,
      },
      hp: {
        position: "absolute" as const,
        left: -9999,
        top: -9999,
        opacity: 0,
        pointerEvents: "none" as const,
        height: 0,
        overflow: "hidden" as const,
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
        cursor: isSubmitting ? "not-allowed" : "pointer",
      },
      msg: {
        marginTop: 16,
        minHeight: 20,
        fontWeight: 700,
        color:
          messageType === "ok"
            ? "#1f7a1f"
            : messageType === "err"
              ? "#b00020"
              : "#444",
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
        wordBreak: "break-word" as const,
      },
      iframe: {
        display: "none",
      },
    }),
    [isOtherSelected, isSubmitting, messageType]
  );

  const log = useCallback((msg: string, obj?: unknown): void => {
    setDebugLines((prev) => [
      ...prev,
      obj === undefined ? msg : `${msg} ${JSON.stringify(obj, null, 2)}`,
    ]);
  }, []);

  const setHiddenValue = useCallback((name: keyof HiddenFieldRefs, value: string): void => {
    const element = hiddenRefs.current[name];
    if (element) {
      element.value = value;
    }
  }, []);

  const setStatus = useCallback((type: "" | "info" | "ok" | "err", text: string): void => {
    setMessageType(type);
    setMessageText(text);
  }, []);

  const normalizeText = useCallback((str: string): string => {
    return String(str || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const validEmail = useCallback((value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }, []);

  const sha256Hex = useCallback(async (text: string): Promise<string> => {
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }, []);

  const buildFormFingerprint = useCallback(async (): Promise<string> => {
    const raw = [
      normalizeText(email).toLowerCase(),
      normalizeText(fullName),
      normalizeText(hearAbout),
      normalizeText(otherText),
      normalizeText(message),
    ].join("|");

    return sha256Hex(raw);
  }, [email, fullName, hearAbout, message, normalizeText, otherText, sha256Hex]);

  const buildFormSeal = useCallback(
    async (
      challengeObj: ChallengeResponse,
      uaHashValue: string,
      formFingerprintValue: string
    ): Promise<string> => {
      const raw = [
        challengeObj.nonce,
        challengeObj.ts,
        uaHashValue,
        formFingerprintValue,
      ].join("|");

      return sha256Hex(raw);
    },
    [sha256Hex]
  );

  const validateClient = useCallback((): void => {
    const cleanEmail = normalizeText(email);
    const cleanName = normalizeText(fullName);
    const cleanMessage = normalizeText(message);

    if (!validEmail(cleanEmail)) {
      throw new Error("Invalid email");
    }

    if (cleanName.length < 2) {
      throw new Error("Invalid full name");
    }

    if (!hearAbout) {
      throw new Error("Select hearAbout");
    }

    if (hearAbout === "Other:" && normalizeText(otherText).length < 2) {
      throw new Error("Other is required");
    }

    if (cleanMessage.length < 10) {
      throw new Error("Message too short");
    }

    if (!privacyConsent) {
      throw new Error("Privacy consent required");
    }
  }, [email, fullName, hearAbout, message, normalizeText, otherText, privacyConsent, validEmail]);

  const clearPendingChallenge = useCallback((): void => {
    if (pendingChallengeTimerRef.current) {
      window.clearTimeout(pendingChallengeTimerRef.current);
      pendingChallengeTimerRef.current = null;
    }
    pendingChallengeResolveRef.current = null;
    pendingChallengeRejectRef.current = null;
  }, []);

  const removeChallengeScript = useCallback((): void => {
    const old = document.getElementById("challengeScript");
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }
  }, []);

  const requestChallenge = useCallback(async (): Promise<ChallengeResponse> => {
    return new Promise<ChallengeResponse>((resolve, reject) => {
      removeChallengeScript();
      setChallenge(null);

      pendingChallengeResolveRef.current = resolve;
      pendingChallengeRejectRef.current = reject;

      pendingChallengeTimerRef.current = window.setTimeout(() => {
        clearPendingChallenge();
        reject(new Error("Challenge timeout"));
      }, 10000);

      const script = document.createElement("script");
      script.id = "challengeScript";
      script.async = true;
      script.src =
        `${APPS_SCRIPT_URL}?action=challenge&callback=${encodeURIComponent(CHALLENGE_CALLBACK_NAME)}&_ts=${Date.now()}`;

      script.onerror = () => {
        clearPendingChallenge();
        reject(new Error("Challenge script load failed"));
      };

      document.body.appendChild(script);
    });
  }, [clearPendingChallenge, removeChallengeScript]);

  const ensureRecaptchaScript = useCallback(async (): Promise<void> => {
    if (window.grecaptcha) {
      return;
    }

    if (!recaptchaReadyPromiseRef.current) {
      recaptchaReadyPromiseRef.current = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("recaptcha-v3-script") as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("reCAPTCHA script load failed")), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.id = "recaptcha-v3-script";
        script.async = true;
        script.defer = true;
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("reCAPTCHA script load failed"));
        document.head.appendChild(script);
      });
    }

    await recaptchaReadyPromiseRef.current;
  }, []);

  const getRecaptchaToken = useCallback(async (): Promise<string> => {
    if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY.includes("REPLACE_WITH")) {
      throw new Error("Configure RECAPTCHA_SITE_KEY in BackendTest.tsx");
    }

    await ensureRecaptchaScript();

    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error("reCAPTCHA unavailable"));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha!
          .execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
          .then(resolve)
          .catch(() => reject(new Error("reCAPTCHA execution failed")));
      });
    });
  }, [ensureRecaptchaScript]);

  const solvePow = useCallback(
    async (challengeObj: ChallengeResponse, formFingerprintValue: string): Promise<PowResult> => {
      const prefix = "0".repeat(challengeObj.difficulty);
      const currentUaHash = await sha256Hex(navigator.userAgent || "");
      const base =
        `${challengeObj.nonce}|${challengeObj.ts}|${currentUaHash}|${formFingerprintValue}|`;

      let counter = 0;
      while (counter < 400000) {
        const candidate = String(counter);
        counter += 1;

        const hash = await sha256Hex(base + candidate);
        if (hash.startsWith(prefix)) {
          return {
            uaHash: currentUaHash,
            powNonce: candidate,
            powHash: hash,
          };
        }

        if (counter % 200 === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      }

      throw new Error("Unable to solve proof of work");
    },
    [sha256Hex]
  );

  const fillHiddenFields = useCallback(
    async (
      currentChallenge: ChallengeResponse,
      pow: PowResult,
      formFingerprintValue: string,
      formSealValue: string
    ): Promise<void> => {
      const now = String(Date.now());
      const currentPage = window.location.href;
      const currentOrigin = window.location.origin;
      const recaptchaToken = await getRecaptchaToken();

      setHiddenValue("loadTimestamp", String(loadTimestamp));
      setHiddenValue("submittedAt", now);
      setHiddenValue("challengeToken", currentChallenge.token);
      setHiddenValue("challengeTs", String(currentChallenge.ts));
      setHiddenValue("powNonce", pow.powNonce);
      setHiddenValue("powHash", pow.powHash);
      setHiddenValue("uaHash", pow.uaHash);
      setHiddenValue("formFingerprint", formFingerprintValue);
      setHiddenValue("formSeal", formSealValue);
      setHiddenValue("userAgent", navigator.userAgent || "");
      setHiddenValue("language", navigator.language || "");
      setHiddenValue("screen", `${window.screen.width}x${window.screen.height}`);
      setHiddenValue("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      setHiddenValue("tzOffset", String(new Date().getTimezoneOffset()));
      setHiddenValue("page", currentPage);
      setHiddenValue("origin", currentOrigin);
      setHiddenValue("recaptchaToken", recaptchaToken);
    },
    [getRecaptchaToken, loadTimestamp, setHiddenValue]
  );

  const resetSubmissionState = useCallback((): void => {
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

    setHiddenValue("loadTimestamp", String(now));
    setHiddenValue("submittedAt", "");
    setHiddenValue("challengeToken", "");
    setHiddenValue("challengeTs", "");
    setHiddenValue("powNonce", "");
    setHiddenValue("powHash", "");
    setHiddenValue("uaHash", "");
    setHiddenValue("formFingerprint", "");
    setHiddenValue("formSeal", "");
    setHiddenValue("userAgent", "");
    setHiddenValue("language", "");
    setHiddenValue("screen", "");
    setHiddenValue("timezone", "");
    setHiddenValue("tzOffset", "");
    setHiddenValue("page", "");
    setHiddenValue("origin", "");
    setHiddenValue("recaptchaToken", "");
  }, [setHiddenValue]);

  useEffect(() => {
    setHiddenValue("loadTimestamp", String(loadTimestamp));
  }, [loadTimestamp, setHiddenValue]);

  useEffect(() => {
    window[CHALLENGE_CALLBACK_NAME] = (data: unknown) => {
      const maybeChallenge =
        typeof data === "object" && data !== null && (data as { ok?: boolean }).ok === true
          ? (data as ChallengeResponse)
          : null;

      if (!maybeChallenge) {
        if (pendingChallengeTimerRef.current) {
          window.clearTimeout(pendingChallengeTimerRef.current);
          pendingChallengeTimerRef.current = null;
        }
        pendingChallengeRejectRef.current?.(new Error("Invalid challenge payload"));
        pendingChallengeResolveRef.current = null;
        pendingChallengeRejectRef.current = null;
        return;
      }

      setChallenge(maybeChallenge);
      log("Challenge received:", maybeChallenge);

      if (pendingChallengeTimerRef.current) {
        window.clearTimeout(pendingChallengeTimerRef.current);
        pendingChallengeTimerRef.current = null;
      }
      pendingChallengeResolveRef.current?.(maybeChallenge);
      pendingChallengeResolveRef.current = null;
      pendingChallengeRejectRef.current = null;
    };

    void requestChallenge().catch((err: unknown) => {
      const text = err instanceof Error ? err.message : "Initial challenge failed";
      log("Initial challenge error:", text);
      setStatus("err", text);
    });

    return () => {
      clearPendingChallenge();
      removeChallengeScript();
      delete window[CHALLENGE_CALLBACK_NAME];
    };
  }, [clearPendingChallenge, log, removeChallengeScript, requestChallenge, setStatus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<BackendMessage>) => {
      const allowedOrigins = [new URL(APPS_SCRIPT_URL).origin, window.location.origin];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== "beluga-app-script-form") {
        return;
      }

      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      setIsSubmitting(false);
      log("Backend response:", data);

      if (data.ok) {
        setStatus("ok", data.message || "Form submitted successfully");
        resetSubmissionState();
      } else {
        setStatus("err", data.message || "Submission rejected");
      }

      setChallenge(null);
      void requestChallenge().catch((err: unknown) => {
        const text = err instanceof Error ? err.message : "Challenge refresh failed";
        log("Challenge refresh error:", text);
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [log, requestChallenge, resetSubmissionState, setStatus]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      validateClient();
      setStatus("info", "Verifying...");
      setIsSubmitting(true);

      const currentChallenge = challenge && challenge.ok ? challenge : await requestChallenge();
      const currentFormFingerprint = await buildFormFingerprint();
      log("Form fingerprint:", currentFormFingerprint);

      const pow = await solvePow(currentChallenge, currentFormFingerprint);
      log("PoW solved:", pow);

      const currentFormSeal = await buildFormSeal(
        currentChallenge,
        pow.uaHash,
        currentFormFingerprint
      );
      log("Form seal:", currentFormSeal);

      await fillHiddenFields(currentChallenge, pow, currentFormFingerprint, currentFormSeal);

      submitTimeoutRef.current = window.setTimeout(() => {
        setIsSubmitting(false);
        setStatus("err", "Backend response timeout");
      }, 30000);

      formRef.current?.submit();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Submit failed";
      console.error(err);
      log("Submit error:", text);
      setIsSubmitting(false);
      setStatus("err", text);
      setChallenge(null);
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
              "LocLunch",
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
                  {option === "Referral/Word of Mouth"
                    ? "Referral"
                    : option === "LocLunch"
                      ? "LocLunch"
                      : option === "Search Engine (Google, Bing, etc.)"
                        ? "Search Engine"
                        : "Social Media"}
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

          <input ref={(el) => { hiddenRefs.current.loadTimestamp = el; }} name="loadTimestamp" type="hidden" defaultValue={String(loadTimestamp)} />
          <input ref={(el) => { hiddenRefs.current.submittedAt = el; }} name="submittedAt" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.challengeToken = el; }} name="challengeToken" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.challengeTs = el; }} name="challengeTs" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.powNonce = el; }} name="powNonce" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.powHash = el; }} name="powHash" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.uaHash = el; }} name="uaHash" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.formFingerprint = el; }} name="formFingerprint" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.formSeal = el; }} name="formSeal" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.userAgent = el; }} name="userAgent" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.language = el; }} name="language" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.screen = el; }} name="screen" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.timezone = el; }} name="timezone" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.tzOffset = el; }} name="tzOffset" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.page = el; }} name="page" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.origin = el; }} name="origin" type="hidden" defaultValue="" />
          <input ref={(el) => { hiddenRefs.current.recaptchaToken = el; }} name="recaptchaToken" type="hidden" defaultValue="" />

          <button type="submit" disabled={isSubmitting} style={styles.button}>
            {isSubmitting ? "Verifying..." : "Submit"}
          </button>

          <div style={styles.msg}>{messageText}</div>
        </form>

        <iframe
          ref={submitFrameRef}
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
