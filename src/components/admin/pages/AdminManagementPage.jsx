import AdminManagement from "../AdminManagement";

function AdminManagementPage({
  cardClass,
  role,
  adminProfile,
  permissions,
}) {
  return (
    <AdminManagement
      cardClass={cardClass}
      role={role}
      adminProfile={adminProfile}
      permissions={permissions}
    />
  );
}

export default AdminManagementPage;