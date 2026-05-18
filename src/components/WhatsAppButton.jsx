import { FaWhatsapp } from "react-icons/fa"

function WhatsAppButton() {
  const phoneNumber = "923305718131"
  const message =
    "Hello Zaifan Consultancy, I want guidance for studying abroad."

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-4 md:right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition animate-bounce"
    >
      <FaWhatsapp size={32} />
    </a>
  )
}

export default WhatsAppButton