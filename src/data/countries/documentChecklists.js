// Document checklists for the Countries page, written for students applying
// from Pakistan. Italy's DOV and visa files are the exact lists Zaifan's office
// uses; every other country follows the same depth: application, visa file and
// arrival.
//
// Item fields: `group` sorts it under a heading (a stage can bring its own
// `groups`), `level` ("masters" or "bachelors") shows it only for that
// level, `note` is a short hint, `how` says where to get it, and `we` marks
// papers Zaifan prepares with the student.

export const DOCUMENT_GROUPS = {
  forms: "Forms & ID",
  academic: "Academic & translations",
  university: "University",
  money: "Sponsor & money",
  travel: "Travel, health & extras",
};

export const LEVELS = [
  { id: "bachelors", label: "Bachelor's" },
  { id: "masters", label: "Master's" },
];

const doc = (group, title, note, level, extra) => ({ group, title, ...(note && { note }), ...(level && { level }), ...extra });
const IBCC = { how: "Attested at IBCC: book online, then visit their office with originals." };
const HEC = { how: "Attested by HEC through its online degree attestation system." };

// Building blocks most countries share.
const PAK_ACADEMIC = [
  doc("academic", "Matric (SSC) certificate + marks sheet", "Attested by IBCC", null, IBCC),
  doc("academic", "Intermediate (HSSC) certificate + marks sheet", "Attested by IBCC", null, IBCC),
  doc("academic", "Bachelor's degree + transcript", "Attested by HEC", "masters", HEC),
  doc("academic", "Master's degree + transcript", "Attested by HEC · only if you already have one", "masters", HEC),
];

const PASSPORT_ID = [
  doc("forms", "Passport", "Valid for at least 6 months beyond your planned stay, with 2 blank pages", null, { how: "Passport office; renew early if it expires soon" }),
  doc("forms", "Copy of passport data page", null, null, { how: "A plain photocopy of the photo page" }),
  doc("forms", "Copy of CNIC", null, null, { how: "A plain photocopy" }),
];

const SPONSOR_FILE = [
  doc("money", "Bank statement, last 6 months", "Showing the required amount", null, { how: "Ask the sponsor's bank branch; it must be stamped and signed." }),
  doc("money", "Account maintenance certificate", null, null, { how: "From the same bank branch, original" }),
  doc("money", "Affidavit of sponsorship", "Your sponsor's promise to pay (usually a parent)", null, { how: "We give you the wording; your sponsor signs it on stamp paper.", we: true }),
  doc("money", "Family registration certificate (FRC)", "Proves your relation to the sponsor", null, { how: "Any NADRA office or the Pak-ID app" }),
  doc("money", "Sponsor's income proof", null, null, { how: "Job: employer letter + last 3 salary slips. Business: letterhead + Chamber of Commerce certificate." }),
  doc("money", "Sponsor's tax returns", "Last 2 years, with tax payer (NTN) certificate", null, { how: "Download from FBR's IRIS portal, or ask whoever files the taxes." }),
  doc("money", "Sponsor's CNIC copy", null, null, { how: "A plain photocopy" }),
  doc("money", "Property documents", "Optional, makes a weak bank file stronger", null, { how: "Registry or fard of any family property" }),
];

// Italy items say exactly where each paper comes from; `we` marks the ones
// Zaifan prepares with the student.
const it = (group, title, extra = {}) => ({ group, title, ...extra });
const PHOTOCOPY = "A plain photocopy";
const TRANSLATION = "Bring the original. We arrange the sworn Italian translation and the apostille.";

const ITALY_STAGES = [
  {
    id: "dov",
    label: "Embassy degree check (DOV)",
    summary: "First, the embassy confirms your certificates are real",
    intro:
      "What is this? Before Italy gives you a study visa, the Italian embassy checks that your Pakistani certificates are real and what they equal in Italy. That check is called a DOV (Declaration of Value). You don't need to know the forms: we prepare this file with you. The embassy wants the papers in two separate bundles, so keep two folders.",
    groups: {
      folder1: "Folder 1 · forms, admission and copies",
      folder2: "Folder 2 · original translations",
    },
    items: [
      it("folder1", "DOV application form", { how: "We give you this form and fill it in with you. You only sign and date it.", we: true }),
      it("folder1", "Admission letter from your Italian university", { how: "The university emails it when you're accepted. Print it." }),
      it("folder1", "Pre-enrolment summary", { note: "With 1 photo pasted on it", how: "We do your pre-enrolment on the Universitaly website and print this page for you.", we: true }),
      it("folder1", "Your latest degree (original) + Italian translation", { level: "masters", how: TRANSLATION, we: true }),
      it("folder1", "Transcript of that degree (copy) + Italian translation", { level: "masters", how: TRANSLATION, we: true }),
      it("folder1", "Intermediate (FSc / HSSC) certificate (copy) + Italian translation", { how: TRANSLATION, we: true }),
      it("folder1", "Matric (SSC) certificate (copy) + Italian translation", { how: TRANSLATION, we: true }),
      it("folder1", "IELTS or other English test result (copy)", { how: PHOTOCOPY }),
      it("folder1", "Domicile certificate (copy)", { how: "A photocopy of the domicile from your district office" }),
      it("folder1", "Passport (copy)", { note: "Stamped by a notary public", how: "Photocopy your passport's photo page and get it stamped by a notary; we tell you where." }),
      it("folder2", "Master's degree: original Italian translation", { note: "Only if you already have a master's", level: "masters", how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Master's degree (copy)", { note: "Only if you already have a master's", level: "masters", how: PHOTOCOPY }),
      it("folder2", "Master's transcript: original Italian translation", { note: "Only if you already have a master's", level: "masters", how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Master's transcript (copy)", { note: "Only if you already have a master's", level: "masters", how: PHOTOCOPY }),
      it("folder2", "Bachelor's degree: original Italian translation", { level: "masters", how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Bachelor's degree (copy)", { level: "masters", how: PHOTOCOPY }),
      it("folder2", "Bachelor's transcript: original Italian translation", { level: "masters", how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Bachelor's transcript (copy)", { level: "masters", how: PHOTOCOPY }),
      it("folder2", "Intermediate certificate: original Italian translation", { how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Intermediate certificate (copy)", { how: PHOTOCOPY }),
      it("folder2", "Matric certificate: original Italian translation", { how: "The original you get back from the translator (we arrange it).", we: true }),
      it("folder2", "Matric certificate (copy)", { how: PHOTOCOPY }),
      it("folder2", "Second passport copy", { note: "Also stamped by a notary public", how: "Same as the one in folder 1" }),
    ],
  },
  {
    id: "visa",
    label: "Student visa file",
    summary: "Then, everything for your visa appointment",
    intro: "Once your DOV is ready, this is everything to take to your Italian study visa appointment. Most of it is about proving your family can pay; we check every page before you go.",
    items: [
      it("forms", "Visa application form", { note: "Printed on A3 paper", how: "We fill it in with you. You sign it.", we: true }),
      it("forms", "4 passport-size photos", { note: "White background", how: "Any photo studio" }),
      it("forms", "Passport (copy)", { note: "Stamped by a notary public", how: "Photocopy of the photo page + notary stamp" }),
      it("academic", "Master's degree + translation", { note: "Only if you have one", level: "masters", how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "Master's transcript + translation", { note: "Only if you have one", level: "masters", how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "Bachelor's degree + translation", { level: "masters", how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "Bachelor's transcript + translation", { level: "masters", how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "Intermediate certificate + translation", { how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "Matric certificate + translation", { how: "Extra apostilled copies of your DOV translations; we arrange them.", we: true }),
      it("academic", "IELTS or other English test result (copy)", { how: PHOTOCOPY }),
      it("university", "Admission letter from your Italian university", { how: "Same letter as in your DOV file" }),
      it("university", "Pre-enrolment summary", { note: "With 1 photo pasted on it", how: "The same Universitaly page we printed for your DOV", we: true }),
      it("university", "Tuition fee receipt", { how: "Pay the first fee the way your university asks, then print the receipt." }),
      it("money", "Family registration certificate (FRC)", { note: "Issued in the last 6 months", how: "Any NADRA office or the Pak-ID app" }),
      it("money", "Affidavit of sponsorship (original)", { note: "With apostille, Italian translation and sponsor's CNIC", how: "We give you the wording; your sponsor signs it on stamp paper. We arrange translation and apostille.", we: true }),
      it("money", "Sponsor's job proof", { how: "Job: employer letter + last 3 salary slips. Business: letterhead + Chamber of Commerce certificate." }),
      it("money", "Proof of where the money comes from", { how: "e.g. salary letter, business registration, rent agreement or pension book" }),
      it("money", "Bank statement (last 6 months) + account maintenance certificate", { how: "Ask the sponsor's bank branch for both, stamped and signed." }),
      it("money", "Sponsor's tax returns (last 2 years) + tax payer certificate", { how: "Download from FBR's IRIS portal, or ask whoever files the taxes." }),
      it("money", "Property documents", { note: "Optional, but makes your file stronger", how: "Registry or fard of any family property" }),
      it("travel", "Cover letter", { note: "Why you're going, signed and dated", how: "We help you write it.", we: true }),
      it("travel", "Recommendation letters", { how: "Ask your teachers or employer; we give them a template.", we: true }),
      it("travel", "CV and any other certificates", { note: "Optional", how: "We help you make a clean CV.", we: true }),
      it("travel", "Travel health insurance", { how: "We help you pick a policy the embassy accepts.", we: true }),
      it("travel", "Flight booking", { note: "A reservation, not a paid ticket", how: "We arrange the reservation for you.", we: true }),
      it("travel", "Hotel booking", { note: "For your first nights", how: "We help you book one you can cancel.", we: true }),
      it("forms", "Domicile certificate (copy)", { how: PHOTOCOPY }),
      it("forms", "CNIC (copy)", { how: PHOTOCOPY }),
    ],
  },
  {
    id: "arrival",
    label: "After you land",
    summary: "Last, what to sort out in your first weeks",
    intro: "Your first weeks in Italy: residence permit, tax number and university enrolment. We send you a step-by-step guide before you fly.",
    items: [
      it("forms", "Residence permit (permesso di soggiorno) kit", { note: "Send it within 8 working days of arriving", how: "Ask for the 'kit' at a post office; we help you fill it in.", we: true }),
      it("forms", "Revenue stamp (marca da bollo)", { how: "Any tobacco shop (tabaccheria)" }),
      it("forms", "Codice fiscale (tax number)", { note: "Needed for rent, SIM card and bank", how: "Free at the Agenzia delle Entrate office; universities often help." }),
      it("forms", "4 passport photos", { note: "For your Questura appointment", how: "Photo booths at train stations" }),
      it("university", "Enrol at your university", { note: "Bring passport, visa, DOV and originals", how: "Your university's international office" }),
      it("university", "DSU scholarship papers", { note: "If you applied", how: "Your regional DSU website; keep every receipt" }),
      it("money", "Italian bank account or prepaid card", { how: "Most banks or Poste Italiane, with passport + codice fiscale" }),
      it("travel", "Health cover", { how: "Register at the local ASL health office, or keep private insurance." }),
      it("travel", "Rental contract", { note: "You need it for your residence permit", how: "From your landlord; check it's registered" }),
    ],
  },
];

const OTHER_STAGES = {
  germany: [
    {
      id: "apply",
      label: "University application",
      intro: "What German universities and uni-assist usually ask for.",
      items: [
        ...PAK_ACADEMIC,
        doc("academic", "Studienkolleg place or proof of 1–2 years of university study", "Pakistani HSSC alone rarely gives direct bachelor's entry", "bachelors"),
        doc("academic", "Course descriptions / module handbook", "Many master's programmes check your subjects", "masters"),
        doc("academic", "IELTS / TOEFL", "For English-taught programmes; 6.0–7.0 is typical"),
        doc("academic", "TestDaF / DSH / Goethe certificate", "Only for German-taught programmes"),
        doc("academic", "CV", "Tabular (Europass) format, signed and dated"),
        doc("academic", "Motivation letter", "One per programme"),
        doc("academic", "2 recommendation letters", "From teachers or employers", "masters"),
        doc("academic", "GRE / GMAT", "Only if the programme asks", "masters"),
        doc("university", "uni-assist VPD or application", "Where the university uses uni-assist"),
        doc("university", "Application fee payment proof"),
        doc("forms", "Copy of passport data page"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "For your appointment at the German Embassy Islamabad or Consulate Karachi. Book the appointment as soon as you have admission.",
      items: [
        doc("forms", "National visa application form (VIDEX)", "2 printed copies, signed"),
        doc("forms", "Declaration on the accuracy of information", "Signed"),
        doc("forms", "3 biometric photos", "35 × 45 mm, white background"),
        ...PASSPORT_ID,
        doc("forms", "Appointment confirmation + visa fee", "€75 paid in rupees at the counter"),
        doc("university", "Admission letter (Zulassungsbescheid)", "Or Studienkolleg / conditional admission"),
        doc("money", "Blocked account confirmation", "€11,904 for one year (Expatrio, Fintiba or Coracle)"),
        doc("travel", "Travel health insurance", "Covers you until you enrol and get public insurance"),
        doc("academic", "Attested academic documents + copies", "IBCC / HEC attested"),
        doc("academic", "Language certificate", "IELTS or German, as on your admission"),
        doc("academic", "CV and motivation letter", "Signed and dated"),
        doc("university", "uni-assist VPD", "If your admission was based on it"),
        doc("travel", "Proof of accommodation", "Optional, but helps"),
        doc("forms", "Copies of previous visas", "If you have travelled before"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Germany: registration, enrolment and residence permit.",
      items: [
        doc("forms", "Address registration (Anmeldung)", "Within 14 days, with the landlord confirmation (Wohnungsgeberbestätigung)"),
        doc("university", "Enrolment (Immatrikulation)", "Originals, insurance confirmation and semester fee payment"),
        doc("travel", "Public health insurance (TK, AOK…)", "Free/low-cost membership confirmation for the university"),
        doc("money", "Activate blocked account + German bank account"),
        doc("forms", "Residence permit appointment (Ausländerbehörde)", "Passport, photo, enrolment, insurance, finances, Anmeldung, rental contract"),
        doc("forms", "Tax ID (Steuer-ID)", "Arrives by post after Anmeldung; needed for a job"),
        doc("forms", "Broadcasting fee (Rundfunkbeitrag) registration"),
      ],
    },
  ],
  france: [
    {
      id: "apply",
      label: "University application",
      intro: "Pakistani students apply through the Études en France platform, which ends in a Campus France interview.",
      items: [
        ...PAK_ACADEMIC,
        doc("university", "Études en France account", "Your application lives here"),
        doc("university", "Campus France fee payment receipt"),
        doc("academic", "IELTS / TOEFL", "For English-taught programmes"),
        doc("academic", "DELF / DALF / TCF", "Only for French-taught programmes"),
        doc("academic", "CV", "Signed and dated"),
        doc("academic", "Motivation letter (lettre de motivation)", "One per programme"),
        doc("academic", "2 recommendation letters"),
        doc("academic", "Portfolio", "Art, design and architecture only"),
        doc("university", "Campus France interview", "Prepare: why France, why this course, your plan after"),
        doc("university", "Acceptance letter (pre-registration)", "From the French institution"),
        doc("forms", "Copy of passport data page"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Filed on France-Visas once Campus France has cleared your application.",
      items: [
        doc("forms", "France-Visas application form", "Printed and signed"),
        doc("forms", "2 passport photos", "35 × 45 mm, white background"),
        ...PASSPORT_ID,
        doc("forms", "Visa fee receipt"),
        doc("university", "Campus France certificate"),
        doc("university", "Acceptance / pre-registration letter"),
        doc("money", "Proof of resources", "At least ≈ €615 per month of study"),
        ...SPONSOR_FILE,
        doc("travel", "Accommodation for the first 3 months", "Residence booking, hotel or host letter"),
        doc("travel", "Flight reservation"),
        doc("travel", "Travel health insurance", "Until you join French social security"),
        doc("academic", "Academic documents + French/English translations"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in France.",
      items: [
        doc("forms", "Validate your VLS-TS online", "On the ANEF site within 3 months, and pay the tax stamp"),
        doc("university", "University registration + CVEC payment", "The student life contribution (≈ €100)"),
        doc("travel", "Social security registration", "On etudiant-etranger.ameli.fr"),
        doc("money", "French bank account (RIB)"),
        doc("money", "CAF housing aid (APL) application", "Can cut your rent noticeably"),
        doc("travel", "Home insurance (assurance habitation)", "Landlords usually ask for it"),
      ],
    },
  ],
  belgium: [
    {
      id: "apply",
      label: "University application",
      intro: "What Belgian universities usually ask for.",
      items: [
        ...PAK_ACADEMIC,
        doc("academic", "Equivalence decision", "From the Fédération Wallonie-Bruxelles, for French-speaking bachelor's", "bachelors"),
        doc("academic", "IELTS / TOEFL", "For English-taught programmes"),
        doc("academic", "French or Dutch certificate", "Only for programmes taught in those languages"),
        doc("academic", "CV and motivation letter"),
        doc("academic", "2 recommendation letters", null, "masters"),
        doc("university", "Application fee payment proof", "Some universities charge one"),
        doc("forms", "Copy of passport data page"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Belgium checks your health, record and money carefully, so start the medical and police documents early.",
      items: [
        doc("forms", "Long-stay visa application form", "Signed"),
        doc("forms", "2 passport photos"),
        ...PASSPORT_ID,
        doc("forms", "Visa fee + administrative fee receipts"),
        doc("university", "Admission / enrolment certificate"),
        doc("money", "Proof of sufficient means", "≈ €1,062/month: university blocked account or Annex 32 sponsorship"),
        ...SPONSOR_FILE,
        doc("travel", "Medical certificate", "From an embassy-approved doctor"),
        doc("travel", "Police clearance certificate", "Less than 6 months old, legalised"),
        doc("academic", "Legalised academic documents + translations"),
        doc("academic", "Equivalence decision", "If your programme needed one", "bachelors"),
        doc("travel", "Health insurance"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Belgium.",
      items: [
        doc("forms", "Register at your local commune (town hall)", "Within 8 days of arrival"),
        doc("forms", "Police address check", "An officer visits to confirm you live there"),
        doc("forms", "Residence card (A card)", "Collect it from the commune"),
        doc("travel", "Join a health fund (mutualité)"),
        doc("university", "Final university registration with originals"),
        doc("money", "Belgian bank account"),
      ],
    },
  ],
  romania: [
    {
      id: "apply",
      label: "University application",
      intro: "Romanian universities send your file to the Ministry of Education, which issues your Letter of Acceptance.",
      items: [
        doc("university", "Application form for the Letter of Acceptance"),
        ...PAK_ACADEMIC,
        doc("academic", "Translations of academic documents", "Into Romanian or English, notarised"),
        doc("forms", "Birth certificate + translation"),
        doc("forms", "Copy of passport data page"),
        doc("forms", "4 passport photos"),
        doc("travel", "Medical certificate", "Stating you are fit to study"),
        doc("academic", "Language certificate", "Or plan for the Romanian preparatory year"),
        doc("university", "Application processing fee proof"),
        doc("university", "Entrance test result", "Some medicine programmes run one"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Filed after you receive your Letter of Acceptance for Studies and pay the first year's tuition.",
      items: [
        doc("forms", "Visa application form", "Signed"),
        doc("forms", "2 passport photos"),
        ...PASSPORT_ID,
        doc("university", "Letter of Acceptance for Studies"),
        doc("money", "Proof of tuition payment for one year"),
        doc("money", "Proof of funds for living costs"),
        ...SPONSOR_FILE,
        doc("travel", "Medical insurance", "Valid for the whole visa period"),
        doc("travel", "Criminal record certificate (police clearance)"),
        doc("travel", "Proof of accommodation"),
        doc("forms", "Visa fee receipt"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Romania.",
      items: [
        doc("university", "University enrolment with originals"),
        doc("forms", "Residence permit (IGI)", "Apply before your visa expires"),
        doc("travel", "Registered rental contract"),
        doc("travel", "Health insurance"),
        doc("money", "Romanian bank account"),
      ],
    },
  ],
  lithuania: [
    {
      id: "apply",
      label: "University application",
      intro: "What Lithuanian universities usually ask for; most check your documents through the national recognition centre.",
      items: [
        ...PAK_ACADEMIC,
        doc("academic", "IELTS / TOEFL", "5.5–6.5 is typical"),
        doc("academic", "CV and motivation letter"),
        doc("academic", "2 recommendation letters", null, "masters"),
        doc("university", "Application fee payment proof"),
        doc("university", "Online interview", "Many programmes hold one"),
        doc("forms", "Copy of passport data page"),
      ],
    },
    {
      id: "visa",
      label: "Residence permit file",
      intro: "Most students apply for a temporary residence permit (TRP) through MIGRIS, often with the university's help.",
      items: [
        doc("forms", "MIGRIS online application"),
        doc("forms", "2 passport photos"),
        ...PASSPORT_ID,
        doc("university", "Admission letter / study contract"),
        doc("money", "Proof of sufficient funds"),
        ...SPONSOR_FILE,
        doc("travel", "Health insurance valid in Lithuania"),
        doc("travel", "Proof of accommodation"),
        doc("travel", "Police clearance certificate", "If requested"),
        doc("forms", "Fee receipt"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Lithuania.",
      items: [
        doc("forms", "Collect your TRP card", "At the Migration Department"),
        doc("forms", "Declare your place of residence"),
        doc("university", "University registration with originals"),
        doc("travel", "Keep health insurance active"),
        doc("money", "Lithuanian bank account"),
      ],
    },
  ],
  turkey: [
    {
      id: "apply",
      label: "University application",
      intro: "What Turkish universities usually ask for; Türkiye Bursları has its own online form.",
      items: [
        ...PAK_ACADEMIC,
        doc("academic", "High-school equivalence (Denklik)", "From the Turkish Ministry of Education, needed to enrol", "bachelors"),
        doc("academic", "YÖS / SAT or university exam result", "If the university asks", "bachelors"),
        doc("academic", "ALES / GRE", "Some master's programmes", "masters"),
        doc("academic", "IELTS / TOEFL or TÖMER", "English or Turkish, depending on the programme"),
        doc("academic", "Statement of purpose"),
        doc("academic", "2 recommendation letters", null, "masters"),
        doc("forms", "Copy of passport data page"),
        doc("forms", "Passport photos"),
        doc("university", "Türkiye Bursları application", "Optional: the government scholarship"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Filed after your acceptance letter arrives.",
      items: [
        doc("forms", "Visa application form", "Online pre-application, printed and signed"),
        doc("forms", "2 passport photos"),
        ...PASSPORT_ID,
        doc("university", "Acceptance letter"),
        doc("money", "Proof of financial means or scholarship letter"),
        ...SPONSOR_FILE,
        doc("academic", "Attested academic documents", "Sometimes with Turkish translation"),
        doc("travel", "Flight reservation"),
        doc("travel", "Proof of accommodation"),
        doc("travel", "Health insurance"),
        doc("forms", "Visa fee receipt"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Turkey.",
      items: [
        doc("university", "Final enrolment with originals and Denklik"),
        doc("university", "Student certificate (öğrenci belgesi)"),
        doc("forms", "Residence permit (ikamet) application", "Online on e-ikamet, within your first month"),
        doc("travel", "Health insurance for the permit"),
        doc("forms", "Tax number and phone (IMEI) registration"),
        doc("money", "Turkish bank account"),
      ],
    },
  ],
  china: [
    {
      id: "apply",
      label: "University & scholarship application",
      intro: "What Chinese universities and the CSC scholarship usually ask for.",
      items: [
        ...PAK_ACADEMIC,
        doc("forms", "Copy of passport", "Valid for at least 6 months"),
        doc("academic", "Study / research plan", "800+ words for master's", "masters"),
        doc("academic", "Study plan", "Why China, why this course", "bachelors"),
        doc("academic", "2 recommendation letters", "From professors or associate professors", "masters"),
        doc("travel", "Foreigner Physical Examination Form", "Filled by a doctor, with blood test report"),
        doc("travel", "Police character certificate", "Often required"),
        doc("academic", "IELTS / English proficiency or HSK", "HSK only for Chinese-taught programmes"),
        doc("university", "CSC online application", "With the university's agency number, if applying for the scholarship"),
        doc("university", "Application fee payment proof"),
        doc("university", "Pre-admission / acceptance letter", "Helps for CSC"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Filed once your admission notice and JW201/JW202 form arrive by courier.",
      items: [
        doc("forms", "Visa application form", "Signed"),
        doc("forms", "Passport photo", "48 × 33 mm, white background"),
        ...PASSPORT_ID,
        doc("university", "Admission notice (original)"),
        doc("university", "JW201 or JW202 form (original)"),
        doc("travel", "Physical examination form (copy)"),
        doc("forms", "Visa fee receipt"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in China.",
      items: [
        doc("forms", "Police registration of residence", "Within 24 hours; hotels do this for you"),
        doc("university", "University registration with originals"),
        doc("travel", "Health check at the local health centre"),
        doc("forms", "Residence permit", "Within 30 days, replaces your X1 visa"),
        doc("money", "Chinese bank account + WeChat / Alipay"),
        doc("forms", "Chinese SIM card"),
      ],
    },
  ],
  vietnam: [
    {
      id: "apply",
      label: "University application",
      intro: "What Vietnamese universities and international campuses usually ask for.",
      items: [
        ...PAK_ACADEMIC,
        doc("academic", "IELTS / TOEFL", "For English-taught programmes"),
        doc("academic", "Personal statement"),
        doc("academic", "2 recommendation letters", null, "masters"),
        doc("forms", "Copy of passport data page"),
        doc("forms", "Passport photos"),
        doc("travel", "Health check", "If requested"),
        doc("university", "Application fee payment proof"),
      ],
    },
    {
      id: "visa",
      label: "Student visa file",
      intro: "Your university applies for a visa approval letter first, then you file for the visa.",
      items: [
        doc("university", "Visa approval letter", "Arranged through your university"),
        doc("forms", "Visa application form (NA1)"),
        doc("forms", "2 passport photos"),
        ...PASSPORT_ID,
        doc("university", "Admission letter"),
        doc("money", "Proof of funds"),
        ...SPONSOR_FILE,
        doc("travel", "Health check", "If requested"),
        doc("forms", "Visa fee receipt"),
      ],
    },
    {
      id: "arrival",
      label: "After you land",
      intro: "Your first weeks in Vietnam.",
      items: [
        doc("university", "University enrolment with originals"),
        doc("forms", "Temporary residence card (TRC)", "Your university usually files it"),
        doc("forms", "Residence registration with local police"),
        doc("travel", "Student health insurance"),
        doc("money", "Vietnamese bank account"),
      ],
    },
  ],
};

// One plain line under each file's name, unless the file sets its own.
const DEFAULT_SUMMARIES = {
  apply: "What universities ask for when you apply",
  visa: "What the embassy asks for at your visa appointment",
  arrival: "What to sort out in your first weeks",
};

// Where to get the papers the lists above don't explain themselves. The first
// matching rule wins; `we` marks the ones Zaifan prepares with the student.
const HOW_RULES = [
  [/visa application form|visa form|VIDEX|France-Visas|MIGRIS|NA1/i, "We fill it in with you; you sign it.", true],
  [/declaration on the accuracy/i, "We give it to you with the visa form; you sign it.", true],
  [/photo/i, "Any photo studio; ask for the embassy size with a white background."],
  [/appointment confirmation|visa fee|fee receipt|administrative fee/i, "Paid when you book or attend your visa appointment; keep the receipt."],
  [/blocked account/i, "Opened online with Expatrio, Fintiba or Coracle; we walk you through it.", true],
  [/uni-assist/i, "Applied for online at uni-assist.de; we submit it with you.", true],
  [/studienkolleg/i, "Apply to a Studienkolleg directly or via uni-assist; we guide you.", true],
  [/études en france|campus france certificate/i, "Created on the Études en France website; we set it up with you.", true],
  [/campus france interview/i, "We do a practice interview with you first.", true],
  [/campus france fee/i, "Paid online during your Campus France application."],
  [/CSC/, "Online on the CSC website with the university's agency number; we do it with you.", true],
  [/JW20|admission notice/i, "Couriered to you by your Chinese university."],
  [/visa approval letter/i, "Your university requests it from Vietnam's immigration office."],
  [/application form for the letter/i, "We fill it in with you.", true],
  [/admission|acceptance|enrolment certificate|study contract/i, "Sent by the university when you're accepted; we track it for you."],
  [/application fee|processing fee/i, "Paid online when you apply; keep the receipt."],
  [/IELTS|TOEFL|English certificate|English proficiency/i, "Book at the British Council or IDP; results come online in about 2 weeks."],
  [/TestDaF|DSH|Goethe/i, "Book through the Goethe-Institut or TestDaF website."],
  [/DELF|DALF|TCF/i, "Book at the Alliance Française in Pakistan."],
  [/HSK/, "Book the test on the official HSK website."],
  [/TÖMER/, "From a TÖMER Turkish-language centre."],
  [/GRE|GMAT|ALES|YÖS|SAT|exam result|entrance test/, "Book the test online; we tell you if your programme needs it."],
  [/CV|motivation letter|statement|study plan|research plan|cover letter/i, "We help you write it.", true],
  [/recommendation/i, "Ask your teachers or employer; we give them a template.", true],
  [/portfolio/i, "Your best work as one PDF; we review it with you.", true],
  [/course descriptions|module handbook/i, "Ask your university's registrar office for official course outlines."],
  [/translation/i, "We arrange sworn translations.", true],
  [/equivalence|denklik/i, "Applied for with the education ministry; we guide you through it.", true],
  [/birth certificate/i, "Your union council or NADRA"],
  [/medical certificate|physical examination|health check/i, "From a doctor or hospital the embassy accepts; we tell you which."],
  [/police|criminal record/i, "Apply for a police character certificate online through your provincial police."],
  [/insurance/i, "We help you pick a policy the embassy accepts.", true],
  [/flight/i, "A reservation, not a paid ticket; we arrange it.", true],
  [/accommodation|housing/i, "A booking for your first weeks; we help you find one.", true],
  [/tuition payment/i, "Pay the first year's fee and print the receipt."],
  [/proof of (funds|resources|sufficient)|financial means|sufficient means/i, "Your sponsor's bank papers; see 'Sponsor & money' on this list."],
  [/academic (documents|certificates)/i, "Your attested certificates and their copies"],
  [/copy of passport/i, "A plain photocopy of the photo page"],
  [/language certificate|french or dutch/i, "Book the test your programme names; we tell you which one."],
  [/entrance test/i, "Set by the university; we help you prepare."],
  [/previous visas/i, "Photocopies of the visa pages in your old passports"],
  [/interview/i, "Online with the university; we do a practice run with you first.", true],
  [/türkiye burslari|türkiye bursları/i, "Online on the Türkiye Bursları website; we help with the essays.", true],
  [/residence permit|residence card|TRP card|\bTRC\b|ikamet|\bIGI\b/i, "We send you a step-by-step guide for your city before you fly.", true],
  [/university (registration|enrolment)|enrolment \(|final university|enrolment with/i, "Your university's international office, with all your originals"],
  [/student certificate/i, "Your university's student office"],
  [/bank account|\bRIB\b|wechat|alipay/i, "Any bank near campus, with your passport and student papers"],
  [/tax (id|number)|steuer/i, "The local tax office or its website; your university can point you there."],
  [/broadcasting/i, "Online at rundfunkbeitrag.de"],
  [/SIM card/i, "Any mobile shop, with your passport"],
  [/rental contract/i, "From your landlord; check it's registered"],
  [/register|registration|declare|commune|anmeldung|social security|health fund|validate/i, "At the town hall or the official website; we send you the steps.", true],
];

function withHow(item) {
  if (item.how) return item;
  const rule = HOW_RULES.find(([pattern]) => pattern.test(item.title));
  return rule ? { ...item, how: rule[1], ...(rule[2] && { we: true }) } : item;
}

export const DOCUMENT_CHECKLISTS = Object.fromEntries(
  Object.entries({ italy: ITALY_STAGES, ...OTHER_STAGES }).map(([slug, stages]) => [
    slug,
    stages.map((stage) => ({ summary: DEFAULT_SUMMARIES[stage.id], ...stage, items: stage.items.map(withHow) })),
  ]),
);

// Plain-English meanings for the jargon on these lists. Each sheet explains
// only the words that appear on it.
const GLOSSARY = [
  { term: "DOV (Declaration of Value)", match: /\bDOV\b|declaration of value/i, meaning: "The Italian embassy's official note that your Pakistani certificates are real and what they equal in Italy." },
  { term: "Apostille", match: /apostille/i, meaning: "A stamp from Pakistan's Ministry of Foreign Affairs (MOFA) that makes a document officially valid abroad." },
  { term: "Notary public", match: /notar/i, meaning: "A lawyer who stamps a copy to confirm it matches the original." },
  { term: "Pre-enrolment summary", match: /pre-enrolment/i, meaning: "The form you fill in on the Universitaly website. The embassy uses it for your DOV and visa." },
  { term: "IBCC", match: /\bIBCC\b/, meaning: "Inter Board Committee of Chairmen. It attests matric and intermediate certificates." },
  { term: "HEC", match: /\bHEC\b/, meaning: "Higher Education Commission. It attests bachelor's and master's degrees." },
  { term: "Transcript", match: /transcript/i, meaning: "Your detailed marks sheet, subject by subject." },
  { term: "FRC", match: /\bFRC\b|family registration/i, meaning: "Family Registration Certificate from NADRA. It lists your family and proves who your sponsor is." },
  { term: "Sponsor", match: /sponsor/i, meaning: "The person paying for your studies, usually a parent." },
  { term: "Affidavit", match: /affidavit/i, meaning: "A signed statement on stamp paper; here, your sponsor promising to pay your costs." },
  { term: "Account maintenance certificate", match: /account maintenance/i, meaning: "A letter from the bank confirming the account and its balance." },
  { term: "Domicile", match: /domicile/i, meaning: "The certificate that shows your home district and province." },
  { term: "Permesso di soggiorno", match: /permesso/i, meaning: "Italy's residence permit for students. You apply for it right after you arrive." },
  { term: "Marca da bollo", match: /marca da bollo/i, meaning: "An Italian revenue stamp you buy to pay official fees." },
  { term: "Codice fiscale", match: /codice fiscale/i, meaning: "Your Italian tax number. You need it for rent, a SIM card and a bank account." },
  { term: "Questura", match: /questura/i, meaning: "The Italian police office that handles residence permits." },
  { term: "DSU", match: /\bDSU\b/, meaning: "Italy's regional scholarships: tuition waiver, yearly grant and sometimes housing." },
  { term: "ISEE", match: /\bISEE\b/, meaning: "Italy's family-income calculation, used to set your fees and DSU scholarship." },
  { term: "SSN", match: /\bSSN\b/, meaning: "Italy's national health service." },
  { term: "Blocked account", match: /blocked account/i, meaning: "A German bank account holding one year of living money; you can take out a fixed amount each month." },
  { term: "uni-assist / VPD", match: /uni-assist|\bVPD\b/i, meaning: "uni-assist checks international certificates for many German universities; the VPD is its grade report." },
  { term: "VIDEX", match: /VIDEX/, meaning: "Germany's online visa form. You fill it in, print it and sign it." },
  { term: "Studienkolleg", match: /studienkolleg/i, meaning: "A one-year foundation course in Germany before a bachelor's." },
  { term: "Anmeldung", match: /anmeldung/i, meaning: "Registering your address at the town hall in Germany." },
  { term: "Ausländerbehörde", match: /ausländerbehörde/i, meaning: "Germany's foreigners' office, which issues your residence permit." },
  { term: "Campus France", match: /campus france|études en france/i, meaning: "France's official study agency. Pakistani students apply through its Études en France website." },
  { term: "CVEC", match: /\bCVEC\b/, meaning: "France's yearly student life fee, about €100." },
  { term: "VLS-TS / ANEF", match: /VLS-TS|ANEF/, meaning: "The VLS-TS is your French student visa; you confirm it online on the ANEF site after you arrive." },
  { term: "CAF / APL", match: /\bCAF\b|\bAPL\b/, meaning: "French housing aid that pays part of your rent." },
  { term: "Annex 32", match: /annex 32/i, meaning: "A Belgian form where a sponsor promises to cover your costs." },
  { term: "Equivalence decision", match: /equivalence/i, meaning: "An official note that your Pakistani certificates equal local ones." },
  { term: "Commune", match: /commune/i, meaning: "Your local town hall in Belgium." },
  { term: "Letter of Acceptance for Studies", match: /letter of acceptance/i, meaning: "Romania's Ministry of Education letter confirming your place. You need it for the visa." },
  { term: "IGI", match: /\bIGI\b/, meaning: "Romania's immigration office." },
  { term: "MIGRIS / TRP", match: /MIGRIS|\bTRP\b/, meaning: "MIGRIS is Lithuania's online migration portal; a TRP is a temporary residence permit." },
  { term: "Denklik", match: /denklik/i, meaning: "Turkey's certificate that your Pakistani FSc equals a Turkish high-school diploma." },
  { term: "YÖS / ALES", match: /YÖS|ALES/, meaning: "Turkish university entrance tests, for bachelor's (YÖS) and master's (ALES)." },
  { term: "TÖMER", match: /TÖMER/, meaning: "A Turkish-language certificate." },
  { term: "İkamet", match: /ikamet/i, meaning: "Turkey's residence permit." },
  { term: "CSC", match: /\bCSC\b/, meaning: "The Chinese Government Scholarship." },
  { term: "JW201 / JW202", match: /JW20/, meaning: "The official form from your Chinese university that you need for the student visa." },
  { term: "X1 visa", match: /\bX1\b/, meaning: "China's long-term student visa." },
  { term: "HSK", match: /\bHSK\b/, meaning: "The Chinese-language test." },
  { term: "TRC", match: /\bTRC\b/, meaning: "Vietnam's temporary residence card." },
  { term: "NA1", match: /\bNA1\b/, meaning: "Vietnam's visa application form." },
  { term: "GRE / GMAT", match: /GRE|GMAT/, meaning: "Graduate entrance tests some master's programmes ask for." },
];

/** The glossary entries that appear in this text. */
export function termsIn(text) {
  return GLOSSARY.filter((entry) => entry.match.test(text));
}

export function itemId(item) {
  return item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function itemsForLevel(items, level) {
  return items.filter((item) => !item.level || item.level === level);
}
