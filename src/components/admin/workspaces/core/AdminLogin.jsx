// AdminLogin — simple sign-in card (see src/components/portal-login/).
// Same contract as before: controlled email/password props + handleLogin.
// handleLogin throws on failure; the message is shown inside the card.

import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";

import {
  LoginAlert,
  LoginButton,
  LoginField,
  PasswordField,
  PortalLoginFrame,
  RememberEmail,
} from "../../../portal-login/PortalLoginKit";
import { isEmail } from "../../../portal-login/portalLoginUtils";

const EMAIL_MEMORY_KEY = "zaifan-admin-login-email";

function AdminLogin({ email, password, setEmail, setPassword, handleLogin }) {
  const passwordRef = useRef(null);

  const [rememberEmail, setRememberEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(EMAIL_MEMORY_KEY);
      if (!email && remembered && typeof setEmail === "function") {
        setEmail(remembered);
      }
    } catch {
      // Storage is optional.
    }
    // Only on first load: re-running would refill the field if the admin clears it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emailValid = isEmail(email);
  const passwordReady = String(password || "").length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!emailValid) {
      setMessage("Enter your full email address.");
      return;
    }

    if (!passwordReady) {
      setMessage("Enter your password.");
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      try {
        if (rememberEmail) {
          window.localStorage.setItem(EMAIL_MEMORY_KEY, String(email || "").trim());
        } else {
          window.localStorage.removeItem(EMAIL_MEMORY_KEY);
        }
      } catch {
        // Storage is optional.
      }

      await Promise.resolve(
        handleLogin?.({
          preventDefault: () => {},
          currentTarget: event.currentTarget,
          target: event.target,
          type: event.type,
          nativeEvent: event.nativeEvent,
        })
      );
    } catch (error) {
      console.error("Admin login failed:", error);
      setMessage(error?.message || "Sign-in failed. Check your email and password and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLoginFrame
      portal="admin"
      title="Welcome back"
      subtitle="Sign in to manage leads, students and your team."
      footer="Forgot your password? Ask the main Zaifan admin to reset it."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-6">
        {message ? (
          <div className="mb-5">
            <LoginAlert onClose={() => setMessage("")}>{message}</LoginAlert>
          </div>
        ) : null}

        <div className="space-y-4">
          <LoginField
            id="zaifan-admin-email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@zaifanconsultancy.com"
            value={email}
            onChange={(event) => {
              setEmail?.(event.target.value);
              if (message) setMessage("");
            }}
            disabled={submitting}
            valid={emailValid}
          />

          <PasswordField
            id="zaifan-admin-password"
            icon={LockKeyhole}
            inputRef={passwordRef}
            value={password}
            onChange={(event) => {
              setPassword?.(event.target.value);
              if (message) setMessage("");
            }}
            disabled={submitting}
          />
        </div>

        <div className="mt-4">
          <RememberEmail checked={rememberEmail} onChange={setRememberEmail} disabled={submitting} />
        </div>

        <div className="mt-6">
          <LoginButton
            label="Sign in"
            busyLabel="Signing in…"
            busy={submitting}
            disabled={!emailValid || !passwordReady}
          />
        </div>
      </form>
    </PortalLoginFrame>
  );
}

export default AdminLogin;
