import MyLeadsPanel from "../workspaces/leads-crm/MyLeadsPanel";

function MyLeadsPage({
  cardClass,
  adminProfile,
}) {
  return (
    <MyLeadsPanel
      cardClass={cardClass}
      adminProfile={adminProfile}
    />
  );
}

export default MyLeadsPage;