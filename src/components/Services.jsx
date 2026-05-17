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
    { title: "University Admissions", icon: <FaUniversity size={30} /> },
    { title: "Visa Support", icon: <FaPassport size={30} /> },
    { title: "Document Preparation", icon: <FaFileAlt size={30} /> },
    { title: "Country Selection", icon: <FaGlobe size={30} /> },
    { title: "Scholarships", icon: <FaGraduationCap size={30} /> },
    { title: "Career Counseling", icon: <FaUserTie size={30} /> },
  ]

  return (
    <section id="services" className="py-20 bg-white px-6">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-4xl font-bold text-center">
          Our Services
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl shadow-lg border hover:shadow-2xl transition text-center"
            >
              <div className="text-blue-900 flex justify-center mb-4">
                {service.icon}
              </div>

              <h3 className="text-xl font-bold">
                {service.title}
              </h3>

              <p className="text-gray-600 mt-3">
                Professional guidance for your future abroad.
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Services