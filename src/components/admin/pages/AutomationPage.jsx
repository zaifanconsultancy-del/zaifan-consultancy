import CrmAutomationPanel from "../CrmAutomationPanel";

function AutomationPage({ cardClass, inquiries = [], appointments = [] }) {
  return (
    <CrmAutomationPanel
      cardClass={cardClass}
      inquiries={inquiries}
      appointments={appointments}
    />
  );
}

export default AutomationPage;