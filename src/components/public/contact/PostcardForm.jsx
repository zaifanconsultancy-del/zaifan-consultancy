import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Loader2, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { FlagMark } from "../destinations/DestinationUI";
import { DESTINATIONS, NOT_SURE, OFFICE, destinationCode, findDestination, whatsappLink } from "./contactInfo";

const TOPICS = ["Costs & budget", "Scholarships", "Universities", "Admission", "Visa", "Documents", "Something else"];
const LEVELS = ["Bachelor", "Master", "PhD", "Diploma / Foundation", "Language Program", NOT_SURE];
const FIELDS = ["Computer Science", "Business", "Engineering", "Medical / Health Sciences", "Social Sciences", "Arts & Design", NOT_SURE];
const INTAKES = ["January / February", "April / May", "September / October", "Next available intake", NOT_SURE];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  country: NOT_SURE,
  studyLevel: NOT_SURE,
  intake: NOT_SURE,
  fieldOfInterest: NOT_SURE,
  topic: "",
  message: "",
};

// Links like /contact?country=Germany&service=visa-guidance&field=Business prefill the card.
function initialCard() {
  if (typeof window === "undefined") return EMPTY;
  const params = new URLSearchParams(window.location.search);
  const service = params.get("service");
  const field = params.get("field");
  return {
    ...EMPTY,
    country: findDestination(params.get("country")) || NOT_SURE,
    fieldOfInterest: FIELDS.includes(field) ? field : NOT_SURE,
    message: service ? `I want guidance about ${service.replaceAll("-", " ")}.` : "",
  };
}

function Line({ label, children }) {
  return (
    <label className="block border-b-2 border-dashed border-[#071f50]/15 pb-1.5 transition focus-within:border-[#ff4b12]">
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">{label}</span>
      {children}
    </label>
  );
}

const lineInput = "mt-1 w-full bg-transparent text-base font-black text-[#071f50] outline-none placeholder:font-bold placeholder:text-[#b3bccb]";

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

function Select({ label, value, options, onChange }) {
  return (
    <Line label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${lineInput} cursor-pointer text-sm`}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Line>
  );
}

/**
 * The inquiry form as an airmail postcard: the message on the left, the
 * sender's details on the right, a stamp of the country they're dreaming of.
 * Saves to the same `inquiries` table as before.
 */
function PostcardForm({ bookingHref }) {
  const [card, setCard] = useState(initialCard);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const [sentName, setSentName] = useState("");

  const source = useMemo(() => {
    if (typeof window === "undefined") return "website_contact";
    const params = new URLSearchParams(window.location.search);
    return params.get("source") || params.get("utm_source") || "website_contact";
  }, []);

  const set = (patch) => {
    setCard((current) => ({ ...current, ...patch }));
    if (error) setError("");
  };

  const country = countryList.find((item) => item.name === card.country);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();

  const submit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    if (card.phone.replace(/[^\d]/g, "").length < 9) {
      setError("Please add a phone or WhatsApp number so an advisor can reach you.");
      return;
    }
    if (!card.message.trim() && !card.topic) {
      setError("Write a line or two, or pick a topic, so we know what to help with.");
      return;
    }

    setStatus("sending");
    setError("");

    const inquiry = {
      full_name: card.name.trim(),
      email: card.email.trim(),
      phone: card.phone.trim(),
      field_of_interest: card.fieldOfInterest,
      study_level: card.studyLevel,
      country: card.country,
      counseling_mode: card.intake,
      preferred_date: null,
      city: "",
      message: [card.topic ? `Topic: ${card.topic}.` : "", card.message.trim()].filter(Boolean).join("\n"),
      status: "new",
      lead_source: source,
    };

    // Load the database client only when someone submits.
    const { supabase } = await import("../../../lib/supabaseClient");
    const { error: insertError } = await supabase.from("inquiries").insert([inquiry]);

    if (insertError) {
      console.error("Inquiry submission failed:", insertError);
      setError("We couldn't send your card right now. Please try again, or message us on WhatsApp.");
      setStatus("idle");
      return;
    }

    try {
      const { error: emailError } = await supabase.functions.invoke("send-email", { body: inquiry });
      if (emailError) console.error("Email notification failed:", emailError);
    } catch (notifyError) {
      console.error("Email notification failed:", notifyError);
    }

    setSentName(inquiry.full_name.split(" ")[0]);
    setCard(EMPTY);
    setStatus("sent");
  };

  return (
    <section id="write" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1250px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] ring-1 ring-white/10">
              Desk A · <span className="text-[#ffb36d]">Ask a question</span>
            </span>
            <h2 className="mt-5 text-[2.4rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl md:text-6xl">
              Send us a postcard.
              <span className="block text-[#ff7b1c]">We write back.</span>
            </h2>
          </div>
          <p className="flex max-w-md items-start gap-2.5 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm font-bold leading-6 ring-1 ring-white/10">
            <span className="mt-[3px] shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">How to use</span>
            Pick a topic, write your question, fill in your details on the right and post it. Not sure about something? Leave it on
            &ldquo;Not sure yet&rdquo;.
          </p>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30, rotate: 0 }}
          whileInView={{ opacity: 1, y: 0, rotate: -0.6 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 overflow-hidden rounded-[14px] bg-[#fffdf8] p-2 text-[#071f50] shadow-[0_40px_90px_rgba(0,0,0,0.35)]"
        >
          {/* Airmail border */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[14px]"
            style={{ background: "repeating-linear-gradient(-45deg, #ff4b12 0 14px, #fffdf8 14px 24px, #071f50 24px 38px, #fffdf8 38px 48px)" }}
          />
          <div className="relative grid gap-0 rounded-[8px] bg-[#fffdf8] lg:grid-cols-[1.1fr_0.9fr]">
            {/* Message side */}
            <div className="p-6 md:p-8 lg:border-r-2 lg:border-[#071f50]/10">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">My question is about</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TOPICS.map((topic) => (
                  <Chip key={topic} active={card.topic === topic} onClick={() => set({ topic: card.topic === topic ? "" : topic })}>
                    {topic}
                  </Chip>
                ))}
              </div>

              <label className="mt-6 block">
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Dear Zaifan,</span>
                <textarea
                  value={card.message}
                  onChange={(event) => set({ message: event.target.value })}
                  rows={7}
                  maxLength={1200}
                  placeholder="Example: I finished FSc with 78% and want to study Computer Science in Germany or Italy. What would it cost, and can I get a scholarship?"
                  className="mt-1 w-full resize-none bg-transparent text-base font-bold leading-8 text-[#071f50] outline-none placeholder:font-semibold placeholder:text-[#b3bccb]"
                  style={{ backgroundImage: "repeating-linear-gradient(transparent 0 31px, rgba(7,31,80,0.12) 31px 32px)", lineHeight: "32px" }}
                />
              </label>

              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <Select label="Study level" value={card.studyLevel} options={LEVELS} onChange={(studyLevel) => set({ studyLevel })} />
                <Select label="Subject" value={card.fieldOfInterest} options={FIELDS} onChange={(fieldOfInterest) => set({ fieldOfInterest })} />
                <Select label="When to start" value={card.intake} options={INTAKES} onChange={(intake) => set({ intake })} />
              </div>
            </div>

            {/* Address side */}
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                {/* Postmark */}
                <div className="grid h-24 w-24 shrink-0 -rotate-12 place-items-center rounded-full border-[3px] border-double border-[#071f50]/30 text-center text-[#071f50]/50">
                  <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.12em]">Pakistan</p>
                    <p className="font-mono text-[9px] font-black">{today}</p>
                  </div>
                </div>
                {/* Stamp */}
                <div className="rotate-3 rounded-[6px] border-2 border-dashed border-[#071f50]/25 bg-white p-1.5 shadow-md">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={card.country}
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid w-[74px] place-items-center gap-1 rounded-[3px] bg-[#fff7ed] px-2 py-2.5"
                    >
                      {country ? (
                        <FlagMark country={country} className="h-8 w-12" />
                      ) : (
                        <span className="grid h-8 w-12 place-items-center rounded-sm bg-[#071f50] font-mono text-[10px] font-black text-[#ffb36d]">?</span>
                      )}
                      <span className="font-mono text-[11px] font-black">{destinationCode(card.country)}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-[#071f50]/[0.04] px-4 py-3">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">To</p>
                <p className="text-sm font-black">Zaifan Consultancy · {OFFICE}</p>
              </div>

              <div className="mt-5 space-y-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">From</p>
                <Line label="Your name">
                  <input required value={card.name} onChange={(event) => set({ name: event.target.value })} placeholder="Full name" autoComplete="name" maxLength={60} className={lineInput} />
                </Line>
                <Line label="Phone / WhatsApp">
                  <input required type="tel" value={card.phone} onChange={(event) => set({ phone: event.target.value })} placeholder="03xx xxxxxxx" autoComplete="tel" className={lineInput} />
                </Line>
                <Line label="Email">
                  <input required type="email" value={card.email} onChange={(event) => set({ email: event.target.value })} placeholder="you@example.com" autoComplete="email" className={lineInput} />
                </Line>
              </div>

              <div className="mt-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Dream destination</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DESTINATIONS.map((name) => {
                    const item = countryList.find((entry) => entry.name === name);
                    return (
                      <Chip key={name} active={card.country === name} onClick={() => set({ country: name })}>
                        {item && <FlagMark country={item} className="h-3.5 w-5 rounded-[2px] shadow-none" />}
                        {name}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                  {error}{" "}
                  <a href={whatsappLink()} target="_blank" rel="noreferrer" className="font-black underline">
                    WhatsApp us
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ff642f] disabled:translate-y-0 disabled:opacity-70"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Posting…
                  </>
                ) : (
                  <>
                    Post my card <Send size={16} strokeWidth={2.6} />
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#7a879c]">
                <ShieldCheck size={13} className="text-emerald-500" /> Free · Only our advisors see this
              </p>
            </div>
          </div>

          {/* Posted */}
          <AnimatePresence>
            {status === "sent" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-2 z-10 grid place-items-center rounded-[8px] bg-[#fffdf8]/95 p-6 backdrop-blur-sm"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 2.4, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: -10, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    className="mx-auto grid h-40 w-40 place-items-center rounded-full border-[6px] border-double border-emerald-500 text-emerald-600"
                  >
                    <div>
                      <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em]">{today}</p>
                      <p className="mt-1 text-2xl font-black uppercase tracking-[0.12em]">Posted</p>
                      <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em]">Peshawar</p>
                    </div>
                  </motion.div>
                  <h3 className="mt-6 text-3xl font-black tracking-[-0.04em]">Thanks{sentName ? `, ${sentName}` : ""}!</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#526178]">
                    Your card is with our team. An advisor will reply on WhatsApp, a call or email.
                  </p>
                  <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                    <Link
                      to={bookingHref}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]"
                    >
                      <CalendarCheck size={16} /> Also book a call time
                    </Link>
                    <a
                      href={whatsappLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-[#062b16]"
                    >
                      <FaWhatsapp size={16} /> Chat on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100"
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

export default PostcardForm;
