import { useEffect } from "react";

import BookingDesk from "../../components/public/appointment/BookingDesk";
import AfterBooking from "../../components/public/appointment/AfterBooking";
import AppointmentFaq from "../../components/public/appointment/AppointmentFaq";
import { DripDivider, ZAIFAN_NAVY } from "../../components/public/destinations/DestinationUI";

// Booking a call as booking a flight: three steps with a live boarding pass,
// then what happens after you book and the questions people ask.
function AppointmentPage() {
  useEffect(() => {
    document.title = "Book a free call | Zaifan Consultancy";
  }, []);

  return (
    <main className="overflow-x-clip bg-[#fff7ed] text-[#071f50]">
      <BookingDesk />
      <DripDivider background={ZAIFAN_NAVY} />
      <AfterBooking />
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
      <AppointmentFaq />
    </main>
  );
}

export default AppointmentPage;
