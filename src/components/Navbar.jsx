import { useState } from "react"
import { FaBars, FaTimes } from "react-icons/fa"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
    { name: "Countries", href: "#countries" },
    { name: "Contact", href: "#contact" },
  ]

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#home" className="text-xl md:text-2xl font-extrabold tracking-wide text-white">
          Zaifan
          <span className="text-yellow-400"> Consultancy</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-yellow-400 transition"
            >
              {link.name}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden md:inline-block bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg shadow-yellow-500/20"
        >
          Apply Now
        </a>

        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mx-4 mb-4 rounded-2xl bg-slate-900 border border-white/10 text-white px-6 py-5 space-y-4 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block hover:text-yellow-400 transition"
            >
              {link.name}
            </a>
          ))}

          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="block bg-yellow-400 text-black text-center px-5 py-3 rounded-xl font-bold hover:bg-yellow-300 transition"
          >
            Apply Now
          </a>
        </div>
      )}
    </nav>
  )
}

export default Navbar