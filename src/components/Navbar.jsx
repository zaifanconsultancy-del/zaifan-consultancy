import { useState } from "react"
import { FaBars, FaTimes } from "react-icons/fa"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Zaifan
          <span className="text-yellow-400"> Consultancy</span>
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-white">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#countries">Countries</a>
          <a href="#contact">Contact</a>
        </div>

        <button className="hidden md:block bg-yellow-500 text-black px-5 py-2 rounded-lg font-semibold">
          Apply Now
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-black text-white px-6 py-4 space-y-4">
          <a href="#home" className="block">Home</a>
          <a href="#services" className="block">Services</a>
          <a href="#countries" className="block">Countries</a>
          <a href="#contact" className="block">Contact</a>
        </div>
      )}
    </nav>
  )
}

export default Navbar