import { Sparkles } from "lucide-react";

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
  return (
<div className="space-y-5">
    <div className="overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_10px_28px_rgba(15,35,63,0.055)]">
      <div className="flex flex-col gap-4 bg-[#123865] p-5 text-white lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
            Student Portal Access Control
          </p>

          <h3 className="mt-1 break-words text-xl font-black text-white">
            Portal Account Management
          </h3>

          <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
            Create login access, reset temporary passwords, activate or deactivate access,
            and force password changes from the admin Student OS.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPortalAccount}
          disabled={portalAccountLoading || Boolean(portalAccountSaving)}
          className="shrink-0 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:border-orange-300/60 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalAccountLoading ? "Checking Account..." : "Refresh Account"}
        </button>
      </div>
    </div>

    {portalAccountStatus.message ? (
      <div
        className={`rounded-[1.3rem] border-2 p-4 text-sm font-semibold ${
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

    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
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

    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Login Details</h4>
            <p className="mt-1 text-sm text-slate-500">
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
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              placeholder="student@email.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Temporary Password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={portalAccountForm.temporaryPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({
                  ...prev,
                  temporaryPassword: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              placeholder="Minimum 10 characters"
            />

            <button
              type="button"
              onClick={generateSecurePortalPassword}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] px-3 py-2 text-xs font-black text-orange-700 transition hover:bg-[#FFE8D5]"
            >
              <Sparkles size={13} />
              Generate Strong Password
            </button>
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Reset Password Override
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={portalAccountForm.resetPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, resetPassword: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              placeholder="Optional. Leave blank to reuse temporary password."
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4">
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

      <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-5">
        <h4 className="text-lg font-bold text-slate-900">Student Mapping</h4>
        <div className="mt-4 grid gap-3">
          <PortalInfoRow label="Student" value={fullName} />
          <PortalInfoRow label="Email" value={portalAccount?.email || portalAccountForm?.email || "No email added"} />
          <PortalInfoRow label="Master identity" value={masterIdentityLabel} />
          <PortalInfoRow
            label="Source record"
            value={`${studentType} #${studentId}`}
          />
          <PortalInfoRow label="Account ID" value={portalAccount?.id || "Not created yet"} />
          <PortalInfoRow label="Created" value={formatPortalDate(portalAccount?.created_at)} />
          <PortalInfoRow label="Updated" value={formatPortalDate(portalAccount?.updated_at)} />
        </div>
      </div>
    </div>

    <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-900">Admin Controls</h4>
          <p className="text-sm text-slate-500">
            Full portal access controls are connected to studentPortal.js backend actions.
          </p>
        </div>

        {portalAccountSaving ? (
          <span className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
            Working...
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || Boolean(portalAccount)}
          onClick={() => handlePortalAccountAction("create")}
          className="rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-[#FFE8D5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "create" ? "Creating..." : "Create Account"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("reset")}
          className="rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "reset" ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || portalAccount.is_active}
          onClick={() => handlePortalAccountAction("activate")}
          className="rounded-xl border-2 border-[#34D399] bg-[#F0FFF8] px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "activate" ? "Activating..." : "Activate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || !portalAccount.is_active}
          onClick={() => handlePortalAccountAction("deactivate")}
          className="rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "deactivate" ? "Deactivating..." : "Deactivate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("force_change")}
          className="rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "force_change" ? "Updating..." : "Force Change"}
        </button>
      </div>
    </div>
  </div>
  );
}

function PortalAccountStat({
  label,
  value,
  tone = "muted",
}) {
  const tones = {
    success: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    danger: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    warning: "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
    muted: "border-[#C9D7E6] bg-white text-[#10233F]",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.035)] ${tones[tone] || tones.muted}`}
    >
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.1em] opacity-65">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black leading-5 text-[#10233F]">
        {value || "—"}
      </p>
    </div>
  );
}

function PortalInfoRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#D1DCE7] bg-white px-3 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-xs font-black leading-5 text-[#10233F] sm:break-words">
        {value || "—"}
      </p>
    </div>
  );
}

export default StudentPortalAccessPanel;
