function Footer() {
  return (
    <footer className="bg-slate-950 text-white px-6 pt-16 pb-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h2 className="text-3xl font-extrabold">
            Zaifan
            <span className="text-yellow-400"> Consultancy</span>
          </h2>

          <p className="mt-5 text-gray-400 max-w-md leading-relaxed">
            Your trusted partner for admissions, scholarships, visa guidance,
            documentation and complete study abroad planning.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-5">Quick Links</h3>

          <ul className="space-y-3 text-gray-400">
            <li><a href="#home" className="hover:text-yellow-400 transition">Home</a></li>
            <li><a href="#services" className="hover:text-yellow-400 transition">Services</a></li>
            <li><a href="#about" className="hover:text-yellow-400 transition">About</a></li>
            <li><a href="#countries" className="hover:text-yellow-400 transition">Countries</a></li>
            <li><a href="#contact" className="hover:text-yellow-400 transition">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-5">Contact</h3>

          <ul className="space-y-3 text-gray-400">
            <li>+92 330 5718131</li>
            <li>+92 333 9396336</li>
            <li>zaifanconsultancy@gmail.com</li>
            <li>Peshawar, KPK, Pakistan</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
        <p>© 2026 Zaifan Consultancy. All rights reserved.</p>
        <p>Built for global education guidance.</p>
      </div>
    </footer>
  )
}

export default Footer