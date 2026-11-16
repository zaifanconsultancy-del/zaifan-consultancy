// The office price list. Each line can be picked when writing an invoice, so
// nobody has to remember or retype the fees.

import { useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { fmtMoney } from "../../lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, Field, FormRow, Input, Modal, Notice, Select, Textarea, useConfirm, useForm, useToast } from "../../ui/kit";

const PRICE_CATEGORIES = [
  ["service_fee", "Zaifan service fee"],
  ["application_fee", "University application fee"],
  ["visa_fee", "Visa fee"],
  ["translation", "Translation / attestation"],
  ["other", "Other"],
];

const CURRENCIES = ["PKR", "EUR", "USD", "GBP"];

export default function PriceList() {
  const { data, admin, insert, update, remove } = useAdminData();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // {} for new, or a row

  const prices = [...data.prices].sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const save = async (form) => {
    const row = {
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      description: form.description.trim() || null,
    };
    if (editing?.id) await update("prices", editing.id, { ...row, updated_at: new Date().toISOString() });
    else await insert("prices", { ...row, created_by: admin.id });
    setEditing(null);
    toast.push("Price list saved.");
  };

  const removePrice = async (price) => {
    const yes = await confirm({ title: `Remove “${price.name}”?`, text: "Invoices already made with it stay as they are.", confirmLabel: "Remove", danger: true });
    if (yes) await remove("prices", price.id);
  };

  return (
    <Card className="pb-3 lg:col-span-2">
      <CardHeader
        icon={Tags}
        title="Price list"
        subtitle="Your standard fees. When you write an invoice you pick one and the amount fills itself in."
        action={
          !data.missing.prices ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>
              Add a price
            </Button>
          ) : null
        }
      />

      {data.missing.prices ? (
        <Notice tone="info" className="mx-5 mt-3">
          The price list is built but not switched on in the database yet. It turns on with the next database update.
        </Notice>
      ) : prices.length ? (
        <ul className="mt-3 divide-y divide-[#071f50]/8 px-5">
          {prices.map((price) => (
            <li key={price.id} className="flex flex-wrap items-center gap-3 py-2.5" style={{ opacity: price.is_active === false ? 0.5 : 1 }}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-black text-[#071f50]">
                  {price.name}
                  {price.is_active === false ? <Chip color="#94a3b8">Hidden</Chip> : null}
                </p>
                <p className="truncate text-[12.5px] font-semibold text-[#071f50]/55">
                  {[PRICE_CATEGORIES.find(([id]) => id === price.category)?.[1], price.description].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-[15px] font-black tabular-nums text-[#071f50]">{fmtMoney(price.amount, price.currency)}</p>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => setEditing(price)}>
                  Edit
                </Button>
                <Button size="sm" onClick={() => update("prices", price.id, { is_active: price.is_active === false })}>
                  {price.is_active === false ? "Show" : "Hide"}
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => removePrice(price)} aria-label="Remove" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact icon={Tags} title="No prices yet" text="Add your packages and fees, for example “Italy full package” or “Document translation (per page)”." />
      )}

      <PriceModal key={editing?.id || (editing ? "new" : "closed")} price={editing} onClose={() => setEditing(null)} onSave={save} />
    </Card>
  );
}

function PriceModal({ price, onClose, onSave }) {
  const [form, set] = useForm({
    name: price?.name || "",
    category: price?.category || "service_fee",
    amount: price?.amount != null ? String(Number(price.amount)) : "",
    currency: price?.currency || "PKR",
    description: price?.description || "",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!form.name.trim()) return toast.push({ tone: "error", message: "Give it a name." });
    if (!(Number(form.amount) >= 0) || form.amount === "") return toast.push({ tone: "error", message: "Enter the price." });
    setBusy(true);
    try {
      await onSave(form);
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(price)}
      onClose={onClose}
      title={price?.id ? "Edit price" : "Add a price"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Name" hint="this becomes the invoice title" required>
          <Input value={form.name} onChange={set("name")} placeholder="Italy full package" />
        </Field>
        <Field label="Type">
          <Select value={form.category} onChange={set("category")}>
            {PRICE_CATEGORIES.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <FormRow>
          <Field label="Price" required>
            <Input type="number" min="0" value={form.amount} onChange={set("amount")} placeholder="150000" />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={set("currency")}>
              {CURRENCIES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="What is included" hint="optional, printed on the invoice">
          <Textarea value={form.description} onChange={set("description")} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}
