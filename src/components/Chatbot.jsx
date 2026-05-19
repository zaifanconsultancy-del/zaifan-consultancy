import { useState } from "react"
import { FaRobot, FaPaperPlane } from "react-icons/fa"

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 I’m Zaifan Assistant. Ask me about admissions, visas, scholarships or countries.",
    },
  ])

  const getBotReply = (question) => {
    const q = question.toLowerCase()

    if (q.includes("italy")) {
      return "Italy is popular because of scholarships, affordable tuition and budget-friendly living."
    }

    if (q.includes("germany")) {
      return "Germany is known for quality education and low tuition opportunities."
    }

    if (q.includes("turkey")) {
      return "Turkey is a good budget-friendly option with growing international student opportunities."
    }

    if (q.includes("scholarship")) {
      return "Scholarship opportunities depend on your profile, academics and country selection."
    }

    if (q.includes("visa")) {
      return "We guide students with visa preparation, documentation and interview support."
    }

    if (q.includes("contact")) {
      return "You can contact Zaifan Consultancy on WhatsApp at +92 330 5718131."
    }

    return "Thank you for your question. Our team will guide you based on your profile and study goals."
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = {
      sender: "user",
      text: input,
    }

    const botMessage = {
      sender: "bot",
      text: getBotReply(input),
    }

    setMessages([...messages, userMessage, botMessage])
    setInput("")
  }

  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-50">
      {/* Chat Window */}
      {open && (
        <div className="w-80 md:w-96 bg-[#FFFCF6] rounded-[2rem] shadow-2xl border border-amber-900/10 overflow-hidden mb-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#111111] to-[#2A2118] text-white p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#D6CEC2] text-[#111111] p-3 rounded-full shadow-lg">
                <FaRobot />
              </div>

              <div>
                <h3 className="font-bold text-lg">
                  Zaifan Assistant
                </h3>

                <p className="text-xs text-amber-100/70">
                  Study abroad guidance
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-xl text-gray-300 hover:text-white transition"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="p-4 h-72 overflow-y-auto bg-[#F7F3EA] space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                  msg.sender === "user"
                    ? "bg-[#111111] text-white ml-auto"
                    : "bg-[#FFFCF6] text-stone-700 border border-amber-900/5"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-amber-900/10 flex gap-2 bg-[#FFFCF6]">
            <input
              type="text"
              placeholder="Ask your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-[#F7F3EA] border border-amber-900/10 rounded-full px-4 py-3 text-sm outline-none focus:border-amber-700"
            />

            <button
              onClick={handleSend}
              className="bg-[#D6CEC2] text-[#111111] px-5 rounded-full hover:scale-105 transition shadow-lg"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-[#D6CEC2] text-[#111111] w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition flex items-center justify-center border border-white/20"
        aria-label="Open assistant"
      >
        <FaRobot size={24} />
      </button>
    </div>
  )
}

export default Chatbot