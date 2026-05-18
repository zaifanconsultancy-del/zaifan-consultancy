import { useState } from "react"
import { FaRobot, FaPaperPlane } from "react-icons/fa"

function Chatbot() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-50">
      {open && (
        <div className="w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-blue-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-black p-2 rounded-full">
                <FaRobot />
              </div>

              <div>
                <h3 className="font-bold">Zaifan AI Assistant</h3>
                <p className="text-xs text-gray-300">
                  Ask about studying abroad
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-xl hover:text-yellow-400"
            >
              ×
            </button>
          </div>

          {/* Chat Area */}
          <div className="p-4 h-64 overflow-y-auto bg-gray-50 space-y-3">
            <div className="bg-white p-3 rounded-2xl shadow text-sm text-gray-700 max-w-[80%]">
              Hello 👋 I’m Zaifan AI Assistant.
              <br />
              Ask me about admissions, scholarships, visas or countries.
            </div>

            <div className="bg-blue-900 text-white p-3 rounded-2xl ml-auto max-w-[80%] text-sm">
              Which country offers affordable education?
            </div>

            <div className="bg-white p-3 rounded-2xl shadow text-sm text-gray-700 max-w-[80%]">
              Countries like Italy, Germany and Turkey are popular affordable options.
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2 bg-white">
            <input
              type="text"
              placeholder="Ask your question..."
              className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <button className="bg-yellow-400 text-black px-4 rounded-xl hover:bg-yellow-300 transition">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-gradient-to-r from-slate-950 to-blue-900 text-white w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition flex items-center justify-center"
      >
        <FaRobot size={24} />
      </button>
    </div>
  )
}

export default Chatbot