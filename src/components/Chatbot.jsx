import { useState } from "react"

function Chatbot() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-50">
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden mb-4">
          <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">Zaifan AI Assistant</h3>
              <p className="text-sm text-gray-200">Ask about study abroad</p>
            </div>

            <button onClick={() => setOpen(false)} className="text-xl">
              ×
            </button>
          </div>

          <div className="p-4 h-56 overflow-y-auto bg-gray-50">
            <div className="bg-white p-3 rounded-xl shadow text-sm text-gray-700">
              Hello 👋 I’m Zaifan AI Assistant. How can I help you today?
            </div>
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />

            <button className="bg-blue-900 text-white px-4 rounded-lg">
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-900 text-white px-5 py-4 rounded-full shadow-xl hover:bg-blue-800"
      >
        AI Chat
      </button>
    </div>
  )
}

export default Chatbot