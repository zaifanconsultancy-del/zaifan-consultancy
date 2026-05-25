import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

function AdminActivityLogs({ cardClass = "" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to load activity logs.");
      return;
    }

    setLogs(data || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className={`${cardClass} p-5 sm:p-7`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Audit Trail
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Admin Activity Logs
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Track important CRM actions performed by admins.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-gray-400">
          Loading activity logs...
        </p>
      ) : logs.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-gray-400">
          No activity logs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
              className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-white">
                    {log.action || "Activity"}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    By{" "}
                    <span className="font-bold text-[#D4AF37]">
                      {log.admin_name || "Unknown Admin"}
                    </span>
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    {log.details || "No details provided."}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                    {log.target_type || "crm"}
                  </span>

                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminActivityLogs;