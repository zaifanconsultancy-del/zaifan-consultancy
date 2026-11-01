import { motion } from "framer-motion";
import { ClipboardCheck, MessagesSquare, Route, Send } from "lucide-react";

const STEPS = [
  { icon: Send, time: "Now", title: "You book", text: "Your profile, service and preferred time reach our team." },
  { icon: ClipboardCheck, time: "Before the call", title: "We read your profile", text: "We look at your education, budget, subject, city interest and scholarship needs." },
  { icon: MessagesSquare, time: "On the call", title: "We talk it through", text: "An advisor goes through realistic options, risks and next actions with you." },
  { icon: Route, time: "After the call", title: "You get a roadmap", text: "A clear direction for universities, scholarships, documents and visa preparation." },
];

const BRING = ["Your latest marksheets or degree", "Rough budget per year", "Subject you want to study", "Universities you already like (if any)"];

/** What happens after booking, as a flight timeline, plus what to have ready. */
function AfterBooking() {
  return (
    <section className="bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] ring-1 ring-white/10">
          Flight plan · <span className="text-[#ffb36d]">After you book</span>
        </span>
        <h2 className="mt-5 max-w-4xl text-[2.4rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl md:text-6xl">
          What happens next.
          <span className="block text-[#ff7b1c]">No surprises.</span>
        </h2>

        <ol className="relative mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <span aria-hidden="true" className="absolute left-0 right-0 top-[26px] hidden h-0.5 bg-[repeating-linear-gradient(90deg,#ffb36d_0_8px,transparent_8px_16px)] opacity-40 xl:block" />
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.45 }}
              className="relative"
            >
              <span className="relative grid h-[54px] w-[54px] place-items-center rounded-full bg-[#ff4b12] text-white ring-8 ring-[#071f50]">
                <step.icon size={22} />
              </span>
              <p className="mt-5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb36d]">{step.time}</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">{step.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">{step.text}</p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-14 grid gap-5 rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10 md:grid-cols-[0.8fr_1.2fr] md:items-center md:p-8">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Hand luggage</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">Handy to have on the call</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/65">None of this is required to book. It just helps us give sharper advice.</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {BRING.map((item) => (
              <li key={item} className="rounded-2xl bg-white/[0.07] px-4 py-3 text-sm font-bold">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AfterBooking;
