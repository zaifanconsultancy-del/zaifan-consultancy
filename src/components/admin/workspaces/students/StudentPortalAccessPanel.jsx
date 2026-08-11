// StudentPortalAccessPanel PARTNER OS EXTREME — Student Portal Access Command
import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Mail, Sparkles } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";

function formatPortalDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StudentPortalAccessPanel({
  fullName,
  studentId,
  studentType,
  masterIdentityLabel,
  portalAccount,
  portalAccountForm,
  setPortalAccountForm,
  portalAccountLoading,
  portalAccountSaving,
  portalAccountStatus,
  handlePortalAccountAction,
  generateSecurePortalPassword,
  loadPortalAccount,
}) {
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [copyToast, setCopyToast] = useState("");
  const [credentialsEmailState, setCredentialsEmailState] = useState({
    loading: false,
    type: "",
    message: "",
  });

  const credentialsPassword = String(
    portalAccountForm.resetPassword ||
      portalAccountForm.temporaryPassword ||
      ""
  ).trim();

  const credentialsEmail = String(
    portalAccount?.email || portalAccountForm.email || ""
  ).trim();

  const canEmailCredentials =
    Boolean(portalAccount?.id) &&
    portalAccount?.is_active !== false &&
    credentialsEmail.includes("@") &&
    credentialsPassword.length >= 10 &&
    !credentialsEmailState.loading &&
    !portalAccountSaving;

  const copyPassword = async (value, fieldName) => {
    const password = String(value || "");
    if (!password) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = password;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        document.execCommand("copy");
        document.body.removeChild(temporaryInput);
      }

      setCopiedField(fieldName);
      setCopyToast(
        fieldName === "temporary"
          ? "Temporary password copied to clipboard."
          : "Reset password copied to clipboard."
      );

      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldName ? "" : current));
        setCopyToast("");
      }, 2200);
    } catch (error) {
      console.error("Password copy failed:", error);
    }
  };

  const handleGeneratePassword = async () => {
    const generatedPassword = generateSecurePortalPassword();
    setShowTemporaryPassword(true);
    setCopiedField("");
    setCredentialsEmailState({
      loading: false,
      type: "",
      message: "",
    });

    if (generatedPassword) {
      await copyPassword(generatedPassword, "temporary");
      setCopyToast("Strong password generated and copied to clipboard.");
    }
  };

  const handleEmailCredentials = async () => {
    if (!canEmailCredentials) {
      setCredentialsEmailState({
        loading: false,
        type: "warning",
        message:
          "An active portal account, valid student email, and visible temporary password are required.",
      });
      return;
    }

    setCredentialsEmailState({
      loading: true,
      type: "info",
      message: "Sending portal credentials to the student...",
    });

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-portal-credentials",
        {
          body: {
            studentName: fullName || "Student",
            recipientEmail: credentialsEmail,
            temporaryPassword: credentialsPassword,
            mustChangePassword: Boolean(
              portalAccountForm.forcePasswordChange
            ),
            studentId,
            studentType,
            accountId: portalAccount?.id || null,
            action: "resend",
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Portal credentials email failed."
        );
      }

      setCredentialsEmailState({
        loading: false,
        type: "success",
        message:
          data?.message ||
          "Portal credentials emailed successfully.",
      });
    } catch (error) {
      console.error("Portal credentials email failed:", error);

      setCredentialsEmailState({
        loading: false,
        type: "warning",
        message:
          error?.message ||
          "Portal credentials could not be emailed.",
      });
    }
  };

  return (
    <>
      {copyToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-[1000] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border-[3px] border-[#34D399] bg-[#F0FFF8] px-4 py-3 text-sm font-black text-emerald-800 shadow-[0_18px_45px_rgba(18,56,101,0.22)] sm:right-6 sm:top-6"
        >
          <Check size={17} />
          <span className="break-words">{copyToast}</span>
        </div>
      ) : null}

      <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <div className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
              Student Portal Access Control
            </p>

            <h3 className="mt-3 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Portal Account Management
            </h3>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Create login access, reset temporary passwords, activate or deactivate access,
              and force password changes from the admin Student OS.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Portal Command
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Refresh the account state before creating, resetting, activating, or changing credentials.
            </p>
            <button
              type="button"
              onClick={loadPortalAccount}
              disabled={portalAccountLoading || Boolean(portalAccountSaving)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalAccountLoading ? "Checking Account..." : "Refresh Account"}
            </button>
          </div>
        </div>
      </div>

      {portalAccountStatus.message ? (
        <div
          role={portalAccountStatus.type === "warning" ? "alert" : "status"}
          className={`rounded-[1.35rem] border-[3px] p-4 text-sm font-semibold shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${
            portalAccountStatus.type === "success"
              ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
              : portalAccountStatus.type === "warning"
                ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
                : "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
          }`}
        >
          {portalAccountStatus.message}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalAccountStat
          label="Account Status"
          value={portalAccount ? (portalAccount.is_active ? "Active" : "Inactive") : "Not Created"}
          tone={portalAccount?.is_active ? "success" : portalAccount ? "danger" : "muted"}
        />
        <PortalAccountStat
          label="Must Change Password"
          value={portalAccount?.must_change_password ? "Yes" : "No"}
          tone={portalAccount?.must_change_password ? "warning" : "muted"}
        />
        <PortalAccountStat
          label="Last Login"
          value={formatPortalDate(portalAccount?.last_login_at)}
        />
        <PortalAccountStat
          label="Password Changed"
          value={formatPortalDate(portalAccount?.password_changed_at)}
        />
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
          <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-xl font-black text-[#10233F]">Login Details</h4>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                These values are used when creating or resetting a student's portal login.
              </p>
            </div>

            {portalAccount ? (
              <span className="rounded-full border-2 border-[#34D399] bg-[#F0FFF8] px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                Account Found
              </span>
            ) : (
              <span className="rounded-full border-2 border-[#F59E0B] bg-[#FFF7ED] px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                No Account
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Student Email
              </span>
              <input
                value={portalAccountForm.email}
                onChange={(event) =>
                  setPortalAccountForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-2 min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                placeholder="student@email.com"
              />
            </label>

            <div className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Temporary Password
              </span>

              <div className="relative mt-2">
                <input
                  type={showTemporaryPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={portalAccountForm.temporaryPassword}
                  onChange={(event) => {
                    setPortalAccountForm((prev) => ({
                      ...prev,
                      temporaryPassword: event.target.value,
                    }));
                    setCopiedField("");
                  }}
                  className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] py-2.5 pl-3 pr-[5.75rem] text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                  placeholder="Minimum 10 characters"
                />

                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowTemporaryPassword((current) => !current)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9D7E6] bg-white text-[#123865] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                    aria-label={showTemporaryPassword ? "Hide temporary password" : "Show temporary password"}
                    title={showTemporaryPassword ? "Hide temporary password" : "Show temporary password"}
                  >
                    {showTemporaryPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyPassword(portalAccountForm.temporaryPassword, "temporary")}
                    disabled={!portalAccountForm.temporaryPassword}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9D7E6] bg-white text-[#123865] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Copy temporary password"
                    title="Copy temporary password"
                  >
                    {copiedField === "temporary" ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-2 text-xs font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-[#FFE8D5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                >
                  <Sparkles size={13} />
                  Generate Strong Password
                </button>

                {copiedField === "temporary" ? (
                  <span
                    role="status"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-[#34D399] bg-[#F0FFF8] px-3 py-2 text-xs font-black text-emerald-700"
                  >
                    <Check size={13} />
                    Password Copied
                  </span>
                ) : null}
              </div>
            </div>

            <div className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Reset Password Override
              </span>

              <div className="relative mt-2">
                <input
                  type={showResetPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={portalAccountForm.resetPassword}
                  onChange={(event) => {
                    setPortalAccountForm((prev) => ({ ...prev, resetPassword: event.target.value }));
                    setCopiedField("");
                  }}
                  className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] py-2.5 pl-3 pr-[5.75rem] text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                  placeholder="Optional. Leave blank to reuse temporary password."
                />

                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((current) => !current)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9D7E6] bg-white text-[#123865] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                    aria-label={showResetPassword ? "Hide reset password" : "Show reset password"}
                    title={showResetPassword ? "Hide reset password" : "Show reset password"}
                  >
                    {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyPassword(portalAccountForm.resetPassword, "reset")}
                    disabled={!portalAccountForm.resetPassword}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9D7E6] bg-white text-[#123865] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Copy reset password"
                    title="Copy reset password"
                  >
                    {copiedField === "reset" ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {copiedField === "reset" ? (
                <span
                  role="status"
                  className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl border-2 border-[#34D399] bg-[#F0FFF8] px-3 py-1.5 text-xs font-black text-emerald-700"
                >
                  <Check size={13} />
                  Reset Password Copied
                </span>
              ) : null}
            </div>
          </div>

          <label className="mt-4 flex min-w-0 items-center gap-3 rounded-[1.3rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
            <input
              type="checkbox"
              checked={portalAccountForm.forcePasswordChange}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({
                  ...prev,
                  forcePasswordChange: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[#FF5A0A]"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Force password change on next login
              </span>
              <span className="text-xs text-slate-500">
                Recommended for all new and reset portal accounts.
              </span>
            </span>
          </label>
        </div>

        <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
          <h4 className="text-lg font-bold text-slate-900">Student Mapping</h4>
          <div className="mt-4 grid gap-3">
            <PortalInfoRow label="Student" value={fullName} />
            <PortalInfoRow label="Email" value={portalAccount?.email || portalAccountForm?.email || "No email added"} />
            <PortalInfoRow label="Master identity" value={masterIdentityLabel} />
            <PortalInfoRow label="Source record" value={`${studentType} #${studentId}`} />
            <PortalInfoRow label="Account ID" value={portalAccount?.id || "Not created yet"} />
            <PortalInfoRow label="Created" value={formatPortalDate(portalAccount?.created_at)} />
            <PortalInfoRow label="Updated" value={formatPortalDate(portalAccount?.updated_at)} />
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Admin Controls</h4>
            <p className="text-sm text-slate-500">
              Full portal access controls are connected to studentPortal.js backend actions.
            </p>
          </div>

          {portalAccountSaving ? (
            <span className="rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-1.5 text-xs font-black text-orange-700">
              Working...
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            type="button"
            disabled={Boolean(portalAccountSaving) || Boolean(portalAccount)}
            onClick={() => handlePortalAccountAction("create")}
            className="min-h-11 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-4 py-3 text-sm font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFE8D5] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {portalAccountSaving === "create" ? "Creating..." : "Create Account"}
          </button>

          <button
            type="button"
            disabled={Boolean(portalAccountSaving) || !portalAccount}
            onClick={() => handlePortalAccountAction("reset")}
            className="min-h-11 rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] px-4 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {portalAccountSaving === "reset" ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            disabled={Boolean(portalAccountSaving) || !portalAccount || portalAccount.is_active}
            onClick={() => handlePortalAccountAction("activate")}
            className="min-h-11 rounded-xl border-2 border-[#34D399] bg-[#F0FFF8] px-4 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {portalAccountSaving === "activate" ? "Activating..." : "Activate"}
          </button>

          <button
            type="button"
            disabled={Boolean(portalAccountSaving) || !portalAccount || !portalAccount.is_active}
            onClick={() => handlePortalAccountAction("deactivate")}
            className="min-h-11 rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-4 py-3 text-sm font-black text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {portalAccountSaving === "deactivate" ? "Deactivating..." : "Deactivate"}
          </button>

          <button
            type="button"
            disabled={Boolean(portalAccountSaving) || !portalAccount}
            onClick={() => handlePortalAccountAction("force_change")}
            className="min-h-11 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {portalAccountSaving === "force_change" ? "Updating..." : "Force Change"}
          </button>
        </div>

        <div className="mt-5 border-t-2 border-dashed border-[#C9D7E6] pt-5">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-center">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FF5A0A]">
                Student Communication
              </p>
              <h5 className="mt-1 text-lg font-black text-[#10233F]">
                Email Portal Credentials
              </h5>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Send the email address, visible temporary password, secure portal link,
                and password-change instructions directly to the student.
              </p>

              {!credentialsPassword ? (
                <p className="mt-2 text-xs font-bold text-amber-700">
                  Generate or enter a temporary password before sending credentials.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleEmailCredentials}
              disabled={!canEmailCredentials}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e94f06] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Mail size={17} />
              {credentialsEmailState.loading
                ? "Sending Credentials..."
                : "Email Credentials"}
            </button>
          </div>

          {credentialsEmailState.message ? (
            <div
              role={
                credentialsEmailState.type === "warning"
                  ? "alert"
                  : "status"
              }
              className={`mt-4 rounded-xl border-2 px-4 py-3 text-sm font-bold ${
                credentialsEmailState.type === "success"
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                  : credentialsEmailState.type === "warning"
                    ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
                    : "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
              }`}
            >
              {credentialsEmailState.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </>
  );
}

function PortalAccountStat({ label, value, tone = "muted" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} tone={toZaifanMetricTone(tone)} />;
}

function PortalInfoRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3 shadow-[0_4px_12px_rgba(18,56,101,0.03)]">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-xs font-black leading-5 text-[#10233F] sm:break-words">
        {value || "—"}
      </p>
    </div>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal") || value.includes("info")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
}

export default StudentPortalAccessPanel;
