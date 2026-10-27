import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, MessageCircle, Plane, Plus, RotateCcw, Send, ShieldCheck } from "lucide-react";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { FlagMark } from "../destinations/DestinationUI";

const WHATSAPP_NUMBER = "923305718131";
const NOT_SURE = "Not sure yet";
const LEVELS = ["Bachelor", "Master", "PhD", NOT_SURE];
const LEVEL_LABELS = { Bachelor: "Bachelor’s", Master: "Master’s", PhD: "PhD" };
// What the student has already finished, so the advisor knows the starting point.
const COMPLETED = ["Matric / O-Levels", "FSc / A-Levels", "Bachelor's", "Master's"];
const CONTACT_METHODS = ["WhatsApp", "Phone call", "Email"];
const CALL_TIMES = ["Morning", "Afternoon", "Evening", "Any time"];
const FIELDS = [
  "Computer Science",
  "Business",
  "Engineering",
  "Medical / Health Sciences",
  "Social Sciences",
  "Arts & Design",
  NOT_SURE,
];

// Country codes for the "To" field.
const COUNTRY_CODES = {
  italy: "ITA",
  germany: "DEU",
  france: "FRA",
  belgium: "BEL",
  romania: "ROU",
  lithuania: "LTU",
  turkey: "TUR",
  china: "CHN",
  vietnam: "VNM",
};

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  country: NOT_SURE,
  completed: "",
  level: NOT_SURE,
  contactVia: "WhatsApp",
  callTime: "Any time",
  field: NOT_SURE,
  message: "",
};

// A barcode that changes with the passenger's details (decorative only).
function Barcode({ seed }) {
  const bars = useMemo(() => {
    const hash = [...seed].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 9973, 7);
    return Array.from({ length: 30 }, (_, index) => 1 + (((hash + index * 37) * (index + 11)) % 3));
  }, [seed]);

  return (
    <div className="flex h-12 items-stretch gap-[2px]" aria-hidden="true">
      {bars.map((width, index) => (
        <span key={index} className="bg-white" style={{ width: `${width}px`, opacity: index % 5 === 0 ? 0.5 : 1 }} />
      ))}
    </div>
  );
}

function PassField({ label, children }) {
  return (
    <label className="block border-b-2 border-dashed border-orange-200 pb-1.5 transition focus-within:border-[#ff4b12]">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a879c]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "mt-1 w-full bg-transparent text-lg font-black text-[#071f50] outline-none placeholder:font-bold placeholder:text-[#b3bccb]";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1 transition ${
        active ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-[#fff7ed] ring-orange-100 hover:text-[#ff4b12]"
      }`}
    >
      {children}
    </button>
  );
}

function ChipGroup({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a879c]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// Flips like a departure board whenever the code changes.
function FlipCode({ code, className }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={code}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ rotateX: 90, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={`font-mono font-black ${className}`}
      >
        {code}
      </motion.p>
    </AnimatePresence>
  );
}

function PassForm() {
  const [form, setForm] = useState(EMPTY);
  const [noteOpen, setNoteOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const [sentName, setSentName] = useState("");

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    if (error) setError("");
  };

  const country = countryList.find((item) => item.name === form.country);
  const toCode = country ? COUNTRY_CODES[country.slug] : "ANY";
  const toLabel = country ? country.name : "Best fit for you";
  const passenger = form.name.trim() ? form.name.trim().toUpperCase() : "YOUR NAME";

  const submit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    if (form.phone.replace(/[^\d]/g, "").length < 9) {
      setError("Please add a phone or WhatsApp number so an advisor can reach you.");
      return;
    }

    setStatus("sending");
    setError("");

    const extras = [
      form.completed ? `Completed: ${form.completed}.` : "",
      `Best time to reach: ${form.callTime}.`,
      form.message.trim(),
    ].filter(Boolean);

    // Same shape as the main contact form, so the CRM treats both alike.
    const inquiry = {
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      field_of_interest: form.field,
      study_level: form.level,
      country: form.country,
      // How the student wants to be contacted.
      counseling_mode: form.contactVia,
      preferred_date: null,
      city: "",
      message: extras.join(" ") || "Sent from the home page boarding pass.",
      status: "new",
      lead_source: "website_home_boarding_pass",
    };

    // Load the database client only when someone submits, keeping it off the home page bundle.
    const { supabase } = await import("../../../lib/supabaseClient");
    const { error: insertError } = await supabase.from("inquiries").insert([inquiry]);

    if (insertError) {
      console.error("Inquiry submission failed:", insertError);
      setError("We couldn't send this right now. Please try again, or message us on WhatsApp.");
      setStatus("error");
      return;
    }

    try {
      const { error: emailError } = await supabase.functions.invoke("send-email", { body: inquiry });
      if (emailError) console.error("Email notification failed:", emailError);
    } catch (notifyError) {
      console.error("Email notification failed:", notifyError);
    }

    setSentName(inquiry.full_name.split(" ")[0]);
    setForm(EMPTY);
    setNoteOpen(false);
    setStatus("sent");
  };

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Zaifan Consultancy, I'd like help planning my studies abroad."
  )}`;

  return (
    <section id="apply" className="scroll-mt-24 bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-[1250px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
            <Plane size={14} /> Your boarding pass
          </p>
          <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Get your free <span className="text-[#ff4b12]">study plan.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-[#526178] md:text-base">
            Fill in your pass and send it. An advisor will contact you on WhatsApp or email. Free, with no obligation.
          </p>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 flex flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_40px_90px_rgba(7,31,80,0.16)] ring-1 ring-orange-100 lg:flex-row"
        >
          {/* Main part of the pass: the form */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between bg-[#ff4b12] px-6 py-3 text-white md:px-8">
              <p className="text-[11px] font-black uppercase tracking-[0.22em]">Zaifan · Boarding pass</p>
              <Plane size={18} fill="currentColor" />
            </div>

            <div className="grid gap-x-8 gap-y-6 p-6 md:p-8 lg:grid-cols-2">
              {/* About you */}
              <div className="space-y-5">
                <PassField label="Passenger name">
                  <input
                    required
                    value={form.name}
                    onChange={(event) => set({ name: event.target.value })}
                    placeholder="Your full name"
                    autoComplete="name"
                    maxLength={60}
                    className={inputClass}
                  />
                </PassField>
                <PassField label="Phone / WhatsApp">
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(event) => set({ phone: event.target.value })}
                    placeholder="03xx xxxxxxx"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </PassField>
                <PassField label="Email">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => set({ email: event.target.value })}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </PassField>
                <PassField label="Subject you want to study">
                  <select value={form.field} onChange={(event) => set({ field: event.target.value })} className={`${inputClass} cursor-pointer`}>
                    {FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </PassField>
                <ChipGroup label="Reach me on">
                  {CONTACT_METHODS.map((method) => (
                    <Chip key={method} active={form.contactVia === method} onClick={() => set({ contactVia: method })}>
                      {method}
                    </Chip>
                  ))}
                </ChipGroup>
                <ChipGroup label="Best time to reach me">
                  {CALL_TIMES.map((time) => (
                    <Chip key={time} active={form.callTime === time} onClick={() => set({ callTime: time })}>
                      {time}
                    </Chip>
                  ))}
                </ChipGroup>
              </div>

              {/* Your route */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-[22px] bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a879c]">From</p>
                    <p className="font-mono text-2xl font-black sm:text-3xl">PAK</p>
                    <p className="truncate text-[11px] font-bold text-[#7a879c]">Pakistan</p>
                  </div>
                  <span className="flex flex-1 items-center gap-2 text-[#ff4b12]">
                    <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#ffb36d_0_6px,transparent_6px_12px)]" />
                    <Plane size={18} fill="currentColor" />
                    <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#ffb36d_0_6px,transparent_6px_12px)]" />
                  </span>
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a879c]">To</p>
                    <FlipCode code={toCode} className="text-2xl text-[#ff4b12] sm:text-3xl" />
                    <p className="truncate text-[11px] font-bold text-[#7a879c]">{toLabel}</p>
                  </div>
                </div>

                <ChipGroup label="Which country?">
                  {countryList.map((item) => (
                    <Chip key={item.slug} active={form.country === item.name} onClick={() => set({ country: item.name })}>
                      <FlagMark country={item} className="h-3.5 w-5 rounded-[2px] shadow-none" />
                      {item.name}
                    </Chip>
                  ))}
                  <Chip active={form.country === NOT_SURE} onClick={() => set({ country: NOT_SURE })}>
                    Not sure yet
                  </Chip>
                </ChipGroup>

                <ChipGroup label="I have completed">
                  {COMPLETED.map((item) => (
                    <Chip key={item} active={form.completed === item} onClick={() => set({ completed: form.completed === item ? "" : item })}>
                      {item}
                    </Chip>
                  ))}
                </ChipGroup>

                <ChipGroup label="Now I want to study a">
                  {LEVELS.map((level) => (
                    <Chip key={level} active={form.level === level} onClick={() => set({ level })}>
                      {LEVEL_LABELS[level] || level}
                    </Chip>
                  ))}
                </ChipGroup>

                <p className="rounded-2xl bg-[#fff7ed] px-4 py-3 text-xs font-bold leading-5 text-[#61708a] ring-1 ring-orange-100">
                  <span className="font-black text-[#071f50]">Not sure about something?</span> That's completely fine. Pick "Not sure yet" and
                  we'll work it out together on the call.
                </p>
              </div>

              {/* Optional note */}
              <div className="lg:col-span-2">
                {noteOpen ? (
                  <PassField label="Anything else? (optional)">
                    <textarea
                      // Only shown after the visitor asks for it, so moving focus here is expected.
                      autoFocus
                      value={form.message}
                      onChange={(event) => set({ message: event.target.value })}
                      rows={2}
                      maxLength={600}
                      placeholder="Your grades, budget or questions"
                      className={`${inputClass} resize-none text-base`}
                    />
                  </PassField>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#7a879c] transition hover:text-[#ff4b12]"
                  >
                    <Plus size={14} strokeWidth={3} /> Add a note (grades, budget or questions)
                  </button>
                )}

                {error && (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100" role="alert">
                    {error}{" "}
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="font-black underline">
                      WhatsApp us
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stub: live summary and the send button */}
          <div className="relative flex flex-col justify-between gap-6 bg-[#071f50] p-6 text-white md:p-8 lg:w-[300px] lg:shrink-0">
            <span className="zaifan-perforation absolute -top-1.5 left-0 right-0 h-3 lg:-left-1.5 lg:bottom-0 lg:right-auto lg:top-0 lg:h-auto lg:w-3" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Passenger</p>
              <p className={`mt-1 break-words font-black leading-tight ${passenger.length > 22 ? "text-base" : "text-xl"}`}>{passenger}</p>

              <div className="mt-5 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">From</p>
                  <p className="font-mono text-2xl font-black">PAK</p>
                </div>
                <Plane size={16} className="mb-2 text-[#ff7b1c]" fill="currentColor" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">To</p>
                  <p className="font-mono text-4xl font-black text-[#ff7b1c]">{toCode}</p>
                </div>
              </div>
              <p className="mt-1 text-right text-xs font-bold text-white/60">{toLabel}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-black uppercase tracking-[0.16em] text-white/50">Gate</p>
                  <p className="mt-0.5 font-black text-[#ffb36d]">Free call</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.16em] text-white/50">Class</p>
                  <p className="mt-0.5 font-black">{form.level === NOT_SURE ? "Student" : form.level}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">What happens next</p>
                <ol className="mt-3 space-y-2.5">
                  {["We read your pass", "An advisor contacts you", "You get your study plan"].map((item, index) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-black">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] text-[#ff7b1c]">{index + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div>
              <Barcode seed={`${passenger}-${toCode}-${form.level}`} />
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff642f] disabled:translate-y-0 disabled:opacity-70"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send my pass <Send size={16} strokeWidth={2.6} />
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white/55">
                <ShieldCheck size={13} className="text-emerald-300" /> Free · No obligation
              </p>
            </div>
          </div>

          {/* Sent: stamp the pass */}
          <AnimatePresence>
            {status === "sent" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 grid place-items-center bg-white/85 p-6 backdrop-blur-sm"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 2.4, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    className="mx-auto grid h-40 w-40 place-items-center rounded-full border-[6px] border-double border-emerald-500 text-emerald-600"
                  >
                    <div>
                      <CheckCircle2 size={40} className="mx-auto" />
                      <p className="mt-1 text-xl font-black uppercase tracking-[0.12em]">Boarded</p>
                    </div>
                  </motion.div>
                  <h3 className="mt-6 text-3xl font-black tracking-[-0.04em]">Thanks{sentName ? `, ${sentName}` : ""}!</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#526178]">
                    Your pass is with our team. An advisor will contact you soon on WhatsApp or email.
                  </p>
                  <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-white"
                    >
                      <MessageCircle size={16} /> Chat now on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff7ed] px-5 py-3 text-sm font-black ring-1 ring-orange-100"
                    >
                      <RotateCcw size={15} /> Send another
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </section>
  );
}

export default PassForm;
