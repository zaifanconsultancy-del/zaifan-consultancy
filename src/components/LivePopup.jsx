import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const notifications = [
  "Ahmed from Peshawar applied for Italy 🇮🇹",
  "New student inquiry received 🎓",
  "Visa guidance consultation booked ✈️",
  "Student shortlisted for Turkey 🇹🇷",
  "Scholarship assistance requested 📚",
  "New WhatsApp consultation started 💬",
];

function LivePopup() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const random =
        notifications[Math.floor(Math.random() * notifications.length)];

      setMessage(random);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 3500);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: 80,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 80,
          }}
          transition={{
            duration: 0.5,
          }}
          className="fixed bottom-28 left-6 z-[9999] max-w-[320px] rounded-2xl border border-[#D4AF37]/20 bg-[#111111]/90 px-5 py-4 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]"></div>

            <div>
              <p className="text-sm font-medium text-[#D4AF37]">
                Live Activity
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-300">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LivePopup;