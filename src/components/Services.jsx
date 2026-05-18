import {
  FaUniversity,
  FaPassport,
  FaFileAlt,
  FaGlobe,
  FaGraduationCap,
  FaUserTie
} from "react-icons/fa"

function Services() {
  const services = [
    {
      title: "University Admissions",
      description: "Complete admission support for top international universities.",
      icon: <FaUniversity size={28} />
    },
    {
      title: "Visa Assistance",
      description: "Professional visa filing and interview preparation support.",
      icon: <FaPassport size={28} />
    },
    {
      title: "Documentation",
      description: "SOPs, financial docs, application paperwork and more.",
      icon: <FaFileAlt size={28} />
    },
    {
      title: "Country Selection",
      description: "Helping students choose the right country and pathway.",
      icon: <FaGlobe size={28} />
    },
    {
      title: "Scholarships",
      description: "Find scholarships and affordable study opportunities.",
      icon: <FaGraduationCap size={28} />
    },
    {
      title: "Career Guidance",
      description: "Long-term planning for education and career growth.",
      icon: <FaUserTie size={28} />
    },
  ]

  return (
    <section
      id="services"
      className="py-24 bg-gradient-to-b from-white to-gray-100 px-6"
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Our Premium Services
          </h2>

          <p className="text-gray-600 mt-4 text-lg">
            We simplify your entire study abroad journey from admission to visa approval.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center mb-6">
                {service.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Services