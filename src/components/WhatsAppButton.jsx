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
      className="fixed bottom-6 right-4 md:right-6 z-50 bg-green-500 text-white px-5 py-4 rounded-full shadow-2xl hover:bg-green-600 transition font-semibold"
    >
      WhatsApp
    </a>
  )
}

export default WhatsAppButton