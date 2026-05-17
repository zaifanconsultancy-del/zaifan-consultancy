function About() {
  return (
    <section id="about" className="py-20 bg-gray-50 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        <div>
          <h2 className="text-4xl font-bold text-gray-900">
            About Zaifan Consultancy
          </h2>

          <p className="mt-5 text-gray-600 leading-relaxed">
            Zaifan Consultancy is built to guide students who want to study
            abroad with confidence. We help students understand their profile,
            choose the right country, prepare documents, apply for admissions,
            and move toward visa success.
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Our goal is simple: honest guidance, clear process, and professional
            support from start to finish.
          </p>
        </div>

        <div className="bg-blue-900 text-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold mb-6">
            Why Choose Us?
          </h3>

          <ul className="space-y-4">
            <li>✅ Clear step-by-step guidance</li>
            <li>✅ Country selection based on profile</li>
            <li>✅ SOP and document support</li>
            <li>✅ Honest consultation for students</li>
          </ul>
        </div>

      </div>
    </section>
  )
}

export default About