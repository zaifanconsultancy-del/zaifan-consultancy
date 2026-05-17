function Footer() {
  return (
    <footer className="bg-black text-white py-10 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">
            Zaifan Consultancy
          </h2>
          <p className="mt-4 text-gray-400">
            Your gateway to global education success.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold">Quick Links</h3>

          <ul className="mt-4 space-y-2 text-gray-400">
            <li>
              <a href="#home" className="hover:text-yellow-400">Home</a>
            </li>
            <li>
              <a href="#services" className="hover:text-yellow-400">Services</a>
            </li>
            <li>
              <a href="#countries" className="hover:text-yellow-400">Countries</a>
            </li>
            <li>
              <a href="#contact" className="hover:text-yellow-400">Contact</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold">Contact</h3>

          <ul className="mt-4 space-y-2 text-gray-400">
            <li>+92 330 5718131</li>
            <li>+92 333 9396336</li>
            <li>zaifanconsultancy@gmail.com</li>
            <li>Peshawar, KPK, Pakistan</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500">
        © 2026 Zaifan Consultancy. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer