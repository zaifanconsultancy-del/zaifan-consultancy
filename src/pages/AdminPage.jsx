import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const cardClass =
    "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]";

  const fetchInquiries = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Failed to load inquiries.");
    } else {
      setInquiries(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setIsLoggedIn(true);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchInquiries();
  }, [isLoggedIn]);

  const handleLogin = async (event) => {
    event.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setEmail("");
    setPassword("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setInquiries([]);
  };

  const deleteInquiry = async (id) => {
    const confirmDelete = confirm("Delete this inquiry?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("inquiries").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete inquiry.");
      return;
    }

    setInquiries(inquiries.filter((inquiry) => inquiry.id !== id));
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "contacted" ? "new" : "contacted";

    const { error } = await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update status.");
      return;
    }

    setInquiries(
      inquiries.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
      )
    );
  };

  const clearInquiries = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete all inquiries?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("inquiries").delete().neq("id", 0);

    if (error) {
      console.error(error);
      alert("Failed to clear inquiries.");
      return;
    }

    setInquiries([]);
  };

  const exportToCSV = () => {
    if (inquiries.length === 0) {
      alert("No inquiries to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Field Of Interest",
      "Study Level",
      "Country",
      "Counseling Mode",
      "Preferred Date",
      "Time Slot",
      "City",
      "Message",
      "Status",
      "Date",
    ];

    const rows = inquiries.map((inquiry) => [
      inquiry.full_name,
      inquiry.email,
      inquiry.phone,
      inquiry.field_of_interest,
      inquiry.study_level,
      inquiry.country,
      inquiry.counseling_mode,
      inquiry.preferred_date,
      inquiry.time_slot,
      inquiry.city,
      inquiry.message,
      inquiry.status || "new",
      inquiry.created_at,
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
    const status = inquiry.status || "new";

    const matchesSearch =
      inquiry.full_name?.toLowerCase().includes(searchText) ||
      inquiry.email?.toLowerCase().includes(searchText) ||
      inquiry.phone?.toLowerCase().includes(searchText) ||
      inquiry.country?.toLowerCase().includes(searchText) ||
      inquiry.city?.toLowerCase().includes(searchText) ||
      inquiry.field_of_interest?.toLowerCase().includes(searchText) ||
      inquiry.study_level?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const newCount = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const contactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  if (!isLoggedIn) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
            Admin Login
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">Enter Admin Details</h1>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
            />

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
    <section className="min-h-screen bg-[#050505] px-6 pt-36 pb-20 text-white">
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
                Total:{" "}
                <span className="text-[#D4AF37]">{inquiries.length}</span>
              </p>

              <p>
                New: <span className="text-[#D4AF37]">{newCount}</span>
              </p>

              <p>
                Contacted:{" "}
                <span className="text-green-400">{contactedCount}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInquiries}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Refresh
            </button>

            <button
              onClick={exportToCSV}
              className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E7C768]"
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
            placeholder="Search by name, email, phone, country, city, field..."
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

        {loading ? (
          <div className={cardClass}>Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className={cardClass}>
            No inquiries yet. Fill the contact form once to test it.
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className={cardClass}>No inquiries found.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className={cardClass}>
                <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {inquiry.full_name || "Unnamed Student"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          inquiry.status === "contacted"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        }`}
                      >
                        {inquiry.status === "contacted" ? "Contacted" : "New"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {inquiry.created_at
                        ? new Date(inquiry.created_at).toLocaleString()
                        : "No date"}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteInquiry(inquiry.id)}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-gray-400 transition hover:border-red-400 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-gray-300 md:grid-cols-2">
                  <p>
                    <span className="text-[#D4AF37]">Email:</span>{" "}
                    {inquiry.email || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Phone:</span>{" "}
                    {inquiry.phone || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Country:</span>{" "}
                    {inquiry.country || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">City:</span>{" "}
                    {inquiry.city || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Field:</span>{" "}
                    {inquiry.field_of_interest || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Study Level:</span>{" "}
                    {inquiry.study_level || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Mode:</span>{" "}
                    {inquiry.counseling_mode || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Preferred Date:</span>{" "}
                    {inquiry.preferred_date || "-"}
                  </p>

                  <p>
                    <span className="text-[#D4AF37]">Time Slot:</span>{" "}
                    {inquiry.time_slot || "-"}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-[#D4AF37]">Message</p>

                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-300">
                    {inquiry.message || "-"}
                  </p>
                </div>

                <button
                  onClick={() => toggleStatus(inquiry.id, inquiry.status)}
                  className="mt-6 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E7C768]"
                >
                  {inquiry.status === "contacted"
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