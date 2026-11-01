import { Link } from "react-router-dom";
import { MessageSquareText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import ServiceFaq from "../services/ServiceFaq";
import { whatsappLink } from "../contact/contactInfo";

const FAQS = [
  { q: "Is the consultation free?", a: "Yes. The first consultation is free. The goal is to understand your profile and guide you toward a realistic study direction." },
  { q: "How long does the consultation take?", a: "It varies, but the focus is to clarify your university direction, scholarship route, document needs and next steps." },
  { q: "What if I can't make my time?", a: "Message us on WhatsApp and we'll move it. You can also book a new time here." },
  { q: "Can parents join the call?", a: "Yes. Parents can join, especially when budget, scholarship, documents and long-term planning need to be discussed together." },
  { q: "Do I need documents before booking?", a: "No. You can book early. If you already have transcripts, a passport, income documents or target universities, mention them in the message box." },
  { q: "Is a scholarship guaranteed?", a: "No. Scholarships depend on eligibility, ranking, deadlines, documents and current rules. We help you plan, not fake guarantees." },
  { q: "Can you help me choose universities?", a: "Yes. The call can focus on matching your course, budget, city preference, scholarship chances and application readiness with universities in your target country." },
  { q: "What happens after the consultation?", a: "You should have a clearer direction for university shortlisting, scholarship planning, documents, deadlines and possible next steps with Zaifan." },
  { q: "Do you help with visa planning?", a: "Yes. We help you understand the visa roadmap, document preparation and file direction once your admission and study route are clearer." },
];

/** Questions about booking, next to the other way in: a message with no date. */
function AppointmentFaq() {
  return (
    <section className="bg-[#fff7ed] px-4 pb-24 pt-10 text-[#071f50] sm:px-5 md:pb-32 md:pt-14">
      <div className="mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[360px_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Questions</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-5xl">
            About your call, <span className="text-[#ff4b12]">answered.</span>
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">Not ready to pick a time? Ask us anything first.</p>
          <div className="mt-6 grid gap-2.5">
            <Link
              to="/contact#write"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff4b12]"
            >
              <MessageSquareText size={17} /> Send a question instead
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
            >
              <FaWhatsapp size={17} /> Ask on WhatsApp
            </a>
          </div>
        </div>
        <ServiceFaq faqs={FAQS} />
      </div>
    </section>
  );
}

export default AppointmentFaq;
