import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("inquiries");
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const cardClass =
    "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]";

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]";

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Failed to load inquiries.");
      return;
    }

    setInquiries(data || []);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Failed to load appointments.");
      return;
    }

    setAppointments(data || []);
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchInquiries(), fetchAppointments()]);
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
    if (isLoggedIn) fetchAllData();
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
    setAppointments([]);
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

  const deleteAppointment = async (id) => {
    const confirmDelete = confirm("Delete this appointment?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete appointment.");
      return;
    }

    setAppointments(
      appointments.filter((appointment) => appointment.id !== id)
    );
  };

  const toggleInquiryStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "contacted" ? "new" : "contacted";

    const { error } = await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update inquiry status.");
      return;
    }

    setInquiries(
      inquiries.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
      )
    );
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update appointment status.");
      return;
    }

    setAppointments(
      appointments.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: newStatus }
          : appointment
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

  const clearAppointments = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete all appointments?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("appointments").delete().neq("id", 0);

    if (error) {
      console.error(error);
      alert("Failed to clear appointments.");
      return;
    }

    setAppointments([]);
  };

  const downloadCSV = (filename, headers, rows) => {
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
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportInquiriesToCSV = () => {
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

    downloadCSV("zaifan-inquiries.csv", headers, rows);
  };

  const exportAppointmentsToCSV = () => {
    if (appointments.length === 0) {
      alert("No appointments to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Country Interest",
      "Consultation Type",
      "Appointment Date",
      "Appointment Time",
      "Message",
      "Status",
      "Created At",
    ];

    const rows = appointments.map((appointment) => [
      appointment.full_name,
      appointment.email,
      appointment.phone,
      appointment.country_interest,
      appointment.consultation_type,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.message,
      appointment.status || "pending",
      appointment.created_at,
    ]);

    downloadCSV("zaifan-appointments.csv", headers, rows);
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

  const filteredAppointments = appointments.filter((appointment) => {
    const searchText = search.toLowerCase();
    const status = appointment.status || "pending";

    const matchesSearch =
      appointment.full_name?.toLowerCase().includes(searchText) ||
      appointment.email?.toLowerCase().includes(searchText) ||
      appointment.phone?.toLowerCase().includes(searchText) ||
      appointment.country_interest?.toLowerCase().includes(searchText) ||
      appointment.consultation_type?.toLowerCase().includes(searchText) ||
      appointment.appointment_date?.toLowerCase().includes(searchText) ||
      appointment.appointment_time?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const inquiryNewCount = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const inquiryContactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  const appointmentPendingCount = appointments.filter(
    (appointment) => (appointment.status || "pending") === "pending"
  ).length;

  const appointmentConfirmedCount = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const appointmentCompletedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const appointmentCancelledCount = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const formatWhatsAppNumber = (phoneNumber) => {
    let cleanedNumber = String(phoneNumber || "").replace(/\D/g, "");

    if (cleanedNumber.startsWith("0")) {
      cleanedNumber = `92${cleanedNumber.slice(1)}`;
    }

    if (!cleanedNumber.startsWith("92") && cleanedNumber.length === 10) {
      cleanedNumber = `92${cleanedNumber}`;
    }

    return cleanedNumber;
  };

  const latestInquiry = inquiries[0];
  const latestAppointment = appointments[0];

  const todayDate = new Date().toDateString();

  const todayInquiriesCount = inquiries.filter((inquiry) =>
    inquiry.created_at
      ? new Date(inquiry.created_at).toDateString() === todayDate
      : false
  ).length;

  const todayAppointmentsCount = appointments.filter((appointment) =>
    appointment.created_at
      ? new Date(appointment.created_at).toDateString() === todayDate
      : false
  ).length;

  const statusOptions =
    activeTab === "inquiries"
      ? ["All", "New", "Contacted"]
      : ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

  if (!isLoggedIn) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="absolute h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

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
              className={inputClass}
            />

            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
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
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-6 pt-36 pb-20 text-white">
      <div className="absolute right-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-25%] left-[-12%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
              Admin Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
              Zaifan CRM
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-gray-400">
              <p>
                Inquiries: <span className="text-[#D4AF37]">{inquiries.length}</span>
              </p>

              <p>
                Appointments:{" "}
                <span className="text-[#D4AF37]">{appointments.length}</span>
              </p>

              <p>
                Pending Bookings:{" "}
                <span className="text-[#D4AF37]">{appointmentPendingCount}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAllData}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Refresh
            </button>

            <button
              onClick={activeTab === "inquiries" ? exportInquiriesToCSV : exportAppointmentsToCSV}
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
              onClick={activeTab === "inquiries" ? clearInquiries : clearAppointments}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400"
            >
              Clear {activeTab === "inquiries" ? "Inquiries" : "Appointments"}
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Total Inquiries</p>
            <h2 className="mt-3 text-4xl font-extrabold text-[#D4AF37]">{inquiries.length}</h2>
            <p className="mt-2 text-sm text-gray-400">New: {inquiryNewCount} / Contacted: {inquiryContactedCount}</p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Appointments</p>
            <h2 className="mt-3 text-4xl font-extrabold text-[#D4AF37]">{appointments.length}</h2>
            <p className="mt-2 text-sm text-gray-400">Pending: {appointmentPendingCount}</p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Confirmed</p>
            <h2 className="mt-3 text-4xl font-extrabold text-green-400">{appointmentConfirmedCount}</h2>
            <p className="mt-2 text-sm text-gray-400">Ready for consultation</p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Completed</p>
            <h2 className="mt-3 text-4xl font-extrabold text-white">{appointmentCompletedCount}</h2>
            <p className="mt-2 text-sm text-gray-400">Cancelled: {appointmentCancelledCount}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-3">
          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

            <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
              Today Activity
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#D4AF37]">
              {todayInquiriesCount + todayAppointmentsCount}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {todayInquiriesCount} inquiries · {todayAppointmentsCount} bookings
            </p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

            <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
              Latest Inquiry
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-white">
              {latestInquiry?.full_name || "No inquiry yet"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {latestInquiry?.country || "Waiting for first contact form"}
            </p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

            <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
              Latest Appointment
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-white">
              {latestAppointment?.full_name || "No booking yet"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {latestAppointment
                ? `${latestAppointment.appointment_date || "No date"} · ${
                    latestAppointment.appointment_time || "No time"
                  }`
                : "Waiting for first appointment"}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
          <button
            onClick={() => {
              setActiveTab("inquiries");
              setStatusFilter("All");
              setSearch("");
            }}
            className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
              activeTab === "inquiries"
                ? "bg-[#D4AF37] text-black"
                : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            Inquiries
          </button>

          <button
            onClick={() => {
              setActiveTab("appointments");
              setStatusFilter("All");
              setSearch("");
            }}
            className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
              activeTab === "appointments"
                ? "bg-[#D4AF37] text-black"
                : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            Appointments
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder={
              activeTab === "inquiries"
                ? "Search by name, email, phone, country, city, field..."
                : "Search by name, email, phone, country, type, date, time..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={inputClass}
          />

          <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            {statusOptions.map((status) => (
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
          <div className={cardClass}>Loading dashboard data...</div>
        ) : activeTab === "inquiries" ? (
          inquiries.length === 0 ? (
            <div className={cardClass}>No inquiries yet. Fill the contact form once to test it.</div>
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
                    <p><span className="text-[#D4AF37]">Email:</span> {inquiry.email || "-"}</p>
                    <p><span className="text-[#D4AF37]">Phone:</span> {inquiry.phone || "-"}</p>
                    <p><span className="text-[#D4AF37]">Country:</span> {inquiry.country || "-"}</p>
                    <p><span className="text-[#D4AF37]">City:</span> {inquiry.city || "-"}</p>
                    <p><span className="text-[#D4AF37]">Field:</span> {inquiry.field_of_interest || "-"}</p>
                    <p><span className="text-[#D4AF37]">Study Level:</span> {inquiry.study_level || "-"}</p>
                    <p><span className="text-[#D4AF37]">Mode:</span> {inquiry.counseling_mode || "-"}</p>
                    <p><span className="text-[#D4AF37]">Preferred Date:</span> {inquiry.preferred_date || "-"}</p>
                    <p><span className="text-[#D4AF37]">Time Slot:</span> {inquiry.time_slot || "-"}</p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-[#D4AF37]">Message</p>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-300">
                      {inquiry.message || "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleInquiryStatus(inquiry.id, inquiry.status)}
                    className="mt-6 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E7C768]"
                  >
                    {inquiry.status === "contacted" ? "Mark as New" : "Mark as Contacted"}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : appointments.length === 0 ? (
          <div className={cardClass}>No appointments yet. Submit one booking request to test it.</div>
        ) : filteredAppointments.length === 0 ? (
          <div className={cardClass}>No appointments found.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredAppointments.map((appointment) => {
              const status = appointment.status || "pending";

              return (
                <div key={appointment.id} className={cardClass}>
                  <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">
                          {appointment.full_name || "Unnamed Student"}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            status === "confirmed"
                              ? "bg-green-400/10 text-green-400"
                              : status === "completed"
                              ? "bg-blue-400/10 text-blue-400"
                              : status === "cancelled"
                              ? "bg-red-400/10 text-red-400"
                              : "bg-[#D4AF37]/10 text-[#D4AF37]"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        Requested: {appointment.created_at ? new Date(appointment.created_at).toLocaleString() : "No date"}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-gray-400 transition hover:border-red-400 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
                    <p className="text-sm uppercase tracking-[0.22em] text-[#D4AF37]">Booking Slot</p>
                    <h3 className="mt-3 text-2xl font-extrabold text-white">
                      {appointment.appointment_date || "No date"} · {appointment.appointment_time || "No time"}
                    </h3>
                  </div>

                  <div className="mt-6 grid gap-3 text-sm text-gray-300 md:grid-cols-2">
                    <p><span className="text-[#D4AF37]">Email:</span> {appointment.email || "-"}</p>
                    <p><span className="text-[#D4AF37]">Phone:</span> {appointment.phone || "-"}</p>
                    <p><span className="text-[#D4AF37]">Country:</span> {appointment.country_interest || "-"}</p>
                    <p><span className="text-[#D4AF37]">Type:</span> {appointment.consultation_type || "-"}</p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-[#D4AF37]">Message</p>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-300">
                      {appointment.message || "-"}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <select
                      value={status}
                      onChange={(event) =>
                        updateAppointmentStatus(appointment.id, event.target.value)
                      }
                      className="rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#D4AF37]"
                    >
                      <option value="pending" className="text-black">Pending</option>
                      <option value="confirmed" className="text-black">Confirmed</option>
                      <option value="completed" className="text-black">Completed</option>
                      <option value="cancelled" className="text-black">Cancelled</option>
                    </select>

                    <a
  href={`https://wa.me/${formatWhatsAppNumber(
    appointment.phone
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  className="rounded-full bg-[#D4AF37] px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#E7C768]"
>
  WhatsApp Student
</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPage;
