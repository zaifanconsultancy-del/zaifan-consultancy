function Logo() {
  return (
    <a href="#home" className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D6CEC2] to-[#A9916B] text-[#111111] flex items-center justify-center font-extrabold shadow-lg">
        Z
      </div>

      <div className="leading-tight">
        <h1 className="text-lg md:text-xl font-extrabold text-white">
          Zaifan
        </h1>
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400">
          Consultancy
        </p>
      </div>
    </a>
  )
}

export default Logo