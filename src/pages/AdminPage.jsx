import { useEffect, useState } from "react";

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("zaifanAdminLoggedIn") === "true"
  );

  const [password, setPassword] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const savedInquiries =
      JSON.parse(localStorage.getItem("zaifanInquiries")) || [];

    setInquiries(savedInquiries);
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();

    if (password === "zaifan123") {
      localStorage.setItem("zaifanAdminLoggedIn", "true");
      setIsLoggedIn(true);
      setPassword("");
    } else {
      alert("Wrong password.");
    }
  };

  const logout = () => {
    localStorage.removeItem("zaifanAdminLoggedIn");
    setIsLoggedIn(false);
  };

  const saveInquiries = (updatedInquiries) => {
    localStorage.setItem("zaifanInquiries", JSON.stringify(updatedInquiries));
    setInquiries(updatedInquiries);
  };

  const clearInquiries = () => {
    localStorage.removeItem("zaifanInquiries");
    setInquiries([]);
  };

  const deleteInquiry = (id) => {
    const updatedInquiries = inquiries.filter((inquiry) => inquiry.id !== id);
    saveInquiries(updatedInquiries);
  };

  const toggleStatus = (id) => {
    const updatedInquiries = inquiries.map((inquiry) => {
      if (inquiry.id === id) {
        return {
          ...inquiry,
          status: inquiry.status === "Contacted" ? "New" : "Contacted",
        };
      }
      return inquiry;
    });

    saveInquiries(updatedInquiries);
  };

  const exportToCSV = () => {
    if (inquiries.length === 0) {
      alert("No inquiries to export.");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Country", "Message", "Status", "Date"];

    const rows = inquiries.map((inquiry) => [
      inquiry.name,
      inquiry.email,
      inquiry.phone,
      inquiry.country,
      inquiry.message,
      inquiry.status || "New",
      inquiry.date,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "zaifan-inquiries.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchText = search.toLowerCase();
    const status = inquiry.status || "New";

    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchText) ||
      inquiry.email.toLowerCase().includes(searchText) ||
      inquiry.phone.toLowerCase().includes(searchText) ||
      inquiry.country.toLowerCase().includes(searchText);

    const matchesStatus = statusFilter === "All" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const newCount = inquiries.filter(
    (inquiry) => (inquiry.status || "New") === "New"
  ).length;

  const contactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "Contacted"
  ).length;

  if (!isLoggedIn) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
            Admin Login
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            Enter Password
          </h1>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black transition hover:bg-[#E7C768]"
            >
              Login
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0b0b0b] px-6 pt-36 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
              Admin Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
              Student Inquiries
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-gray-400">
              <p>
                Total: <span className="text-[#D4AF37]">{inquiries.length}</span>
              </p>

              <p>
                New: <span className="text-[#D4AF37]">{newCount}</span>
              </p>

              <p>
                Contacted: <span className="text-green-400">{contactedCount}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:scale-105 hover:bg-[#E7C768]"
            >
              Export CSV
            </button>

            <button
              onClick={logout}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Logout
            </button>

            <button
              onClick={clearInquiries}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder="Search by name, email, phone or country..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
          />

          <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            {["All", "New", "Contacted"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === status
                    ? "bg-[#D4AF37] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-gray-400">
            No inquiries yet. Fill the contact form once to test it.
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-gray-400">
            No inquiries found.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#D4AF37]/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {inquiry.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          inquiry.status === "Contacted"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        }`}
                      >
                        {inquiry.status || "New"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {inquiry.date}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteInquiry(inquiry.id)}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-gray-400 transition hover:border-red-400 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-5 space-y-3 text-gray-300">
                  <p>
                    <span className="text-[#D4AF37]">Email:</span>{" "}
                    {inquiry.email}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Phone:</span>{" "}
                    {inquiry.phone}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Country:</span>{" "}
                    {inquiry.country}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Message:</span>{" "}
                    {inquiry.message}
                  </p>
                </div>

                <button
                  onClick={() => toggleStatus(inquiry.id)}
                  className="mt-6 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:scale-105 hover:bg-[#E7C768]"
                >
                  {inquiry.status === "Contacted"
                    ? "Mark as New"
                    : "Mark as Contacted"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPage;