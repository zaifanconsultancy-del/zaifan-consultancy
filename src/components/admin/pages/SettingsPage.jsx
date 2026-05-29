import { motion } from "framer-motion";

function SettingsPage({
  cardClass,
  currentPermissions,
}) {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}
    >
      <div className="rounded-[1.7rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-6 text-5xl">
        ⚙️
      </div>

      <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
        Settings Panel
      </p>

      <h2 className="mt-3 text-4xl font-black text-white">Coming Soon</h2>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
        Advanced CRM customization, admin preferences, notification controls,
        integrations, analytics configuration, branding settings, and automation
        tools will be added here.
      </p>

      {currentPermissions.canManageAdmins && (
        <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-4 text-sm text-[#D4AF37]">
          Super Admin access detected. Use Admin Management for role controls.
        </div>
      )}
    </motion.div>
  );
}

export default SettingsPage;