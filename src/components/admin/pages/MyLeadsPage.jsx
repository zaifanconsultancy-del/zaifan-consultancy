import MyLeadsPanel from "../MyLeadsPanel";

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