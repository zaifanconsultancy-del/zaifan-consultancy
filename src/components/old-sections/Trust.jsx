import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import office from "../assets/images/trust/office.jpg";

const trustPoints = [
  {
    icon: Target,
    title: "Student-first guidance",
    text: "Recommendations should reflect the student's academic profile, budget, course interest and realistic options.",
  },
  {
    icon: Eye,
    title: "Transparent process",
    text: "Students should understand why a route is being recommended, what it costs and what risks or limitations exist.",
  },
  {
    icon: MessageCircle,
    title: "Clear communication",
    text: "Students need clear next steps, not vague advice. The goal is to reduce uncertainty at every stage.",
  },
  {
    icon: HeartHandshake,
    title: "Support with boundaries",
    text: "We guide, organize and explain — but we do not pretend to control universities, scholarship bodies or visa authorities.",
  },
];

const promises = [
  "No fake admission guarantees",
  "No guaranteed scholarship claims",
  "No guaranteed visa promises",
  "No random university pushing",
  "No fake success stories",
  "No pretending every country is fully built",
];

function Trust() {
  return (
    <section className="relative overflow-hidden bg-[#071f50] px-5 py-20 text-white sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-orange-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-orange-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px]">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative min-h-[620px] overflow-hidden rounded-[2.8rem] ring-1 ring-white/10"
          >
            <img
              src={office}
              alt="Zaifan Consultancy office"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/98 via-[#071f50]/55 to-[#071f50]/12" />

            <div className="absolute left-6 top-6 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                Trust is earned
              </p>
              <p className="mt-1 text-sm font-black text-white">Clarity before claims</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                Why this matters
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.05em]">
                Studying abroad is too important for fake certainty.
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/72">
                Universities make admission decisions. Scholarship bodies decide funding.
                Embassies and visa authorities decide visa outcomes. Our role is to help students
                prepare better, understand more and make stronger decisions.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="rounded-[2.8rem] bg-white p-7 text-[#071b3a] shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
              <ShieldCheck className="h-4 w-4" />
              The trust framework
            </div>

            <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl">
              Guidance families can understand and students can act on.
            </h2>

            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              Trust should come from transparency, useful information and consistent support —
              not inflated numbers or promises nobody can guarantee.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {trustPoints.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  viewport={{ once: true }}
                  className="rounded-[1.8rem] bg-[#fff8f1] p-5 ring-1 ring-orange-100"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.5rem] bg-white/10 p-7 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-13 w-13 place-items-center rounded-2xl bg-orange-500 p-3 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                  Our commitment
                </p>
                <h3 className="mt-1 text-2xl font-black">What students should expect from Zaifan</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Clear explanation of the route",
                "Profile-based guidance",
                "Honest affordability planning",
                "Document and deadline structure",
                "Connected university + scholarship thinking",
                "Clear next steps after each stage",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/8 p-4 text-sm font-bold leading-6 text-white/78 ring-1 ring-white/10"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-orange-600 p-7 text-white shadow-[0_24px_70px_rgba(255,91,18,0.22)]">
            <div className="flex items-center gap-3">
              <CircleAlert className="h-7 w-7 text-orange-100" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-100">
                  Our boundaries
                </p>
                <h3 className="mt-1 text-2xl font-black">What we will never sell as certainty</h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {promises.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm font-bold leading-6 text-white/88 ring-1 ring-white/10"
                >
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-100" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2.7rem] bg-white p-7 text-[#071b3a] shadow-[0_30px_90px_rgba(0,0,0,0.14)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                <Sparkles className="h-4 w-4 fill-orange-500" />
                Start with a conversation
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                Not sure what you actually need help with?
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                Start with a free consultation. We can help you understand where you are in the
                Italy journey and what the next useful step should be.
              </p>
            </div>

            <a
              href="/appointment?country=Italy&service=Free Italy Study Plan"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(234,88,12,0.25)] transition hover:-translate-y-1 hover:bg-orange-700"
            >
              Book Free Consultation
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Trust;
