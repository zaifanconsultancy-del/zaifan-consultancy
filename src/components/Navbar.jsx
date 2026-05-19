import { useState } from "react"
import { FaBars, FaTimes } from "react-icons/fa"
import logo from "../assets/logo.jpeg"

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
    <nav className="fixed top-0 left-0 w-full z-[9999] bg-[#0F0F10] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Zaifan Consultancy"
            className="h-12 w-12 rounded-full object-cover border border-[#D6CEC2]/40"
          />

          <div className="hidden sm:block leading-tight">
            <h1 className="text-white font-extrabold text-lg">Zaifan</h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#D6CEC2]">
              Consultancy
            </p>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-9 text-sm font-medium text-gray-400">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="hover:text-[#D6CEC2]">
              {link.name}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden md:inline-flex bg-[#D6CEC2] text-[#111111] px-6 py-3 rounded-full font-semibold"
        >
          Free Consultation
        </a>

        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0F0F10] border-t border-white/10 px-6 py-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-lg text-gray-300 hover:text-[#D6CEC2]"
              >
                {link.name}
              </a>
            ))}

            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block bg-[#D6CEC2] text-[#111111] text-center py-4 rounded-full font-semibold"
            >
              Free Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar