// Settings: your profile, your password, and the bank accounts students pay into.

import { useState } from "react";
import { Banknote, KeyRound, Plus, Trash2, UserRound } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { useAdminData } from "../data/AdminDataProvider";
import { humanize } from "../lib/format";
import PriceList from "./settings/PriceList";
import { Button, Card, CardHeader, Chip, EmptyState, Field, FormRow, Input, Modal, PageHeader, Select, Textarea, useConfirm, useForm, useToast } from "../ui/kit";

const ACCOUNT_TYPES = [
  { id: "bank", label: "Bank account" },
  { id: "easypaisa", label: "Easypaisa" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "upaisa", label: "UPaisa" },
  { id: "other", label: "Other" },
];

export default function SettingsPage() {
  const { admin, data, update, insert, remove, reload } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState(admin.name);
  const [savingName, setSavingName] = useState(false);
  const [passwords, setPasswords] = useState({ next: "", again: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [accountModal, setAccountModal] = useState(null);

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await update("admins", admin.id, { full_name: name.trim() });
      toast.push("Name updated. It shows after your next login.");
    } catch {
      // toast shown
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (passwords.next.length < 10) return toast.push({ tone: "error", message: "Use at least 10 characters." });
    if (passwords.next !== passwords.again) return toast.push({ tone: "error", message: "The two passwords don't match." });
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setSavingPassword(false);
    if (error) return toast.push({ tone: "error", message: error.message });
    setPasswords({ next: "", again: "" });
    toast.push("Password changed.");
  };

  const toggleAccount = (account) => update("paymentAccounts", account.id, { is_active: !account.is_active });

  const deleteAccount = async (account) => {
    const yes = await confirm({ title: `Remove ${account.account_title || account.bank_name}?`, text: "Students will no longer see this account.", confirmLabel: "Remove", danger: true });
    if (yes) await remove("paymentAccounts", account.id);
  };

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Your account and office details" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader icon={UserRound} title="Your profile" className="px-0 pt-0" />
          <div className="mt-4 space-y-3">
            <Field label="Your name">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Login email">
              <Input value={admin.email} disabled />
            </Field>
            <Field label="Role">
              <Input value={humanize(admin.role)} disabled />
            </Field>
            <Button variant="navy" busy={savingName} onClick={saveName} disabled={name.trim() === admin.name}>
              Save name
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader icon={KeyRound} title="Change your password" subtitle="At least 10 characters. You stay logged in." className="px-0 pt-0" />
          <div className="mt-4 space-y-3">
            <Field label="New password">
              <Input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} autoComplete="new-password" />
            </Field>
            <Field label="Type it again">
              <Input type="password" value={passwords.again} onChange={(event) => setPasswords({ ...passwords, again: event.target.value })} autoComplete="new-password" />
            </Field>
            <Button variant="navy" busy={savingPassword} onClick={savePassword} disabled={!passwords.next}>
              Change password
            </Button>
          </div>
        </Card>

        <Card className="pb-3 lg:col-span-2">
          <CardHeader
            icon={Banknote}
            title="Where students pay"
            subtitle="These accounts are shown to students when they have an invoice to pay."
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setAccountModal({})}>
                Add account
              </Button>
            }
          />
          <ul className="mt-3 grid gap-2 px-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.paymentAccounts.map((account) => (
              <li key={account.id} className="flex flex-col rounded-2xl border border-[#071f50]/8 p-4" style={{ opacity: account.is_active ? 1 : 0.55 }}>
                <div className="flex items-center justify-between gap-2">
                  <Chip color="#071f50" dot={false}>
                    {ACCOUNT_TYPES.find((type) => type.id === account.account_type)?.label || humanize(account.account_type)}
                  </Chip>
                  {!account.is_active ? <Chip color="#94a3b8">Hidden</Chip> : null}
                </div>
                <p className="mt-3 text-[15px] font-black text-[#071f50]">{account.account_title || "—"}</p>
                <p className="text-[13px] font-semibold text-[#071f50]/60">{account.bank_name}</p>
                <p className="mt-2 font-mono text-[13px] font-bold text-[#071f50]">{account.account_number || account.mobile_wallet_number}</p>
                {account.iban ? <p className="font-mono text-[11.5px] text-[#071f50]/55">{account.iban}</p> : null}
                <div className="mt-auto flex gap-1.5 pt-3">
                  <Button size="sm" onClick={() => setAccountModal(account)}>
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => toggleAccount(account)}>
                    {account.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => deleteAccount(account)} aria-label="Remove" />
                </div>
              </li>
            ))}
          </ul>
          {!data.paymentAccounts.length ? <EmptyState compact icon={Banknote} title="No payment accounts yet" text="Add your bank, Easypaisa or JazzCash details." /> : null}
        </Card>

        <PriceList />
      </div>

      <AccountModal
        key={accountModal?.id || (accountModal ? "new" : "closed")}
        account={accountModal}
        onClose={() => setAccountModal(null)}
        onSave={async (form) => {
          const payload = { ...form, created_by: admin.id };
          if (accountModal?.id) await update("paymentAccounts", accountModal.id, form);
          else await insert("paymentAccounts", payload);
          await reload(["paymentAccounts"]);
          setAccountModal(null);
          toast.push("Payment account saved.");
        }}
      />
    </div>
  );
}

function AccountModal({ account, onClose, onSave }) {
  const open = Boolean(account);
  const [form, set] = useForm({
    account_type: account?.account_type || "bank",
    account_title: account?.account_title || "",
    bank_name: account?.bank_name || "",
    account_number: account?.account_number || "",
    iban: account?.iban || "",
    mobile_wallet_number: account?.mobile_wallet_number || "",
    instructions: account?.instructions || "",
    is_active: account?.is_active !== false,
  });
  const [busy, setBusy] = useState(false);

  const isWallet = form.account_type !== "bank";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account?.id ? "Edit payment account" : "Add payment account"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            busy={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(form);
              } finally {
                setBusy(false);
              }
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormRow>
          <Field label="Type">
            <Select value={form.account_type} onChange={set("account_type")}>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Account title" hint="name on the account">
            <Input value={form.account_title} onChange={set("account_title")} placeholder="Zaifan Consultancy" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label={isWallet ? "Wallet / provider" : "Bank name"}>
            <Input value={form.bank_name} onChange={set("bank_name")} placeholder={isWallet ? "Easypaisa" : "Meezan Bank"} />
          </Field>
          {isWallet ? (
            <Field label="Mobile number">
              <Input value={form.mobile_wallet_number} onChange={set("mobile_wallet_number")} placeholder="03xx xxxxxxx" />
            </Field>
          ) : (
            <Field label="Account number">
              <Input value={form.account_number} onChange={set("account_number")} />
            </Field>
          )}
        </FormRow>
        {!isWallet ? (
          <Field label="IBAN" hint="optional">
            <Input value={form.iban} onChange={set("iban")} placeholder="PK00 XXXX 0000 0000 0000 0000" />
          </Field>
        ) : null}
        <Field label="Instructions for students" hint="optional">
          <Textarea value={form.instructions} onChange={set("instructions")} placeholder="Please write your full name in the transfer note." rows={2} />
        </Field>
      </div>
    </Modal>
  );
}
