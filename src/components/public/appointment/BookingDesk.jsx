import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Check, Info, Loader2, Plane, RotateCcw, ShieldCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { FlagMark } from "../destinations/DestinationUI";
import { DESTINATIONS, destinationCode, findDestination, whatsappLink } from "../contact/contactInfo";
import {
  GENERAL_TYPES,
  NOT_SURE,
  STAGES,
  TIME_SLOTS,
  calendarLink,
  consultationTypes,
  countryTypes,
  defaultType,
  formatDate,
  isSpecificCountry,
  matchOption,
  pakistanToday,
  slotPassed,
  upcomingDays,
} from "./bookingData";

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  country_interest: NOT_SURE,
  consultation_type: "Free Consultation",
  appointment_date: "",
  appointment_time: "",
  message: "",
};

// Links like /appointment?country=Italy&service=Visa%20Guidance&university=...
// prefill the booking. Unknown values go into the message instead of being lost.
function initialBooking() {
  const params = new URLSearchParams(window.location.search);
  const countryParam = params.get("country");
  const serviceParam = params.get("service") || params.get("consultation");
  const university = params.get("university") || "";
  const city = params.get("city") || "";
  const dateParam = params.get("date");

  const matchedCountry = findDestination(countryParam);
  const country = matchedCountry || NOT_SURE;
  const matchedService = matchOption(consultationTypes(country), serviceParam);
  const time = matchOption(TIME_SLOTS, params.get("time"));
  const date = dateParam && dateParam >= pakistanToday() ? dateParam : "";

  const message = [
    params.get("message"),
    countryParam && !matchedCountry ? `Interested in: ${countryParam}.` : "",
    city ? `Preferred city: ${city}.` : "",
    university ? `I would like guidance for ${university}${city ? ` in ${city}` : ""} in ${matchedCountry || countryParam || "my target country"}.` : "",
    serviceParam && !matchedService ? `Requested service: ${serviceParam}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    form: {
      ...EMPTY,
      full_name: params.get("name") || "",
      email: params.get("email") || "",
      phone: params.get("phone") || "",
      country_interest: country,
      consultation_type: matchedService || defaultType(country),
      appointment_date: date,
      appointment_time: date && time && !slotPassed(time, date) ? time : "",
      message,
    },
    city,
    university,
    prefilled: Boolean(countryParam || serviceParam || university || city),
  };
}

function StepCard({ number, title, done, hint, children }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(7,31,80,0.08)] ring-1 ring-orange-100 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-sm font-black transition ${
              done ? "bg-emerald-500 text-white" : "bg-[#071f50] text-[#ffb36d]"
            }`}
          >
            {done ? <Check size={18} strokeWidth={4} /> : number}
          </span>
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">Step {number} of 3</p>
            <h2 className="text-xl font-black tracking-[-0.03em] md:text-2xl">{title}</h2>
          </div>
        </div>
      </div>
      {hint && <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-[#fff7ed] ring-orange-100 enabled:hover:text-[#ff4b12]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block border-b-2 border-dashed border-orange-200 pb-1.5 transition focus-within:border-[#ff4b12]">
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "mt-1 w-full bg-transparent text-lg font-black text-[#071f50] outline-none placeholder:font-bold placeholder:text-[#b3bccb]";

/** The boarding pass beside the form: fills in live and holds the confirm button. */
function LivePass({ form, city, university, steps, sending, onWhatsApp }) {
  const passenger = form.full_name.trim() ? form.full_name.trim().toUpperCase() : "YOUR NAME";
  const code = destinationCode(form.country_interest);

  return (
    <div className="overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_34px_70px_rgba(7,31,80,0.3)]">
      <div className="flex items-center justify-between bg-[#ff4b12] px-6 py-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em]">Zaifan · Call booking</p>
        <Plane size={18} fill="currentColor" />
      </div>
      <div className="p-6">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Passenger</p>
        <p className={`mt-1 break-words font-black leading-tight ${passenger.length > 22 ? "text-base" : "text-xl"}`}>{passenger}</p>

        <div className="mt-5 flex items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/50">From</p>
            <p className="font-mono text-2xl font-black">PAK</p>
          </div>
          <span className="mb-3 flex flex-1 items-center gap-1.5 text-[#ff7b1c]">
            <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#ffb36d_0_6px,transparent_6px_12px)]" />
            <Plane size={15} fill="currentColor" />
            <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#ffb36d_0_6px,transparent_6px_12px)]" />
          </span>
          <div className="text-right">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/50">To</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={code}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="font-mono text-4xl font-black text-[#ff7b1c]"
              >
                {code}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-white/10 pt-5 text-sm">
          <div className="col-span-2">
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Service</dt>
            <dd className="mt-0.5 font-black">{form.consultation_type}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Date</dt>
            <dd className={`mt-0.5 font-black ${form.appointment_date ? "text-[#ffb36d]" : "text-white/35"}`}>{formatDate(form.appointment_date) || "Pick in step 2"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Time (PKT)</dt>
            <dd className={`mt-0.5 font-black ${form.appointment_time ? "text-[#ffb36d]" : "text-white/35"}`}>{form.appointment_time || "Pick in step 2"}</dd>
          </div>
          {city && (
            <div>
              <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/50">City</dt>
              <dd className="mt-0.5 font-black">{city}</dd>
            </div>
          )}
          {university && (
            <div className="col-span-2">
              <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/50">University</dt>
              <dd className="mt-0.5 font-black">{university}</dd>
            </div>
          )}
        </dl>

        <ol className="mt-5 grid gap-2 border-t border-white/10 pt-5">
          {steps.map((step, index) => (
            <li key={step.label} className={`flex items-center gap-2.5 text-sm font-black ${step.done ? "" : "text-white/45"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${step.done ? "bg-emerald-400 text-[#071f50]" : "bg-white/10"}`}>
                {step.done ? <Check size={12} strokeWidth={4} /> : index + 1}
              </span>
              {step.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="relative bg-[#06183f] p-6">
        <span className="zaifan-perforation absolute -top-1.5 left-0 right-0 h-3" />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff642f] disabled:translate-y-0 disabled:opacity-70"
        >
          {sending ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Booking…
            </>
          ) : (
            <>Confirm my free call</>
          )}
        </button>
        <button
          type="button"
          onClick={onWhatsApp}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.08] px-6 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/[0.14]"
        >
          <FaWhatsapp size={16} className="text-[#25d366]" /> Or send this on WhatsApp
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white/55">
          <ShieldCheck size={13} className="text-emerald-300" /> Free · No obligation
        </p>
      </div>
    </div>
  );
}

/** After booking: the pass, stamped, with a calendar link. */
function BookedPass({ booking, emailFailed, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto mt-10 max-w-[720px] overflow-hidden rounded-[30px] bg-white text-center shadow-[0_40px_90px_rgba(7,31,80,0.16)] ring-1 ring-orange-100"
    >
      <div className="flex items-center justify-between bg-[#ff4b12] px-6 py-3 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.22em]">Zaifan · Call booking</p>
        <Plane size={18} fill="currentColor" />
      </div>
      <div className="p-6 md:p-10">
        <motion.div
          initial={{ scale: 2.4, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
          className="mx-auto grid h-36 w-36 place-items-center rounded-full border-[6px] border-double border-emerald-500 text-emerald-600"
        >
          <div>
            <Check size={34} strokeWidth={3.5} className="mx-auto" />
            <p className="mt-1 text-xl font-black uppercase tracking-[0.12em]">Booked</p>
          </div>
        </motion.div>
        <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] md:text-4xl">See you then, {booking.full_name.split(" ")[0]}!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#526178]">
          Our team will confirm your call on WhatsApp or email. If the time doesn&apos;t work for an advisor, we&apos;ll suggest another.
        </p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-[#fff7ed] p-4 text-left ring-1 ring-orange-100">
          {[
            ["Service", booking.consultation_type, true],
            ["Destination", booking.country_interest],
            ["Date", formatDate(booking.appointment_date, true)],
            ["Time", `${booking.appointment_time} (PKT)`],
          ].map(([label, value, wide]) => (
            <div key={label} className={wide ? "col-span-2" : ""}>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">{label}</p>
              <p className="text-sm font-black">{value}</p>
            </div>
          ))}
        </div>

        {emailFailed && (
          <p className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-left text-xs font-bold leading-5 text-amber-800 ring-1 ring-amber-200">
            <Info size={15} className="mt-0.5 shrink-0" /> Your booking is saved, but the confirmation email didn&apos;t go out. We&apos;ll still
            contact you.
          </p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <a
            href={calendarLink(booking)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]"
          >
            <CalendarPlus size={16} /> Add to Google Calendar
          </a>
          <a
            href={whatsappLink("Hi Zaifan, I just booked a free call on your website.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-[#062b16]"
          >
            <FaWhatsapp size={16} /> Message us
          </a>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff7ed] px-5 py-3 text-sm font-black ring-1 ring-orange-100"
          >
            <RotateCcw size={15} /> Book another
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The booking page's main block: three steps (where & what, when, who) and a
 * live boarding pass. Saves to the `appointments` table and triggers the
 * confirmation email exactly as before.
 */
function BookingDesk() {
  const [initial] = useState(initialBooking);
  const [form, setForm] = useState(initial.form);
  const [city, setCity] = useState(initial.city);
  const [university, setUniversity] = useState(initial.university);
  const [prefilled, setPrefilled] = useState(initial.prefilled);
  const [stage, setStage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [emailFailed, setEmailFailed] = useState(false);

  const days = useMemo(() => upcomingDays(14), []);
  const today = days[0].iso;
  const country = form.country_interest;
  const countryMeta = countryList.find((item) => item.name === country);
  const ownTypes = countryTypes(country);

  const set = (patch) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      if ("country_interest" in patch && !consultationTypes(next.country_interest).includes(next.consultation_type)) {
        next.consultation_type = defaultType(next.country_interest);
      }
      if ("appointment_date" in patch && next.appointment_time && slotPassed(next.appointment_time, next.appointment_date)) {
        next.appointment_time = "";
      }
      return next;
    });
    if (error) setError("");
  };

  const steps = [
    { label: "Where & what", done: Boolean(form.consultation_type) },
    { label: "Date & time", done: Boolean(form.appointment_date && form.appointment_time) },
    { label: "Your details", done: Boolean(form.full_name.trim() && form.phone.trim() && form.email.trim()) },
  ];

  const stageLine = STAGES.find((item) => item.label === stage)?.line || "";

  const openWhatsApp = () => {
    const text = [
      "Hi Zaifan Consultancy, I want to book a study abroad consultation.",
      "",
      `Name: ${form.full_name || "-"}`,
      `Country: ${country || "-"}`,
      `City: ${city || "-"}`,
      `University: ${university || "-"}`,
      `Service: ${form.consultation_type || "-"}`,
      `Preferred date: ${form.appointment_date ? formatDate(form.appointment_date, true) : "-"}`,
      `Preferred time: ${form.appointment_time ? `${form.appointment_time} PKT` : "-"}`,
      `Message: ${[stageLine, form.message].filter(Boolean).join(" ") || "-"}`,
    ].join("\n");
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;

    if (!form.appointment_date || !form.appointment_time) {
      setError("Pick a date and a time in step 2 first.");
      document.getElementById("when")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (slotPassed(form.appointment_time, form.appointment_date)) {
      setError("That time has just passed. Please pick a later slot.");
      return;
    }
    if (form.phone.replace(/[^\d]/g, "").length < 9) {
      setError("Please add a phone or WhatsApp number so an advisor can reach you.");
      return;
    }

    setSending(true);
    setError("");

    const appointment = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      country_interest: country || NOT_SURE,
      consultation_type: form.consultation_type || "Free Consultation",
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      message: [
        city ? `Selected city: ${city}` : "",
        university ? `Selected university: ${university}` : "",
        stageLine,
        form.message.trim(),
      ]
        .filter(Boolean)
        .join("\n\n"),
      status: "pending",
    };

    try {
      const { supabase } = await import("../../../lib/supabaseClient");
      const { error: insertError } = await supabase.from("appointments").insert([appointment]);

      if (insertError) {
        console.error("Appointment could not be saved:", insertError);
        setError("We couldn't save your booking right now. Please try again, or send it on WhatsApp.");
        setSending(false);
        return;
      }

      let emailOk = true;
      try {
        const { error: emailError } = await supabase.functions.invoke("send-appointment-email", {
          body: {
            fullName: appointment.full_name,
            email: appointment.email,
            phone: appointment.phone,
            country: appointment.country_interest,
            service: appointment.consultation_type,
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            message: appointment.message,
          },
        });
        if (emailError) {
          console.error("Appointment email failed:", emailError);
          emailOk = false;
        }
      } catch (emailError) {
        console.error("Appointment email failed:", emailError);
        emailOk = false;
      }

      setEmailFailed(!emailOk);
      setBooking(appointment);
      setForm(EMPTY);
      setCity("");
      setUniversity("");
      setStage("");
      setPrefilled(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      console.error("Appointment submit failed:", submitError);
      setError("Something went wrong. Please try again, or send it on WhatsApp.");
    }

    setSending(false);
  };

  const otherDate = form.appointment_date && !days.some((day) => day.iso === form.appointment_date) ? form.appointment_date : "";

  return (
    <section className="relative bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-[1350px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
              Desk B · <span className="text-[#ffb36d]">Book a call time</span>
            </span>
            <h1 className="mt-6 text-[3rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl xl:text-[5.4rem]">
              Book your free
              <span className="block text-[#ff4b12]">{isSpecificCountry(country) && !booking ? `${country} call.` : "advisor call."}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#5f6f89]">
              Three quick steps. Pick what you need, choose a time that suits you, and tell us how to reach you.
            </p>
          </div>
          <Link
            to="/contact#write"
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 ring-1 ring-orange-100 transition hover:text-[#ff4b12] lg:max-w-[300px] lg:self-end"
          >
            <Info size={16} className="shrink-0 text-[#ff4b12]" /> Only have a question? Send a message instead, no date needed.
          </Link>
        </div>

        {booking ? (
          <BookedPass
            booking={booking}
            emailFailed={emailFailed}
            onReset={() => {
              setBooking(null);
              setEmailFailed(false);
            }}
          />
        ) : (
          <form onSubmit={submit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
            {/* min-w-0 lets the day strip scroll instead of widening the column */}
            <div className="grid min-w-0 grid-cols-1 gap-5">
              {prefilled && (
                <p className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
                  <Check size={17} strokeWidth={3} className="mt-0.5 shrink-0" /> We filled in some details from the page you came from. Change anything you like.
                </p>
              )}

              <StepCard number={1} title="Where and what?" done={steps[0].done} hint="Pick the country you're thinking about (or “Not sure yet”) and what you want help with.">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Destination</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DESTINATIONS.map((name) => {
                    const item = countryList.find((entry) => entry.name === name);
                    return (
                      <Chip key={name} active={country === name} onClick={() => set({ country_interest: name })}>
                        {item && <FlagMark country={item} className="h-3.5 w-5 rounded-[2px] shadow-none" />}
                        {name}
                      </Chip>
                    );
                  })}
                </div>

                {countryMeta && (
                  <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-xs font-bold leading-5 text-[#5f6f89] ring-1 ring-orange-100">
                    <span className="font-black text-[#071f50]">{countryMeta.name} at a glance:</span> tuition {countryMeta.quickFacts.tuition}, living{" "}
                    {countryMeta.quickFacts.living}, intakes {countryMeta.quickFacts.intakes}.
                  </p>
                )}

                <p className="mt-6 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">What do you want help with?</p>
                {ownTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ownTypes.map((type) => (
                      <Chip key={type} active={form.consultation_type === type} onClick={() => set({ consultation_type: type })}>
                        {type}
                      </Chip>
                    ))}
                  </div>
                )}
                <div className={`flex flex-wrap gap-1.5 ${ownTypes.length ? "mt-3 border-t border-dashed border-orange-200 pt-3" : "mt-2"}`}>
                  {GENERAL_TYPES.map((type) => (
                    <Chip key={type} active={form.consultation_type === type} onClick={() => set({ consultation_type: type })}>
                      {type}
                    </Chip>
                  ))}
                </div>
              </StepCard>

              <div id="when" className="scroll-mt-28">
                <StepCard number={2} title="When suits you?" done={steps[1].done} hint="All times are Pakistan time (PKT). Slots less than an hour away are closed.">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Day</p>
                  <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                    {days.map((day) => {
                      const active = form.appointment_date === day.iso;
                      const closed = TIME_SLOTS.every((slot) => slotPassed(slot, day.iso));
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          disabled={closed}
                          onClick={() => set({ appointment_date: day.iso })}
                          aria-pressed={active}
                          className={`flex w-[72px] shrink-0 flex-col items-center rounded-2xl px-2 py-3 ring-1 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                            active ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "bg-[#fff7ed] ring-orange-100 enabled:hover:ring-[#ff4b12]/40"
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-[0.08em] ${active ? "text-white/80" : "text-[#7a879c]"}`}>{day.weekday}</span>
                          <span className="font-mono text-2xl font-black leading-tight">{day.day}</span>
                          <span className={`text-[10px] font-black uppercase ${active ? "text-white/80" : "text-[#7a879c]"}`}>{closed ? "Closed" : day.month}</span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs font-black text-[#7a879c]">
                    Later date?
                    <input
                      type="date"
                      min={today}
                      value={otherDate}
                      onChange={(event) => event.target.value && set({ appointment_date: event.target.value < today ? today : event.target.value })}
                      className={`rounded-full px-3 py-2 font-black outline-none ring-1 transition ${
                        otherDate ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "bg-[#fff7ed] text-[#071f50] ring-orange-100 focus:ring-[#ff4b12]"
                      }`}
                    />
                  </label>

                  <p className="mt-6 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">
                    Time {form.appointment_date ? `· ${formatDate(form.appointment_date, true)}` : ""}
                  </p>
                  {form.appointment_date ? (
                    <div className="mt-2 overflow-hidden rounded-2xl bg-[#071f50] p-1.5">
                      {TIME_SLOTS.map((slot) => {
                        const gone = slotPassed(slot, form.appointment_date);
                        const active = form.appointment_time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={gone}
                            onClick={() => set({ appointment_time: slot })}
                            aria-pressed={active}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 font-mono text-sm font-black transition disabled:cursor-not-allowed ${
                              active ? "bg-[#ff4b12] text-white" : gone ? "text-white/25" : "text-[#ffb36d] hover:bg-white/[0.06]"
                            }`}
                          >
                            <span>{slot}</span>
                            <span className="text-[10px] uppercase tracking-[0.16em]">{active ? "Selected" : gone ? "Closed" : "Open"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 rounded-2xl border-2 border-dashed border-orange-200 px-4 py-6 text-center text-sm font-bold text-[#7a879c]">
                      Pick a day above and the times appear here.
                    </p>
                  )}
                </StepCard>
              </div>

              <StepCard number={3} title="How do we reach you?" done={steps[2].done}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Full name">
                      <input required value={form.full_name} onChange={(event) => set({ full_name: event.target.value })} placeholder="Your full name" autoComplete="name" maxLength={60} className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Phone / WhatsApp">
                    <input required type="tel" value={form.phone} onChange={(event) => set({ phone: event.target.value })} placeholder="03xx xxxxxxx" autoComplete="tel" className={inputClass} />
                  </Field>
                  <Field label="Email">
                    <input required type="email" value={form.email} onChange={(event) => set({ email: event.target.value })} placeholder="you@example.com" autoComplete="email" className={inputClass} />
                  </Field>
                </div>

                <p className="mt-6 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Where are you right now? (optional)</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STAGES.map((item) => (
                    <Chip key={item.label} active={stage === item.label} onClick={() => setStage(stage === item.label ? "" : item.label)}>
                      {item.label}
                    </Chip>
                  ))}
                </div>

                <div className="mt-5">
                  <Field label="Anything else? (optional)">
                    <textarea
                      value={form.message}
                      onChange={(event) => set({ message: event.target.value })}
                      rows={3}
                      maxLength={1200}
                      placeholder="Your grades, budget, universities you like, or questions"
                      className={`${inputClass} resize-none text-base`}
                    />
                  </Field>
                </div>
              </StepCard>
            </div>

            {/* Pinned to the bottom edge so the confirm button stays on screen even on short laptops */}
            <div className="lg:sticky lg:bottom-4 lg:self-end">
              <LivePass form={form} city={city} university={university} steps={steps} sending={sending} onWhatsApp={openWhatsApp} />
              {error && (
                <p role="alert" className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                  {error}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default BookingDesk;
