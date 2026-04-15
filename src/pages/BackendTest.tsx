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

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzViR2BMtubvPV8slAJz9E5rLjOyJz8_iKB19wFJhCrMIcRYfMsHVLT4APferiKu4mX/exec";

declare global {
  interface Window {
    __belugaChallengeCallback?: (data: unknown) => void;
  }
}

export default function BackendTest(): JSX.Element {
  const formRef = useRef<HTMLFormElement | null>(null);
  const submitFrameRef = useRef<HTMLIFrameElement | null>(null);

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
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeTs, setChallengeTs] = useState("");
  const [powNonce, setPowNonce] = useState("");
  const [powHash, setPowHash] = useState("");
  const [uaHash, setUaHash] = useState("");
  const [formFingerprint, setFormFingerprint] = useState("");
  const [formSeal, setFormSeal] = useState("");
  
  const [userAgent, setUserAgent] = useState(() => typeof navigator !== "undefined" ? navigator.userAgent : "");
  const [language, setLanguage] = useState(() => typeof navigator !== "undefined" ? navigator.language : "");
  const [screenValue, setScreenValue] = useState(() => typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "");
  const [timezone, setTimezone] = useState(() => typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "");
  const [tzOffset, setTzOffset] = useState(() => typeof Date !== "undefined" ? String(new Date().getTimezoneOffset()) : "");
  const [page, setPage] = useState(() => typeof location !== "undefined" ? location.href : "");

  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageType, setMessageType] = useState<"" | "info" | "ok" | "err">("");
  const [messageText, setMessageText] = useState("");
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const initialFrameLoadPassedRef = useRef(false);
  const pendingChallengeResolveRef = useRef<((value: ChallengeResponse) => void) | null>(null);
  const pendingChallengeRejectRef = useRef<((reason?: unknown) => void) | null>(null);
  const pendingChallengeTimerRef = useRef<number | null>(null);

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

  function setStatus(type: "" | "info" | "ok" | "err", text: string): void {
    setMessageType(type);
    setMessageText(text);
  }

  function normalizeText(str: string): string {
    return String(str || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function validEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  async function sha256Hex(text: string): Promise<string> {
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function buildFormFingerprint(): Promise<string> {
    const raw = [
      normalizeText(email).toLowerCase(),
      normalizeText(fullName),
      normalizeText(hearAbout),
      normalizeText(otherText),
      normalizeText(message),
    ].join("|");

    return sha256Hex(raw);
  }

  async function buildFormSeal(
    challengeObj: ChallengeResponse,
    uaHashValue: string,
    formFingerprintValue: string
  ): Promise<string> {
    const raw = [
      challengeObj.nonce,
      challengeObj.ts,
      uaHashValue,
      formFingerprintValue,
    ].join("|");

    return sha256Hex(raw);
  }

  function validateClient(): void {
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
  }

  const clearPendingChallenge = useCallback((): void => {
    if (pendingChallengeTimerRef.current) {
      window.clearTimeout(pendingChallengeTimerRef.current);
      pendingChallengeTimerRef.current = null;
    }
    pendingChallengeResolveRef.current = null;
    pendingChallengeRejectRef.current = null;
  }, []);

  const requestChallenge = useCallback(async (): Promise<ChallengeResponse> => {
    return new Promise<ChallengeResponse>((resolve, reject) => {
      const old = document.getElementById("challengeScript");
      if (old && old.parentNode) {
        old.parentNode.removeChild(old);
      }

      setChallenge(null);
      pendingChallengeResolveRef.current = resolve;
      pendingChallengeRejectRef.current = reject;

      pendingChallengeTimerRef.current = window.setTimeout(() => {
        clearPendingChallenge();
        reject(new Error("Challenge timeout"));
      }, 10000);

      const s = document.createElement("script");
      s.id = "challengeScript";
      s.async = true;
      s.src =
        APPS_SCRIPT_URL +
        "?action=challenge" +
        "&callback=__belugaChallengeCallback" +
        "&_ts=" +
        Date.now();

      s.onerror = () => {
        clearPendingChallenge();
        reject(new Error("Challenge script load failed"));
      };

      document.body.appendChild(s);
    });
  }, [clearPendingChallenge]);

  async function solvePow(
    challengeObj: ChallengeResponse,
    formFingerprintValue: string
  ): Promise<PowResult> {
    const prefix = "0".repeat(challengeObj.difficulty);
    const currentUaHash = await sha256Hex(navigator.userAgent);
    const base =
      challengeObj.nonce +
      "|" +
      challengeObj.ts +
      "|" +
      currentUaHash +
      "|" +
      formFingerprintValue +
      "|";

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
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    throw new Error("Unable to solve proof of work");
  }

  function fillHiddenFields(
    pow: PowResult,
    formFingerprintValue: string,
    formSealValue: string,
    challengeObj: ChallengeResponse
  ): void {
    setSubmittedAt(String(Date.now()));
    setChallengeToken(challengeObj.token || "");
    setChallengeTs(String(challengeObj.ts || ""));
    setPowNonce(pow.powNonce || "");
    setPowHash(pow.powHash || "");
    setUaHash(pow.uaHash || "");
    setFormFingerprint(formFingerprintValue || "");
    setFormSeal(formSealValue || "");
    setUserAgent(navigator.userAgent || "");
    setLanguage(navigator.language || "");
    setScreenValue(`${window.screen.width}x${window.screen.height}`);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    setTzOffset(String(new Date().getTimezoneOffset()));
    setPage(location.href || "");
  }

  function resetSubmissionState(): void {
    const now = Date.now();
    setEmail("");
    setFullName("");
    setHearAbout("");
    setOtherText("");
    setMessage("");
    setMarketingConsent(false);
    setPrivacyConsent(false);
    setLoadTimestamp(now);

    setSubmittedAt("");
    setChallengeToken("");
    setChallengeTs("");
    setPowNonce("");
    setPowHash("");
    setUaHash("");
    setFormFingerprint("");
    setFormSeal("");
  }

  useEffect(() => {
    window.__belugaChallengeCallback = (data: unknown) => {
      const maybeChallenge =
        typeof data === "object" && data !== null && (data as { ok?: boolean }).ok
          ? (data as ChallengeResponse)
          : null;

      setChallenge(maybeChallenge);

      if (maybeChallenge) {
        log("Challenge received:", maybeChallenge);
        if (pendingChallengeTimerRef.current) {
          window.clearTimeout(pendingChallengeTimerRef.current);
          pendingChallengeTimerRef.current = null;
        }
        pendingChallengeResolveRef.current?.(maybeChallenge);
        pendingChallengeResolveRef.current = null;
        pendingChallengeRejectRef.current = null;
      } else {
        if (pendingChallengeTimerRef.current) {
          window.clearTimeout(pendingChallengeTimerRef.current);
          pendingChallengeTimerRef.current = null;
        }
        pendingChallengeRejectRef.current?.(new Error("Invalid challenge payload"));
        pendingChallengeResolveRef.current = null;
        pendingChallengeRejectRef.current = null;
      }
    };

    requestChallenge().catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Initial challenge failed";
      log("Initial challenge error:", message);
      setStatus("err", "Initial challenge failed");
    });

    return () => {
      clearPendingChallenge();
      delete window.__belugaChallengeCallback;
    };
  }, [clearPendingChallenge, log, requestChallenge]);

  const handleFrameLoad = async (): Promise<void> => {
    if (!initialFrameLoadPassedRef.current) {
      initialFrameLoadPassedRef.current = true;
      return;
    }

    if (!isSubmitting) {
      return;
    }

    setIsSubmitting(false);
    setStatus("ok", "Form submitted. Check Google Form and Apps Script logs.");
    log("Iframe load completed after submit.");

    resetSubmissionState();
    setChallenge(null);

    try {
      await requestChallenge();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Challenge refresh failed";
      log("Challenge refresh error:", message);
      setStatus("err", "Challenge refresh failed");
    }
  };

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

      fillHiddenFields(pow, currentFormFingerprint, currentFormSeal, currentChallenge);

      log("Submitting form to backend:", {
        action: APPS_SCRIPT_URL,
        hearAbout,
        otherText,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
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
                    required={!hearAbout}
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

          <input name="loadTimestamp" type="hidden" value={String(loadTimestamp)} readOnly />
          <input name="submittedAt" type="hidden" value={submittedAt} readOnly />
          <input name="challengeToken" type="hidden" value={challengeToken} readOnly />
          <input name="challengeTs" type="hidden" value={challengeTs} readOnly />
          <input name="powNonce" type="hidden" value={powNonce} readOnly />
          <input name="powHash" type="hidden" value={powHash} readOnly />
          <input name="uaHash" type="hidden" value={uaHash} readOnly />
          <input name="formFingerprint" type="hidden" value={formFingerprint} readOnly />
          <input name="formSeal" type="hidden" value={formSeal} readOnly />
          <input name="userAgent" type="hidden" value={userAgent} readOnly />
          <input name="language" type="hidden" value={language} readOnly />
          <input name="screen" type="hidden" value={screenValue} readOnly />
          <input name="timezone" type="hidden" value={timezone} readOnly />
          <input name="tzOffset" type="hidden" value={tzOffset} readOnly />
          <input name="page" type="hidden" value={page} readOnly />

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
          onLoad={() => {
            void handleFrameLoad();
          }}
        />

        <div style={styles.debug}>{debugLines.join("\n")}</div>
      </div>
    </div>
  );
}
