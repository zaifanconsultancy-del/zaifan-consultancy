import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "../components/admin/AdminLogin";
import AdminHeader from "../components/admin/AdminHeader";
import AdminStats from "../components/admin/AdminStats";
import AdminFilters from "../components/admin/AdminFilters";
import InquiryCard from "../components/admin/InquiryCard";
import AppointmentCard from "../components/admin/AppointmentCard";
import SearchToolbar from "../components/admin/SearchToolbar";
import DashboardContent from "../components/admin/DashboardContent";
import DashboardOverview from "../components/admin/DashboardOverview";

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("inquiries");
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const appointmentStatuses = [
  "All",
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];
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

    setAppointments(appointments.filter((appointment) => appointment.id !== id));
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
    const selectedAppointment = appointments.find(
      (appointment) => appointment.id === id
    );

    const oldStatus = selectedAppointment?.status || "pending";

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

    if (newStatus === "confirmed" && oldStatus !== "confirmed") {
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-appointment-status-email", {
          body: {
            fullName: selectedAppointment?.full_name,
            email: selectedAppointment?.email,
            phone: selectedAppointment?.phone,
            country: selectedAppointment?.country_interest,
            service: selectedAppointment?.consultation_type,
            appointmentDate: selectedAppointment?.appointment_date,
            appointmentTime: selectedAppointment?.appointment_time,
            status: newStatus,
          },
        });

      console.log("STATUS EMAIL DATA:", emailData);
      console.log("STATUS EMAIL ERROR:", emailError);

      if (emailError) {
        alert("Status updated, but confirmation email failed.");
        return;
      }

      alert("Appointment confirmed and confirmation email sent.");
    }
  };

  const clearInquiries = async () => {
    const confirmDelete = confirm("Are you sure you want to delete all inquiries?");
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
    <AdminLogin
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      handleLogin={handleLogin}
      inputClass={inputClass}
    />
  );
}

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-6 pt-36 pb-20 text-white">
      <div className="absolute right-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-25%] left-[-12%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <AdminHeader
  inquiries={inquiries}
  appointments={appointments}
  appointmentPendingCount={appointmentPendingCount}
  fetchAllData={fetchAllData}
  activeTab={activeTab}
  exportInquiriesToCSV={exportInquiriesToCSV}
  exportAppointmentsToCSV={exportAppointmentsToCSV}
  logout={logout}
  clearInquiries={clearInquiries}
  clearAppointments={clearAppointments}
/>

       <AdminStats
  cardClass={cardClass}
  inquiries={inquiries}
  inquiryNewCount={inquiryNewCount}
  inquiryContactedCount={inquiryContactedCount}
  appointments={appointments}
  appointmentPendingCount={appointmentPendingCount}
  appointmentConfirmedCount={appointmentConfirmedCount}
  appointmentCompletedCount={appointmentCompletedCount}
  appointmentCancelledCount={appointmentCancelledCount}
/>

       <DashboardOverview
  cardClass={cardClass}
  todayInquiriesCount={todayInquiriesCount}
  todayAppointmentsCount={todayAppointmentsCount}
  latestInquiry={latestInquiry}
  latestAppointment={latestAppointment}
/>

       <AdminFilters
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  search={search}
  setSearch={setSearch}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  appointmentStatuses={appointmentStatuses}
/>

      <SearchToolbar
  activeTab={activeTab}
  search={search}
  setSearch={setSearch}
  statusOptions={statusOptions}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
/>
      <AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <DashboardContent
      loading={loading}
      activeTab={activeTab}
      inquiries={inquiries}
      filteredInquiries={filteredInquiries}
      appointments={appointments}
      filteredAppointments={filteredAppointments}
      cardClass={cardClass}
      toggleInquiryStatus={toggleInquiryStatus}
      deleteInquiry={deleteInquiry}
      updateAppointmentStatus={updateAppointmentStatus}
      deleteAppointment={deleteAppointment}
    />
  </motion.div>
</AnimatePresence>
      </div>
    </section>
  );
}

export default AdminPage;