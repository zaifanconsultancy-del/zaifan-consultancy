// StudentDocumentsPanel PARTNER OS EXTREME V9 — Request Center + Guided Document Workspace
// Functional overhaul:
// - true multi-file document blocks (without destructive replacement)
// - multi-select upload
// - custom document types
// - search + status filtering
// - preview/open, download, verify, reject, archive, restore and delete
// - replacement uploads preserve the previous file as archived history
// - grouped document blocks with live counts
// - compact operational UI with purpose-first controls
// - preserves existing Supabase table/storage/timeline/parent-refresh architecture
// - no scoped <style> override block; Tailwind classes are explicit in the component
// - parent-data-first loading prevents duplicate Supabase requests and timeout storms
// - verified document files automatically complete matching document-type application requirements
// - rejection, unverify and re-review safely reopen linked application requirements
// - resilient lightweight retry keeps existing data instead of blanking the workspace
// - complete 166-type Italy-first document catalog from profile to post-arrival
// - common / active / complete catalog scopes keep the large reference usable
// - category filters, workflow stages, priorities and plain-English purpose notes
// - student-specific requirement metadata overrides catalog defaults safely
// - polished journey navigator prevents the 166-type catalog becoming a wall of cards
// - collapsible category workspaces, stage chips, focus modes and compact/detailed density
// - attention-first sorting surfaces rejected, missing-required and review items before reference-only types
// - search intentionally scans the complete catalog even when a focused scope is active
// - formal Request from Student center with priority, due date, instructions and permissions
// - active-request editing, request-again, stop-request, audit history and portal synchronization
// - schema-adaptive requirement persistence keeps older Supabase installations operational

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  File,
  FilePlus2,
  Files,
  FolderOpen,
  History,
  CalendarClock,
  ListChecks,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  XCircle,
  Square,
  CheckSquare,
  Save,
  Database,
  Undo2,
  Send,
  BellRing,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import StudentNotificationPreviewModal from "./StudentNotificationPreviewModal";
import StudentNotificationComposer from "./StudentNotificationComposer";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";

const REQUEST_TIMEOUT_MS = 45000;
const FAST_RETRY_TIMEOUT_MS = 15000;
const MUTATION_WATCHDOG_MS = 8000;
const STORAGE_BUCKET = "student-documents";

const DEFAULT_DOCUMENT_TYPES = [
  {
    name: "Passport",
    group: "Identity & Civil",
    stage: "Profile",
    priority: "Core",
    description: "Primary travel document; keep the bio page, validity and signature page available.",
    aliases: ["passport"],
    expiryTracking: true,
  },
  {
    name: "Passport Bio Page Copy",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Common",
    description: "Clear scan of the passport bio-data page for applications and visa files.",
    aliases: ["passport bio page", "passport biodata", "passport copy"],
    expiryTracking: true,
  },
  {
    name: "Previous Passports and Visas",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Conditional",
    description: "Previous passports, Schengen visas and pages showing entry or exit stamps.",
    aliases: ["old passport", "previous visa", "entry exit stamps"],
    expiryTracking: false,
  },
  {
    name: "CNIC / National ID",
    group: "Identity & Civil",
    stage: "Profile",
    priority: "Core",
    description: "Pakistani national identity document used for identity and consular-jurisdiction checks.",
    aliases: ["cnic", "national id", "identity card"],
    expiryTracking: true,
  },
  {
    name: "Family Registration Certificate (FRC)",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Core",
    description: "NADRA family record used to establish the applicant household and sponsor relationships.",
    aliases: ["frc", "family registration certificate", "nadra family"],
    expiryTracking: true,
  },
  {
    name: "Birth Certificate",
    group: "Identity & Civil",
    stage: "Profile",
    priority: "Common",
    description: "Civil birth record used when age, parentage or identity details must be confirmed.",
    aliases: ["birth certificate", "birth record"],
    expiryTracking: false,
  },
  {
    name: "Domicile / Residence Certificate",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Core",
    description: "Proof of permanent residence and the competent Italian consular jurisdiction.",
    aliases: ["domicile", "residence certificate", "proof of residence"],
    expiryTracking: true,
  },
  {
    name: "Passport Photographs",
    group: "Identity & Civil",
    stage: "Application",
    priority: "Core",
    description: "Recent passport-size photographs for university, visa and residence-permit procedures.",
    aliases: ["passport photo", "icao photo", "photograph"],
    expiryTracking: false,
  },
  {
    name: "Name Change Certificate",
    group: "Identity & Civil",
    stage: "Profile",
    priority: "Conditional",
    description: "Official evidence supporting a legal name change across identity and academic records.",
    aliases: ["name change", "change of name"],
    expiryTracking: false,
  },
  {
    name: "Marriage Certificate",
    group: "Identity & Civil",
    stage: "Profile",
    priority: "Conditional",
    description: "Civil marriage record when surname, family status or dependent information is relevant.",
    aliases: ["marriage certificate", "nikah nama"],
    expiryTracking: false,
  },
  {
    name: "Name Discrepancy Affidavit",
    group: "Identity & Civil",
    stage: "Recognition",
    priority: "Conditional",
    description: "Affidavit explaining spelling or name differences across identity and education documents.",
    aliases: ["name discrepancy", "same person affidavit", "spelling affidavit"],
    expiryTracking: false,
  },
  {
    name: "Guardian / Custody Order",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Conditional",
    description: "Court or legal document establishing guardianship or sole custody for a minor applicant.",
    aliases: ["guardianship", "custody order", "court custody"],
    expiryTracking: false,
  },
  {
    name: "Parental Consent Affidavit",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Conditional",
    description: "Apostilled consent for a minor's study and travel, including guardian and trip details.",
    aliases: ["parental consent", "minor consent", "travel consent"],
    expiryTracking: false,
  },
  {
    name: "Parent CNIC / Passport Copies",
    group: "Identity & Civil",
    stage: "Visa",
    priority: "Conditional",
    description: "Identity copies of non-travelling parents or legal guardians for a minor applicant.",
    aliases: ["parent cnic", "parent passport", "guardian id"],
    expiryTracking: false,
  },
  {
    name: "SSC / Matric Certificate",
    group: "Academic - School",
    stage: "Application",
    priority: "Core",
    description: "Secondary School Certificate or Matric qualification certificate.",
    aliases: ["ssc certificate", "matric certificate", "secondary school certificate"],
    expiryTracking: false,
  },
  {
    name: "SSC / Matric Transcript",
    group: "Academic - School",
    stage: "Application",
    priority: "Core",
    description: "Subject-wise marks sheet for SSC or Matric studies.",
    aliases: ["ssc transcript", "matric marksheet", "ssc marks"],
    expiryTracking: false,
  },
  {
    name: "HSSC / Intermediate Certificate",
    group: "Academic - School",
    stage: "Application",
    priority: "Core",
    description: "Higher Secondary School Certificate, FA, FSc, ICS or ICom qualification certificate.",
    aliases: [
      "hssc certificate",
      "intermediate certificate",
      "fsc certificate",
      "fa certificate",
      "ics certificate",
      "icom certificate",
    ],
    expiryTracking: false,
  },
  {
    name: "HSSC / Intermediate Transcript",
    group: "Academic - School",
    stage: "Application",
    priority: "Core",
    description: "Subject-wise marks sheet for HSSC, Intermediate, FA, FSc, ICS or ICom.",
    aliases: ["hssc transcript", "intermediate marksheet", "fsc marksheet", "fa marksheet"],
    expiryTracking: false,
  },
  {
    name: "O Level Certificate",
    group: "Academic - School",
    stage: "Application",
    priority: "Common",
    description: "Final O Level or IGCSE certificate issued by the examining board.",
    aliases: ["o level certificate", "igcse certificate"],
    expiryTracking: false,
  },
  {
    name: "O Level Statement of Results",
    group: "Academic - School",
    stage: "Application",
    priority: "Common",
    description: "Detailed O Level or IGCSE grades and subjects.",
    aliases: ["o level result", "igcse result", "statement of results"],
    expiryTracking: false,
  },
  {
    name: "A Level Certificate",
    group: "Academic - School",
    stage: "Application",
    priority: "Common",
    description: "Final A Level certificate issued by the examining board.",
    aliases: ["a level certificate"],
    expiryTracking: false,
  },
  {
    name: "A Level Statement of Results",
    group: "Academic - School",
    stage: "Application",
    priority: "Common",
    description: "Detailed A Level grades and subjects.",
    aliases: ["a level result", "a level statement"],
    expiryTracking: false,
  },
  {
    name: "Diploma / DAE Certificate",
    group: "Academic - School",
    stage: "Application",
    priority: "Conditional",
    description: "Technical diploma or Diploma of Associate Engineering completion certificate.",
    aliases: ["dae certificate", "technical diploma", "diploma certificate"],
    expiryTracking: false,
  },
  {
    name: "Diploma / DAE Transcript",
    group: "Academic - School",
    stage: "Application",
    priority: "Conditional",
    description: "Semester or annual marks record for a technical diploma or DAE.",
    aliases: ["dae transcript", "diploma transcript", "dae marksheet"],
    expiryTracking: false,
  },
  {
    name: "IBCC Equivalence Certificate",
    group: "Academic - School",
    stage: "Recognition",
    priority: "Conditional",
    description: "IBCC equivalence for foreign school qualifications such as O and A Levels.",
    aliases: ["ibcc equivalence", "o level equivalence", "a level equivalence"],
    expiryTracking: false,
  },
  {
    name: "Bachelor Degree",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Core",
    description: "Final bachelor's degree used for master's or second-cycle admission.",
    aliases: ["bachelor degree", "bs degree", "undergraduate degree"],
    expiryTracking: false,
  },
  {
    name: "Bachelor Transcript",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Core",
    description: "Complete bachelor-level transcript with courses, credits and grades.",
    aliases: ["bachelor transcript", "bs transcript", "undergraduate transcript"],
    expiryTracking: false,
  },
  {
    name: "Master Degree",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Final master's degree used for doctoral, second-master or advanced study applications.",
    aliases: ["master degree", "msc degree", "ma degree"],
    expiryTracking: false,
  },
  {
    name: "Master Transcript",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Complete master's transcript with courses, credits and grades.",
    aliases: ["master transcript", "msc transcript", "ma transcript"],
    expiryTracking: false,
  },
  {
    name: "MPhil / MS Degree",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Research or postgraduate qualification certificate for doctoral applications.",
    aliases: ["mphil degree", "ms degree", "research master"],
    expiryTracking: false,
  },
  {
    name: "MPhil / MS Transcript",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Detailed MPhil or MS academic transcript.",
    aliases: ["mphil transcript", "ms transcript"],
    expiryTracking: false,
  },
  {
    name: "Provisional Degree / Completion Certificate",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Common",
    description: "Temporary proof of graduation when the final degree has not yet been issued.",
    aliases: ["provisional degree", "completion certificate", "degree awaiting"],
    expiryTracking: false,
  },
  {
    name: "Enrollment / Bonafide Certificate",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Proof of current enrollment, student status or expected completion.",
    aliases: ["bonafide", "enrollment certificate", "student status certificate"],
    expiryTracking: true,
  },
  {
    name: "Medium of Instruction Certificate",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Common",
    description: "Institution letter confirming the language used for previous studies.",
    aliases: ["medium of instruction", "moi certificate", "english medium"],
    expiryTracking: false,
  },
  {
    name: "Course Syllabi / Detailed Course Descriptions",
    group: "Academic - Higher Education",
    stage: "Recognition",
    priority: "Conditional",
    description: "Official course content used for credit assessment or curricular evaluation.",
    aliases: ["course syllabus", "course description", "module description"],
    expiryTracking: false,
  },
  {
    name: "Grading Scale / Transcript Legend",
    group: "Academic - Higher Education",
    stage: "Recognition",
    priority: "Conditional",
    description: "Institutional explanation of grades, credit system and passing criteria.",
    aliases: ["grading scale", "transcript legend", "grade explanation"],
    expiryTracking: false,
  },
  {
    name: "Transfer / Migration Certificate",
    group: "Academic - Higher Education",
    stage: "Enrollment",
    priority: "Conditional",
    description: "Authorization or record for transfer between institutions.",
    aliases: ["migration certificate", "transfer certificate"],
    expiryTracking: false,
  },
  {
    name: "Academic Gap Explanation",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Signed explanation and supporting evidence for breaks in education.",
    aliases: ["gap explanation", "study gap", "academic gap"],
    expiryTracking: false,
  },
  {
    name: "Thesis / Final Project Certificate",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Conditional",
    description: "Proof of thesis, dissertation or final-year project completion.",
    aliases: ["thesis certificate", "final project certificate"],
    expiryTracking: false,
  },
  {
    name: "Degree",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Common",
    description: "Legacy umbrella block retained for a degree whose qualification level has not yet been classified.",
    aliases: ["general degree", "degree document"],
    expiryTracking: false,
  },
  {
    name: "Transcript",
    group: "Academic - Higher Education",
    stage: "Application",
    priority: "Common",
    description: "Legacy umbrella block retained for an academic transcript whose qualification level is not yet classified.",
    aliases: ["general transcript", "academic transcript"],
    expiryTracking: false,
  },
  {
    name: "HEC Attestation",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Core",
    description: "HEC-attested higher-education degree or transcript.",
    aliases: ["hec attestation", "hec attested"],
    expiryTracking: false,
  },
  {
    name: "IBCC Attestation",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Core",
    description: "IBCC-attested school certificate or marks sheet.",
    aliases: ["ibcc attestation", "ibcc attested"],
    expiryTracking: false,
  },
  {
    name: "MOFA Apostille",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Core",
    description: "Apostille issued by Pakistan's Ministry of Foreign Affairs for public documents.",
    aliases: ["mofa apostille", "apostille", "ministry foreign affairs"],
    expiryTracking: true,
  },
  {
    name: "Certified Italian Translation",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Core",
    description: "Italian translation certified and apostilled where required.",
    aliases: ["italian translation", "certified translation", "translated document"],
    expiryTracking: false,
  },
  {
    name: "Declaration of Value (DoV)",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Common",
    description: "Declaration of Value issued through the competent Italian diplomatic mission.",
    aliases: ["declaration of value", "dov"],
    expiryTracking: false,
  },
  {
    name: "CIMEA Statement of Comparability",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Common",
    description: "CIMEA statement comparing the foreign qualification with the Italian system.",
    aliases: ["cimea comparability", "statement of comparability"],
    expiryTracking: false,
  },
  {
    name: "CIMEA Statement of Verification",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Common",
    description: "CIMEA verification confirming the authenticity of the qualification.",
    aliases: ["cimea verification", "statement of verification"],
    expiryTracking: false,
  },
  {
    name: "CIMEA Application Receipt",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Conditional",
    description: "Submission or payment evidence while a CIMEA statement is being processed.",
    aliases: ["cimea receipt", "cimea application"],
    expiryTracking: false,
  },
  {
    name: "University Credential Evaluation",
    group: "Recognition & Legalization",
    stage: "Application",
    priority: "Conditional",
    description: "University-specific evaluation, recognition decision or qualification assessment.",
    aliases: ["credential evaluation", "qualification assessment", "recognition decision"],
    expiryTracking: false,
  },
  {
    name: "Document Legalization Receipt",
    group: "Recognition & Legalization",
    stage: "Recognition",
    priority: "Conditional",
    description: "Receipt or tracking proof for apostille, attestation, legalization or translation.",
    aliases: ["legalization receipt", "apostille receipt", "attestation receipt"],
    expiryTracking: false,
  },
  {
    name: "IELTS",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Core",
    description: "IELTS Test Report Form showing the overall and individual skill bands.",
    aliases: ["ielts", "test report form"],
    expiryTracking: true,
  },
  {
    name: "TOEFL",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Common",
    description: "TOEFL score report accepted by the selected programme.",
    aliases: ["toefl", "toefl ibt"],
    expiryTracking: true,
  },
  {
    name: "PTE Academic",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "Pearson PTE Academic score report.",
    aliases: ["pte academic", "pearson test"],
    expiryTracking: true,
  },
  {
    name: "Duolingo English Test",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "Duolingo English Test score report where the university accepts it.",
    aliases: ["duolingo english", "det score"],
    expiryTracking: true,
  },
  {
    name: "Cambridge English Certificate",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "Cambridge English qualification such as B2 First, C1 Advanced or C2 Proficiency.",
    aliases: ["cambridge english", "b2 first", "c1 advanced", "c2 proficiency"],
    expiryTracking: true,
  },
  {
    name: "Italian B2 Certificate",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Common",
    description: "Recognised Italian-language certificate demonstrating at least B2 proficiency.",
    aliases: ["italian b2", "cils", "celi", "plida", "cert.it"],
    expiryTracking: true,
  },
  {
    name: "University Language Certificate",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "Language assessment or certificate issued by an Italian university.",
    aliases: ["university language certificate", "language waiver", "internal language test"],
    expiryTracking: true,
  },
  {
    name: "SAT",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "SAT score report for programmes that use it for admission.",
    aliases: ["sat score", "sat result"],
    expiryTracking: true,
  },
  {
    name: "GRE",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "GRE General or Subject Test score report.",
    aliases: ["gre score", "graduate record examination"],
    expiryTracking: true,
  },
  {
    name: "GMAT",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "GMAT score report for business or management programmes.",
    aliases: ["gmat score", "graduate management admission"],
    expiryTracking: true,
  },
  {
    name: "IMAT",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "International Medical Admissions Test result for relevant medicine programmes.",
    aliases: ["imat", "medical admission test"],
    expiryTracking: false,
  },
  {
    name: "TOLC / Admission Test Result",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "TOLC or other university entrance-test result.",
    aliases: ["tolc", "admission test result", "entrance exam result"],
    expiryTracking: false,
  },
  {
    name: "Admission Interview Outcome",
    group: "Language & Admission Tests",
    stage: "Application",
    priority: "Conditional",
    description: "Interview invitation, evaluation or result issued by the university.",
    aliases: ["interview outcome", "admission interview", "interview result"],
    expiryTracking: false,
  },
  {
    name: "CV / Resume",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Core",
    description: "Current academic and professional CV tailored to the programme.",
    aliases: ["cv", "resume", "curriculum vitae"],
    expiryTracking: false,
  },
  {
    name: "Europass CV",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "CV prepared in the Europass format when requested.",
    aliases: ["europass cv", "europass"],
    expiryTracking: false,
  },
  {
    name: "Motivation Letter / SOP",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Core",
    description: "Programme-focused motivation letter or statement of purpose.",
    aliases: ["motivation letter", "statement of purpose", "sop"],
    expiryTracking: false,
  },
  {
    name: "Personal Statement",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Common",
    description: "Personal narrative supporting the student's academic goals and fit.",
    aliases: ["personal statement"],
    expiryTracking: false,
  },
  {
    name: "Study Plan",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Common",
    description: "Structured explanation of intended studies, modules and academic progression.",
    aliases: ["study plan", "academic plan"],
    expiryTracking: false,
  },
  {
    name: "Recommendation Letter",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Common",
    description: "Academic or professional recommendation; multiple files can remain in one block.",
    aliases: ["recommendation letter", "reference letter", "lor"],
    expiryTracking: false,
  },
  {
    name: "Research Proposal",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "Detailed proposed research question, method, literature and timeline.",
    aliases: ["research proposal", "doctoral proposal", "phd proposal"],
    expiryTracking: false,
  },
  {
    name: "Thesis Abstract / Research Summary",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "Concise summary of prior thesis, dissertation or research work.",
    aliases: ["thesis abstract", "research summary"],
    expiryTracking: false,
  },
  {
    name: "Publication List",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "List of published papers, conference work or research outputs.",
    aliases: ["publication list", "publications"],
    expiryTracking: false,
  },
  {
    name: "Portfolio",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "Selected creative, design, architecture, art or technical work.",
    aliases: ["portfolio", "design portfolio", "architecture portfolio", "art portfolio"],
    expiryTracking: false,
  },
  {
    name: "Audition / Performance Material",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "Audio, video, score or performance evidence for arts programmes.",
    aliases: ["audition", "performance material", "showreel"],
    expiryTracking: false,
  },
  {
    name: "University Application Form",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Core",
    description: "Submitted online or signed application form for the chosen institution.",
    aliases: ["university application", "application form"],
    expiryTracking: false,
  },
  {
    name: "Application Fee Receipt",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Common",
    description: "Receipt confirming payment of a university application fee.",
    aliases: ["application fee", "fee receipt"],
    expiryTracking: false,
  },
  {
    name: "Admission Letter",
    group: "Application & Admissions",
    stage: "Pre-enrolment",
    priority: "Core",
    description: "Official unconditional admission or offer letter from the Italian institution.",
    aliases: ["admission letter", "offer letter", "acceptance letter"],
    expiryTracking: false,
  },
  {
    name: "Conditional Admission Letter",
    group: "Application & Admissions",
    stage: "Pre-enrolment",
    priority: "Conditional",
    description: "Offer letter listing conditions that must be completed before enrollment.",
    aliases: ["conditional admission", "conditional offer"],
    expiryTracking: false,
  },
  {
    name: "Universitaly Pre-enrollment Application",
    group: "Application & Admissions",
    stage: "Pre-enrolment",
    priority: "Core",
    description: "Copy of the pre-enrollment application submitted through Universitaly.",
    aliases: ["universitaly application", "pre enrollment application", "pre-enrolment"],
    expiryTracking: false,
  },
  {
    name: "Universitaly Validation / Eligibility Letter",
    group: "Application & Admissions",
    stage: "Pre-enrolment",
    priority: "Core",
    description: "University-validated Universitaly summary or letter of eligibility for enrollment.",
    aliases: ["universitaly validation", "eligibility letter", "validated pre enrollment"],
    expiryTracking: false,
  },
  {
    name: "Tuition Fee Invoice",
    group: "Application & Admissions",
    stage: "Enrollment",
    priority: "Common",
    description: "Official invoice or payment request issued by the university.",
    aliases: ["tuition invoice", "fee invoice"],
    expiryTracking: false,
  },
  {
    name: "Tuition Fee Payment Receipt",
    group: "Application & Admissions",
    stage: "Enrollment",
    priority: "Common",
    description: "Proof of university tuition, deposit or first-installment payment.",
    aliases: ["tuition receipt", "tuition payment", "fee payment receipt"],
    expiryTracking: false,
  },
  {
    name: "Enrollment Confirmation",
    group: "Application & Admissions",
    stage: "Enrollment",
    priority: "Common",
    description: "Confirmation that enrollment or matriculation has been completed.",
    aliases: ["enrollment confirmation", "matriculation confirmation"],
    expiryTracking: false,
  },
  {
    name: "Scholarship Award Letter",
    group: "Application & Admissions",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official scholarship, fee-waiver or funding award letter.",
    aliases: ["scholarship award", "funding letter", "fee waiver"],
    expiryTracking: false,
  },
  {
    name: "University Email / Important Correspondence",
    group: "Application & Admissions",
    stage: "Application",
    priority: "Conditional",
    description: "Important official messages affecting admission, deadlines or document requests.",
    aliases: ["university email", "admission correspondence", "official correspondence"],
    expiryTracking: false,
  },
  {
    name: "Work Experience Certificate",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Employer-issued proof of role, responsibilities and employment dates.",
    aliases: ["work experience certificate", "experience letter"],
    expiryTracking: false,
  },
  {
    name: "Internship Certificate",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Proof of internship, traineeship or practical placement.",
    aliases: ["internship certificate", "internship letter"],
    expiryTracking: false,
  },
  {
    name: "Employment Reference Letter",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Professional reference supporting experience and suitability.",
    aliases: ["employment reference", "professional reference"],
    expiryTracking: false,
  },
  {
    name: "Professional License / Registration",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Professional council registration or license for regulated fields.",
    aliases: ["professional license", "professional registration"],
    expiryTracking: true,
  },
  {
    name: "Training / Short Course Certificate",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Relevant professional training, certification or short-course evidence.",
    aliases: ["training certificate", "short course certificate"],
    expiryTracking: false,
  },
  {
    name: "Awards / Achievements Evidence",
    group: "Employment & Profile",
    stage: "Application",
    priority: "Conditional",
    description: "Evidence of academic, professional, sports or extracurricular achievements.",
    aliases: ["award certificate", "achievement certificate"],
    expiryTracking: false,
  },
  {
    name: "Student Bank Statement",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Student's bank statement showing regular funds and transaction history.",
    aliases: ["student bank statement", "applicant bank statement"],
    expiryTracking: true,
  },
  {
    name: "Sponsor Bank Statement",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Sponsor's signed and stamped transaction history for the required period.",
    aliases: ["sponsor bank statement", "parent bank statement"],
    expiryTracking: true,
  },
  {
    name: "Bank Balance Certificate",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Bank-issued certificate confirming the current account balance.",
    aliases: ["balance certificate", "bank balance letter"],
    expiryTracking: true,
  },
  {
    name: "Bank Account Maintenance Certificate",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Bank letter confirming account ownership and maintenance history.",
    aliases: ["account maintenance", "bank maintenance certificate"],
    expiryTracking: true,
  },
  {
    name: "Sponsor Affidavit / Support Letter",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Apostilled sponsor declaration stating amount, source and duration of support.",
    aliases: ["sponsor affidavit", "support affidavit", "sponsorship letter"],
    expiryTracking: false,
  },
  {
    name: "Proof of Relationship to Sponsor",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Civil or family documents establishing the relationship between student and sponsor.",
    aliases: ["relationship proof", "sponsor relationship"],
    expiryTracking: false,
  },
  {
    name: "Sponsor CNIC / Passport",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Identity evidence for each financial sponsor.",
    aliases: ["sponsor cnic", "sponsor passport", "sponsor id"],
    expiryTracking: true,
  },
  {
    name: "Income Tax Returns",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Applicant or sponsor income tax returns, normally covering the requested historical period.",
    aliases: ["income tax return", "tax returns", "fbr return"],
    expiryTracking: true,
  },
  {
    name: "Salary Slips",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Core",
    description: "Recent payslips for an employed applicant or sponsor.",
    aliases: ["salary slip", "payslip", "pay slip"],
    expiryTracking: true,
  },
  {
    name: "Employment Contract",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Employment contract showing position, employer and compensation.",
    aliases: ["employment contract", "job contract"],
    expiryTracking: true,
  },
  {
    name: "Employer NOC / Leave Approval",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Employer letter confirming role, salary, leave dates and authorised absence.",
    aliases: ["employer noc", "leave approval", "employer letter"],
    expiryTracking: true,
  },
  {
    name: "Business Registration Certificate",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Government-issued business or company registration record.",
    aliases: ["business registration", "company registration"],
    expiryTracking: true,
  },
  {
    name: "Chamber of Commerce Registration",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Chamber of Commerce or equivalent authority registration.",
    aliases: ["chamber of commerce", "trade registration"],
    expiryTracking: true,
  },
  {
    name: "Partnership Deed / Articles of Incorporation",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Legal formation document for a partnership or company.",
    aliases: ["partnership deed", "articles of incorporation", "memorandum of association"],
    expiryTracking: false,
  },
  {
    name: "Property / Asset Documents",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Property, land, vehicle or other asset evidence supporting the financial profile.",
    aliases: ["property document", "asset document", "title deed"],
    expiryTracking: false,
  },
  {
    name: "Pension Statements",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Recent pension statements for a retired sponsor.",
    aliases: ["pension statement", "retirement income"],
    expiryTracking: true,
  },
  {
    name: "Scholarship Financial Proof",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Funding confirmation from a recognised university, authority or scholarship provider.",
    aliases: ["scholarship proof", "funding proof"],
    expiryTracking: false,
  },
  {
    name: "Education Loan Sanction Letter",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Bank or lender approval for an education loan.",
    aliases: ["education loan", "loan sanction"],
    expiryTracking: true,
  },
  {
    name: "Source of Funds Explanation",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Written explanation linking account activity, income and the study budget.",
    aliases: ["source of funds", "funds explanation"],
    expiryTracking: false,
  },
  {
    name: "Remittance / Funds Transfer Evidence",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Evidence of legitimate transfers, savings movement or tuition remittance.",
    aliases: ["remittance receipt", "fund transfer", "swift receipt"],
    expiryTracking: false,
  },
  {
    name: "Sponsor Business Financial Statements",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Conditional",
    description: "Audited accounts, profit-and-loss statements or business bank records.",
    aliases: ["business financial statements", "audited accounts", "profit loss"],
    expiryTracking: true,
  },
  {
    name: "Financial Documents",
    group: "Financial & Sponsor",
    stage: "Visa",
    priority: "Common",
    description: "Legacy umbrella block for mixed financial evidence before each item is classified into its dedicated type.",
    aliases: ["general financial documents", "financial evidence bundle"],
    expiryTracking: true,
  },
  {
    name: "Scholarship Application Form",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Completed university, regional or government scholarship form.",
    aliases: ["scholarship application", "dsu application"],
    expiryTracking: false,
  },
  {
    name: "Scholarship Application Receipt",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Submission confirmation, protocol number or payment receipt.",
    aliases: ["scholarship receipt", "application protocol"],
    expiryTracking: false,
  },
  {
    name: "ISEE Parificato / ISEEU",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Italian-equivalent economic indicator used by universities and regional benefit bodies.",
    aliases: ["isee parificato", "iseeu", "isee"],
    expiryTracking: true,
  },
  {
    name: "Family Composition Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official household composition record for income-based benefits.",
    aliases: ["family composition", "household certificate"],
    expiryTracking: true,
  },
  {
    name: "Family Income Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official statement of each household member's annual income.",
    aliases: ["family income certificate", "income certificate"],
    expiryTracking: true,
  },
  {
    name: "Family Property Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official evidence of real-estate ownership or non-ownership by the household.",
    aliases: ["family property", "property certificate"],
    expiryTracking: true,
  },
  {
    name: "Family Bank / Asset Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Household bank balances, movable assets or savings evidence.",
    aliases: ["family asset certificate", "family bank certificate"],
    expiryTracking: true,
  },
  {
    name: "Unemployment Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official proof that a household member is unemployed.",
    aliases: ["unemployment certificate", "jobless certificate"],
    expiryTracking: true,
  },
  {
    name: "No-Property Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official declaration that a person or household owns no real property.",
    aliases: ["no property certificate", "non ownership certificate"],
    expiryTracking: true,
  },
  {
    name: "Disability Certificate",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official disability documentation for accommodations, priority or additional benefits.",
    aliases: ["disability certificate", "special needs certificate"],
    expiryTracking: true,
  },
  {
    name: "Scholarship Ranking / Result",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Provisional or final ranking and award outcome.",
    aliases: ["scholarship ranking", "dsu ranking", "scholarship result"],
    expiryTracking: false,
  },
  {
    name: "Regional Scholarship Benefit Letter",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Confirmation of accommodation, meals, cash grant or fee exemption.",
    aliases: ["regional scholarship", "benefit letter", "dsu benefit"],
    expiryTracking: false,
  },
  {
    name: "Currency Conversion / Exchange Evidence",
    group: "Scholarship & Welfare",
    stage: "Scholarship",
    priority: "Conditional",
    description: "Official conversion reference where foreign income or assets must be reported in euros.",
    aliases: ["currency conversion", "exchange certificate"],
    expiryTracking: true,
  },
  {
    name: "National Visa (D) Application Form",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Completed and signed Italian long-stay study visa application form.",
    aliases: ["national visa d", "visa application form", "study visa form"],
    expiryTracking: false,
  },
  {
    name: "Visa Appointment Confirmation",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Official appointment allocation or booking confirmation.",
    aliases: ["visa appointment", "bls appointment", "intiana appointment"],
    expiryTracking: false,
  },
  {
    name: "Visa Fee Receipt",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Common",
    description: "Receipt for visa and application-centre service charges.",
    aliases: ["visa fee", "bls receipt", "visa receipt"],
    expiryTracking: false,
  },
  {
    name: "Proof of Consular Jurisdiction",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Residence certificate and identity evidence proving the competent consular jurisdiction.",
    aliases: ["consular jurisdiction", "jurisdiction proof"],
    expiryTracking: true,
  },
  {
    name: "Passport and Visa Page Copies",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Photocopies of passport pages, previous visas and entry or exit stamps.",
    aliases: ["passport pages", "visa page copies", "entry exit copies"],
    expiryTracking: false,
  },
  {
    name: "Flight Reservation",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Flight reservation or ticket showing the planned journey to Italy.",
    aliases: ["flight reservation", "air ticket", "flight booking"],
    expiryTracking: true,
  },
  {
    name: "Intra-Schengen Travel Reservation",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Train, flight, car-rental or other booking for Schengen layovers and connections.",
    aliases: ["schengen travel", "train reservation", "connecting flight"],
    expiryTracking: true,
  },
  {
    name: "Health Insurance (€30,000)",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Schengen-valid medical and repatriation cover meeting the stated minimum coverage.",
    aliases: ["health insurance", "travel insurance", "medical insurance"],
    expiryTracking: true,
  },
  {
    name: "Accommodation Proof",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Hotel, residence, rental, university housing or other confirmed accommodation.",
    aliases: ["accommodation proof", "hotel booking", "residence booking"],
    expiryTracking: true,
  },
  {
    name: "Hospitality / Accommodation Declaration",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Host declaration, guarantee or invitation when staying with a private person.",
    aliases: ["hospitality declaration", "accommodation declaration", "host invitation"],
    expiryTracking: true,
  },
  {
    name: "Visa Motivation Letter",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Core",
    description: "Letter to the Visa Officer explaining study purpose, programme choice and future plan.",
    aliases: ["visa motivation letter", "letter to visa officer"],
    expiryTracking: false,
  },
  {
    name: "Police Clearance Certificate",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Police character or criminal-record certificate when requested.",
    aliases: ["police clearance", "character certificate", "criminal record"],
    expiryTracking: true,
  },
  {
    name: "Medical Fitness Certificate",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Medical or fitness certificate when required by the programme or authority.",
    aliases: ["medical certificate", "fitness certificate"],
    expiryTracking: true,
  },
  {
    name: "Biometrics Receipt",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Evidence of fingerprints or biometrics submission.",
    aliases: ["biometrics receipt", "fingerprint receipt"],
    expiryTracking: false,
  },
  {
    name: "Visa Interview Notes / Outcome",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Internal record or official communication concerning the visa interview.",
    aliases: ["visa interview", "interview notes"],
    expiryTracking: false,
  },
  {
    name: "Visa Decision Letter",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Common",
    description: "Official decision or passport-collection communication.",
    aliases: ["visa decision", "passport collection"],
    expiryTracking: false,
  },
  {
    name: "Visa Sticker / Granted Visa",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Common",
    description: "Scan of the issued visa sticker and validity details.",
    aliases: ["visa sticker", "granted visa", "issued visa"],
    expiryTracking: true,
  },
  {
    name: "Visa Refusal Letter",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Official refusal notice containing reasons and appeal information.",
    aliases: ["visa refusal", "refusal letter", "visa rejection"],
    expiryTracking: false,
  },
  {
    name: "Appeal / Reconsideration Documents",
    group: "Visa & Travel",
    stage: "Visa",
    priority: "Conditional",
    description: "Legal submission, clarification or additional evidence after a refusal.",
    aliases: ["visa appeal", "reconsideration", "appeal documents"],
    expiryTracking: false,
  },
  {
    name: "Codice Fiscale",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Italian tax-code certificate used for enrollment, housing and banking.",
    aliases: ["codice fiscale", "tax code"],
    expiryTracking: false,
  },
  {
    name: "Permesso di Soggiorno Application Receipt",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Post-office kit receipt proving the residence-permit application.",
    aliases: ["permesso receipt", "residence permit receipt", "postal kit receipt"],
    expiryTracking: true,
  },
  {
    name: "Permesso di Soggiorno Card",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Issued Italian residence-permit card for study.",
    aliases: ["permesso card", "residence permit card"],
    expiryTracking: true,
  },
  {
    name: "Questura Appointment / Convocation",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Police appointment, fingerprints notice or request for additional documents.",
    aliases: ["questura appointment", "questura letter", "convocation"],
    expiryTracking: true,
  },
  {
    name: "SSN Enrollment / Italian Health Cover",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Italian National Health Service enrollment or equivalent valid health coverage.",
    aliases: ["ssn enrollment", "italian health cover", "tessera sanitaria"],
    expiryTracking: true,
  },
  {
    name: "University Final Enrollment Certificate",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Final certificate confirming matriculation at the Italian institution.",
    aliases: ["final enrollment", "university enrollment certificate"],
    expiryTracking: true,
  },
  {
    name: "Student ID Card",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "University-issued student identification card.",
    aliases: ["student id card", "university card"],
    expiryTracking: true,
  },
  {
    name: "Accommodation Contract",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Signed rental, residence or student-housing contract.",
    aliases: ["accommodation contract", "rental contract", "lease"],
    expiryTracking: true,
  },
  {
    name: "Residence Registration / Anagrafe",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Municipal residence-registration certificate where applicable.",
    aliases: ["anagrafe", "residence registration"],
    expiryTracking: true,
  },
  {
    name: "Italian Bank Account / IBAN",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Italian bank-account confirmation or IBAN for refunds and scholarship payments.",
    aliases: ["italian iban", "italian bank account", "iban certificate"],
    expiryTracking: true,
  },
  {
    name: "Tuition / Regional Tax Receipt",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Receipt for enrollment installments, regional tax or student contributions.",
    aliases: ["regional tax receipt", "enrollment tax", "tuition tax receipt"],
    expiryTracking: false,
  },
  {
    name: "Arrival Declaration / Declaration of Presence",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Declaration required in specific short-stay or arrival circumstances.",
    aliases: ["declaration of presence", "arrival declaration"],
    expiryTracking: false,
  },
  {
    name: "Travel Boarding Passes",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Boarding passes supporting the actual date and route of arrival.",
    aliases: ["boarding pass", "travel boarding"],
    expiryTracking: false,
  },
  {
    name: "Residence Permit Renewal Documents",
    group: "Post-Arrival & Enrollment",
    stage: "Post-arrival",
    priority: "Post-arrival",
    description: "Updated enrollment, insurance, funds and housing evidence for permit renewal.",
    aliases: ["permit renewal", "permesso renewal"],
    expiryTracking: true,
  },
  {
    name: "Minor Travel Consent",
    group: "Special Cases",
    stage: "Visa",
    priority: "Conditional",
    description: "Specific consent document for a minor travelling alone or with one parent.",
    aliases: ["minor travel consent"],
    expiryTracking: false,
  },
  {
    name: "Court Guardianship Authorization",
    group: "Special Cases",
    stage: "Visa",
    priority: "Conditional",
    description: "Court authorization for guardianship or the specific international trip.",
    aliases: ["court guardianship", "guardianship authorization"],
    expiryTracking: false,
  },
  {
    name: "Learning Support / DSA Documents",
    group: "Special Cases",
    stage: "Application",
    priority: "Conditional",
    description: "Evidence needed to request disability or specific-learning-support arrangements.",
    aliases: ["dsa documents", "learning support", "special accommodation"],
    expiryTracking: true,
  },
  {
    name: "Medical Programme Health Requirements",
    group: "Special Cases",
    stage: "Enrollment",
    priority: "Conditional",
    description: "Vaccination, occupational health or medical clearance for clinical programmes.",
    aliases: ["vaccination certificate", "medical programme health", "occupational health"],
    expiryTracking: true,
  },
  {
    name: "Document Correction / Rectification Evidence",
    group: "Special Cases",
    stage: "Recognition",
    priority: "Conditional",
    description: "Official correction request or amended record replacing an inaccurate document.",
    aliases: ["document correction", "rectification", "amended certificate"],
    expiryTracking: false,
  },
  {
    name: "Dependent / Family Visa Documents",
    group: "Special Cases",
    stage: "Visa",
    priority: "Conditional",
    description: "Marriage, birth, sponsor and relationship documents for accompanying family members.",
    aliases: ["dependent visa", "family visa documents"],
    expiryTracking: true,
  },
];

const DOCUMENT_GROUP_ORDER = [
  "Identity & Civil",
  "Academic - School",
  "Academic - Higher Education",
  "Recognition & Legalization",
  "Language & Admission Tests",
  "Application & Admissions",
  "Employment & Profile",
  "Financial & Sponsor",
  "Scholarship & Welfare",
  "Visa & Travel",
  "Post-Arrival & Enrollment",
  "Special Cases",
  "Custom",
];

const DOCUMENT_STAGE_ORDER = [
  "Profile",
  "Application",
  "Recognition",
  "Pre-enrolment",
  "Scholarship",
  "Visa",
  "Enrollment",
  "Post-arrival",
  "Student-specific",
];

const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const safeFileName = (value) =>
  String(value || "document")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const REQUIREMENT_META_PREFIX = "ZAIFAN_REQUEST_META::";

const normalizeRequestPriority = (value) => {
  const clean = String(value || "normal").trim().toLowerCase();
  if (["urgent", "high", "normal", "low"].includes(clean)) return clean;
  if (clean.includes("urgent")) return "urgent";
  if (clean.includes("high") || clean.includes("important")) return "high";
  if (clean.includes("low") || clean.includes("optional")) return "low";
  return "normal";
};

const readRequirementMeta = (requirement = {}) => {
  const rawNotes = String(requirement?.notes || "");
  let stored = {};

  if (rawNotes.startsWith(REQUIREMENT_META_PREFIX)) {
    try {
      stored = JSON.parse(rawNotes.slice(REQUIREMENT_META_PREFIX.length)) || {};
    } catch {
      stored = {};
    }
  }

  const directInstructions =
    requirement?.instructions || requirement?.description || "";
  const legacyNotes = rawNotes.startsWith(REQUIREMENT_META_PREFIX)
    ? ""
    : rawNotes;

  return {
    instructions:
      directInstructions || stored.instructions || legacyNotes || "",
    priority: normalizeRequestPriority(
      requirement?.priority || requirement?.request_priority || stored.priority
    ),
    dueDate:
      requirement?.due_date ||
      requirement?.deadline ||
      requirement?.expires_at ||
      stored.dueDate ||
      "",
    requestedAt:
      requirement?.requested_at || stored.requestedAt || requirement?.created_at || "",
    requestedBy:
      requirement?.requested_by || stored.requestedBy || requirement?.created_by || null,
    requestCount: Math.max(
      1,
      Number(requirement?.request_count || stored.requestCount || 1)
    ),
    notifyStudent:
      typeof stored.notifyStudent === "boolean" ? stored.notifyStudent : true,
  };
};

const buildRequirementNotes = ({
  instructions,
  priority,
  dueDate,
  requestedAt,
  requestedBy,
  requestCount,
  notifyStudent,
}) =>
  `${REQUIREMENT_META_PREFIX}${JSON.stringify({
    instructions: String(instructions || "").trim(),
    priority: normalizeRequestPriority(priority),
    dueDate: dueDate || "",
    requestedAt: requestedAt || new Date().toISOString(),
    requestedBy: requestedBy || null,
    requestCount: Math.max(1, Number(requestCount || 1)),
    notifyStudent: Boolean(notifyStudent),
  })}`;

const isRequirementSchemaMismatch = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("unknown field")
  );
};

const getRequestPriorityClasses = (priority) => {
  switch (normalizeRequestPriority(priority)) {
    case "urgent":
      return "border-red-400 bg-red-50 text-red-800";
    case "high":
      return "border-orange-400 bg-orange-50 text-orange-800";
    case "low":
      return "border-slate-300 bg-slate-50 text-slate-600";
    default:
      return "border-blue-300 bg-blue-50 text-blue-800";
  }
};

const formatDate = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StudentDocumentsPanel({
  student,
  sharedDocuments = null,
  onSharedDataChange = null,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [catalogScope, setCatalogScope] = useState("common");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState("compact");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(
    () => new Set(["Identity & Civil"])
  );
  const [expandedBlocks, setExpandedBlocks] = useState(
    () => new Set(["Passport", "CNIC / National ID"])
  );
  const [customTypes, setCustomTypes] = useState([]);
  const [showAddType, setShowAddType] = useState(false);
  const [showRequestCenter, setShowRequestCenter] = useState(false);
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestForm, setRequestForm] = useState({
    documentName: "",
    required: true,
    priority: "normal",
    dueDate: "",
    instructions: "",
    verificationRequired: true,
    studentCanUpload: true,
    expiryTracking: false,
    notifyStudent: true,
  });
  const [customTypeName, setCustomTypeName] = useState("");
  const [customTypeGroup, setCustomTypeGroup] = useState("Custom");
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [undoAction, setUndoAction] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showDeleted, setShowDeleted] = useState(false);

  const [metadataTarget, setMetadataTarget] = useState(null);
  const [metadataForm, setMetadataForm] = useState({
    document_category: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

  const [actorId, setActorId] = useState(null);
  const [pendingNotification, setPendingNotification] = useState(null);
  const [notificationBusy, setNotificationBusy] = useState(false);

  const undoTimerRef = useRef(null);

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const studentId = student?.id;
  const studentType = useMemo(
    () =>
      String(
        student?.student_type ||
          student?.__leadType ||
          student?.type ||
          "inquiry"
      )
        .trim()
        .toLowerCase(),
    [student?.__leadType, student?.student_type, student?.type]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveActor = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setActorId(data?.session?.user?.id || null);
      } catch {
        if (!cancelled) setActorId(null);
      }
    };

    void resolveActor();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!studentId) {
      setRequirements([]);
      setHistoryEvents([]);
      return;
    }

    const loadMasterFileSupportData = async () => {
      const [requirementsResult, historyResult] = await Promise.allSettled([
        supabase
          .from("student_document_requirements")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .eq("status", "active")
          .order("created_at", { ascending: true }),

        supabase
          .from("student_document_events")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(150),
      ]);

      if (!mountedRef.current) return;

      if (
        requirementsResult.status === "fulfilled" &&
        !requirementsResult.value.error
      ) {
        setRequirements(requirementsResult.value.data || []);
      }

      if (
        historyResult.status === "fulfilled" &&
        !historyResult.value.error
      ) {
        setHistoryEvents(historyResult.value.data || []);
      }
    };

    void loadMasterFileSupportData();
  }, [studentId, studentType]);

  useEffect(() => {
    if (!Array.isArray(sharedDocuments)) return;

    // StudentDetailModal already loads student_documents as part of the Student OS
    // payload. Reuse that result instead of immediately firing a second identical
    // Supabase request that can compete with the parent load and produce timeouts.
    setDocuments(sharedDocuments);
    setLoading(false);

    // Clear stale timeout/error messages as soon as authoritative parent data arrives.
    setError((current) =>
      current.includes("refresh delayed") ||
      current.includes("timed out") ||
      current.includes("Failed to load")
        ? ""
        : current
    );
  }, [sharedDocuments]);

  useEffect(() => {
    // When this panel is used inside StudentDetailModal, sharedDocuments is always
    // an array (including an intentionally empty array), so the parent is the source
    // of truth. Standalone usages still fetch their own data.
    if (Array.isArray(sharedDocuments)) return;

    loadDocuments({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const startSaving = (key) => {
    if (!key) return;

    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    });
  };

  const stopSaving = (key) => {
    if (!key) return;

    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    });
  };

  const isSaving = (key) => savingKeys.has(key);

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const notifyParent = async () => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await Promise.race([
        Promise.resolve(onSharedDataChange()),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Student OS refresh timed out.")),
            10000
          )
        ),
      ]);
    } catch (refreshError) {
      console.warn(
        "Documents saved, but parent Student OS refresh failed:",
        refreshError
      );
    }
  };

  const createTimelineEvent = async ({
    eventType,
    title,
    description,
    newValue = "",
  }) => {
    try {
      await supabase.from("student_application_timeline").insert({
        student_id: Number(studentId),
        student_type: studentType,
        event_type: eventType,
        title,
        description,
        new_value: newValue,
      });
    } catch {
      // Timeline logging must never block the document action.
    }
  };

  const createDocumentEvent = async ({
    documentId = null,
    eventType,
    eventLabel = "",
    previousStatus = null,
    newStatus = null,
    previousNotes = null,
    newNotes = null,
    reason = null,
    metadata = {},
  }) => {
    try {
      const { data, error: eventError } = await supabase
        .from("student_document_events")
        .insert({
          student_id: Number(studentId),
          student_type: studentType,
          document_id: documentId,
          event_type: eventType,
          event_label: eventLabel || eventType,
          previous_status: previousStatus,
          new_status: newStatus,
          previous_notes: previousNotes,
          new_notes: newNotes,
          reason,
          metadata,
          performed_by: actorId,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      safeSet(() => {
        setHistoryEvents((previous) => [data, ...previous].slice(0, 150));
      });

      return data;
    } catch (eventError) {
      console.warn("Document history event failed:", eventError);
      return null;
    }
  };

  const reloadHistory = async () => {
    if (!studentId) return;

    setHistoryLoading(true);

    try {
      const { data, error: historyError } = await supabase
        .from("student_document_events")
        .select("*")
        .eq("student_id", studentId)
        .eq("student_type", studentType)
        .order("created_at", { ascending: false })
        .limit(150);

      if (historyError) throw historyError;
      safeSet(() => setHistoryEvents(data || []));
    } catch (historyError) {
      console.warn("Document history refresh failed:", historyError);
    } finally {
      safeSet(() => setHistoryLoading(false));
    }
  };

  const loadDocuments = async ({ silent = false } = {}) => {
    const requestId = Date.now();
    loadRequestRef.current = requestId;

    if (!studentId) {
      safeSet(() => {
        setDocuments([]);
        setLoading(false);
        setError("");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      if (!silent) setError("");
    });

    const runPrimaryQuery = () =>
      withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(500),
        "Document refresh delayed."
      );

    const runFastRetry = () =>
      Promise.race([
        supabase
          .from("student_documents")
          .select(
            "id,student_id,student_type,document_name,status,file_path,file_url,notes,created_at,updated_at"
          )
          .eq("student_id", studentId)
          .limit(500),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Document refresh delayed.")),
            FAST_RETRY_TIMEOUT_MS
          )
        ),
      ]);

    try {
      let result;

      try {
        result = await runPrimaryQuery();
      } catch (primaryError) {
        console.warn(
          "Primary document refresh was slow; trying lightweight fallback:",
          primaryError?.message || primaryError
        );
        result = await runFastRetry();
      }

      if (loadRequestRef.current !== requestId) return;
      if (result?.error) throw result.error;

      safeSet(() => {
        setDocuments(result?.data || []);
        setError("");
        if (!silent) {
          setSuccessMessage(
            `Document vault refreshed · ${result?.data?.length || 0} file${
              result?.data?.length === 1 ? "" : "s"
            } loaded.`
          );
        }
      });
    } catch (loadError) {
      if (loadRequestRef.current !== requestId) return;

      console.warn("Document refresh failed:", loadError);

      safeSet(() => {
        // Never wipe already-loaded parent/shared data just because a manual refresh
        // request was slow. Keep the workspace usable and make the failure recoverable.
        if (documents.length > 0 || Array.isArray(sharedDocuments)) {
          setError(
            "Live refresh delayed. Existing Student OS document data is still available; use Refresh again when the connection stabilizes."
          );
        } else {
          setError(
            loadError?.message ||
              "Could not reach the document service. Check Supabase connectivity and retry."
          );
        }
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const getFileName = (item) => {
    if (item?.original_file_name) return item.original_file_name;
    if (!item?.file_path) return item?.document_name || "Student document";
    return item.file_path.split("/").pop() || "Student document";
  };

  const buildStoragePath = (documentName, file) => {
    const safeDocumentName = safeFileName(documentName.toLowerCase());
    const finalFileName = safeFileName(file.name);

    return `${studentId}/${safeDocumentName}/${Date.now()}-${finalFileName}`;
  };

  const resolveBaseType = (document) => {
    const documentName = normalize(document?.document_name);
    const searchText = normalize(
      [
        document?.document_name,
        document?.notes,
        document?.file_path,
        getFileName(document),
      ]
        .filter(Boolean)
        .join(" ")
    );

    const requirementTypes = requirements.map((item) => ({
      name: item.document_name,
      group: item.group_name || "Custom",
      aliases: [item.document_name],
    }));

    const allTypes = [
      ...DEFAULT_DOCUMENT_TYPES,
      ...requirementTypes,
      ...customTypes,
    ];

    const exact = allTypes.find(
      (type) => normalize(type.name) === documentName
    );
    if (exact) return exact.name;

    const prefixed = allTypes.find((type) =>
      documentName.startsWith(`${normalize(type.name)} •`)
    );
    if (prefixed) return prefixed.name;

    const aliasMatch = allTypes.find((type) =>
      (type.aliases || [type.name]).some((alias) =>
        searchText.includes(normalize(alias))
      )
    );

    return aliasMatch?.name || document?.document_name || "Other";
  };

  const documentTypes = useMemo(() => {
    const persistentTypes = requirements.map((item) => {
      const requestMeta = readRequirementMeta(item);

      return {
        name: item.document_name,
        group: item.group_name || "Custom",
        stage: item.stage_name || item.workflow_stage || "Student-specific",
        priority: item.required ? "Core" : "Conditional",
        description:
          requestMeta.instructions ||
          "Student-specific document requirement added to this master file.",
        aliases: [item.document_name],
        requirementId: item.id,
        required: item.required,
        verificationRequired: item.verification_required,
        expiryTracking: item.expiry_tracking,
        studentCanUpload: item.student_can_upload,
        counselorCanUpload: item.counselor_can_upload,
        adminOnly: item.admin_only,
        requestPriority: requestMeta.priority,
        requestDueDate: requestMeta.dueDate,
        requestedAt: requestMeta.requestedAt,
        requestedBy: requestMeta.requestedBy,
        requestCount: requestMeta.requestCount,
        requestInstructions: requestMeta.instructions,
      };
    });

    const merged = new Map();

    const mergeType = (item) => {
      const key = normalize(item?.name);
      if (!key) return;

      const previous = merged.get(key) || {};
      const aliases = Array.from(
        new Set(
          [
            ...(previous.aliases || []),
            ...(item.aliases || []),
            item.name,
          ].filter(Boolean)
        )
      );

      merged.set(key, {
        stage: "Application",
        priority: "Conditional",
        description: "Additional student document.",
        expiryTracking: false,
        ...previous,
        ...item,
        aliases,
      });
    };

    DEFAULT_DOCUMENT_TYPES.forEach(mergeType);
    customTypes.forEach(mergeType);
    persistentTypes.forEach(mergeType);

    documents.forEach((document) => {
      const base = resolveBaseType(document);
      const key = normalize(base);

      if (base && !merged.has(key)) {
        mergeType({
          name: base,
          group: document.document_category || "Custom",
          stage: "Student-specific",
          priority: "Conditional",
          description:
            "Existing document type discovered from this student's stored records.",
          aliases: [base],
        });
      }
    });

    return Array.from(merged.values()).sort((a, b) => {
      const aGroup = DOCUMENT_GROUP_ORDER.indexOf(a.group);
      const bGroup = DOCUMENT_GROUP_ORDER.indexOf(b.group);
      const safeAGroup = aGroup === -1 ? DOCUMENT_GROUP_ORDER.length : aGroup;
      const safeBGroup = bGroup === -1 ? DOCUMENT_GROUP_ORDER.length : bGroup;

      if (safeAGroup !== safeBGroup) return safeAGroup - safeBGroup;

      const priorityOrder = {
        core: 0,
        common: 1,
        conditional: 2,
        "post arrival": 3,
      };

      const aPriority =
        priorityOrder[normalize(a.priority)] ?? priorityOrder.conditional;
      const bPriority =
        priorityOrder[normalize(b.priority)] ?? priorityOrder.conditional;

      if (aPriority !== bPriority) return aPriority - bPriority;
      return String(a.name).localeCompare(String(b.name));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTypes, documents, requirements]);

  const documentGroups = useMemo(() => {
    const discoveredGroups = Array.from(
      new Set(documentTypes.map((item) => item.group).filter(Boolean))
    );

    return discoveredGroups.sort((a, b) => {
      const aIndex = DOCUMENT_GROUP_ORDER.indexOf(a);
      const bIndex = DOCUMENT_GROUP_ORDER.indexOf(b);
      const safeA = aIndex === -1 ? DOCUMENT_GROUP_ORDER.length : aIndex;
      const safeB = bIndex === -1 ? DOCUMENT_GROUP_ORDER.length : bIndex;

      if (safeA !== safeB) return safeA - safeB;
      return String(a).localeCompare(String(b));
    });
  }, [documentTypes]);

  const groupedDocuments = useMemo(() => {
    const groups = new Map();

    documentTypes.forEach((type) => {
      groups.set(type.name, {
        ...type,
        files: [],
      });
    });

    documents.forEach((document) => {
      const base = resolveBaseType(document);

      if (!groups.has(base)) {
        groups.set(base, {
          name: base,
          group: "Custom",
          aliases: [base],
          files: [],
        });
      }

      groups.get(base).files.push(document);
    });

    return Array.from(groups.values()).map((block) => ({
      ...block,
      files: [...block.files].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, documentTypes]);

  const documentStages = useMemo(() => {
    const discovered = Array.from(
      new Set(documentTypes.map((item) => item.stage).filter(Boolean))
    );

    return discovered.sort((a, b) => {
      const aIndex = DOCUMENT_STAGE_ORDER.indexOf(a);
      const bIndex = DOCUMENT_STAGE_ORDER.indexOf(b);
      const safeA = aIndex === -1 ? DOCUMENT_STAGE_ORDER.length : aIndex;
      const safeB = bIndex === -1 ? DOCUMENT_STAGE_ORDER.length : bIndex;

      if (safeA !== safeB) return safeA - safeB;
      return String(a).localeCompare(String(b));
    });
  }, [documentTypes]);

  const filteredBlocks = useMemo(() => {
    const query = normalize(search);

    const attentionScore = (block) => {
      const currentFiles = block.activeFiles || [];
      const hasRejected = currentFiles.some(
        (file) => normalize(file.status) === "rejected"
      );
      const hasReview = currentFiles.some(
        (file) => normalize(file.status || "received") === "received"
      );
      const hasVerified = currentFiles.some(
        (file) => normalize(file.status) === "verified"
      );
      const isStudentRequired =
        Boolean(block.requirementId) && Boolean(block.required);
      const isCore = normalize(block.priority) === "core";
      const isMissing = currentFiles.length === 0;

      if (hasRejected) return 0;
      if (isMissing && isStudentRequired) return 1;
      if (hasReview) return 2;
      if (isMissing && isCore) return 3;
      if (currentFiles.length > 0 && !hasVerified) return 4;
      if (hasVerified) return 5;
      return 6;
    };

    return groupedDocuments
      .map((block) => {
        const allFiles = block.files;
        const visibleFiles = allFiles.filter((file) =>
          showDeleted ? Boolean(file.is_deleted) : !file.is_deleted
        );
        const activeFiles = visibleFiles.filter(
          (file) => normalize(file.status) !== "archived"
        );

        return {
          ...block,
          files: visibleFiles,
          activeFiles,
          hasAnyFiles: allFiles.length > 0,
        };
      })
      .filter((block) => {
        if (showDeleted && block.files.length === 0) return false;

        const groupMatch =
          groupFilter === "all" || block.group === groupFilter;
        if (!groupMatch) return false;

        const stageMatch =
          stageFilter === "all" || block.stage === stageFilter;
        if (!stageMatch) return false;

        const normalizedPriority = normalize(block.priority);

        // A search should never look "empty" merely because a focus scope is active.
        // Search therefore scans the complete permanent catalog automatically.
        const scopeMatch =
          Boolean(query) ||
          catalogScope === "complete" ||
          (catalogScope === "active"
            ? block.hasAnyFiles || Boolean(block.requirementId)
            : block.hasAnyFiles ||
              Boolean(block.requirementId) ||
              ["core", "common"].includes(normalizedPriority));

        if (!scopeMatch) return false;

        const currentFiles = block.activeFiles || [];
        const isStudentRequired =
          Boolean(block.requirementId) && Boolean(block.required);
        const isCore = normalizedPriority === "core";
        const isMissing = currentFiles.length === 0;
        const hasRejected = currentFiles.some(
          (file) => normalize(file.status) === "rejected"
        );
        const hasReview = currentFiles.some(
          (file) => normalize(file.status || "received") === "received"
        );

        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "deleted"
            ? block.files.some((file) => Boolean(file.is_deleted))
            : statusFilter === "requested"
            ? Boolean(block.requirementId)
            : statusFilter === "attention"
            ? hasRejected || hasReview || (isMissing && isStudentRequired)
            : statusFilter === "missing"
            ? isMissing && (isStudentRequired || isCore)
            : block.files.some(
                (file) =>
                  normalize(file.status || "received") === statusFilter
              ));

        if (!statusMatch) return false;
        if (!query) return true;

        const blockText = normalize(
          [
            block.name,
            block.group,
            block.stage,
            block.priority,
            block.description,
            ...block.files.flatMap((file) => [
              file.document_name,
              file.notes,
              getFileName(file),
              file.status,
            ]),
          ].join(" ")
        );

        return blockText.includes(query);
      })
      .sort((a, b) => {
        const attentionDifference = attentionScore(a) - attentionScore(b);
        if (attentionDifference !== 0) return attentionDifference;

        const aGroup = DOCUMENT_GROUP_ORDER.indexOf(a.group);
        const bGroup = DOCUMENT_GROUP_ORDER.indexOf(b.group);
        const safeAGroup =
          aGroup === -1 ? DOCUMENT_GROUP_ORDER.length : aGroup;
        const safeBGroup =
          bGroup === -1 ? DOCUMENT_GROUP_ORDER.length : bGroup;
        if (safeAGroup !== safeBGroup) return safeAGroup - safeBGroup;

        return String(a.name).localeCompare(String(b.name));
      });
  }, [
    catalogScope,
    groupFilter,
    groupedDocuments,
    search,
    showDeleted,
    stageFilter,
    statusFilter,
  ]);

  const filteredBlockGroups = useMemo(() => {
    const buckets = new Map();

    filteredBlocks.forEach((block) => {
      const groupName = block.group || "Custom";
      if (!buckets.has(groupName)) buckets.set(groupName, []);
      buckets.get(groupName).push(block);
    });

    return Array.from(buckets.entries())
      .map(([name, blocks]) => {
        const uploadedBlocks = blocks.filter(
          (block) => (block.activeFiles || []).length > 0
        ).length;
        const verifiedBlocks = blocks.filter((block) =>
          (block.activeFiles || []).some(
            (file) => normalize(file.status) === "verified"
          )
        ).length;
        const reviewBlocks = blocks.filter((block) =>
          (block.activeFiles || []).some(
            (file) => normalize(file.status || "received") === "received"
          )
        ).length;
        const rejectedBlocks = blocks.filter((block) =>
          (block.activeFiles || []).some(
            (file) => normalize(file.status) === "rejected"
          )
        ).length;
        const requiredBlocks = blocks.filter(
          (block) => Boolean(block.requirementId) && Boolean(block.required)
        ).length;
        const missingRequired = blocks.filter(
          (block) =>
            Boolean(block.requirementId) &&
            Boolean(block.required) &&
            (block.activeFiles || []).length === 0
        ).length;
        const progressBase = Math.max(uploadedBlocks, requiredBlocks);
        const completionRate = progressBase
          ? Math.min(100, Math.round((verifiedBlocks / progressBase) * 100))
          : 0;

        return {
          name,
          blocks,
          uploadedBlocks,
          verifiedBlocks,
          reviewBlocks,
          rejectedBlocks,
          requiredBlocks,
          missingRequired,
          completionRate,
        };
      })
      .sort((a, b) => {
        const aIndex = DOCUMENT_GROUP_ORDER.indexOf(a.name);
        const bIndex = DOCUMENT_GROUP_ORDER.indexOf(b.name);
        const safeA = aIndex === -1 ? DOCUMENT_GROUP_ORDER.length : aIndex;
        const safeB = bIndex === -1 ? DOCUMENT_GROUP_ORDER.length : bIndex;
        if (safeA !== safeB) return safeA - safeB;
        return String(a.name).localeCompare(String(b.name));
      });
  }, [filteredBlocks]);

  const counts = useMemo(() => {
    const summary = {
      total: 0,
      received: 0,
      verified: 0,
      rejected: 0,
      archived: 0,
      deleted: 0,
      expiring: 0,
    };

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    documents.forEach((document) => {
      if (document.is_deleted) {
        summary.deleted += 1;
        return;
      }

      summary.total += 1;

      if (document.expiry_date) {
        const expiry = new Date(document.expiry_date).getTime();
        if (!Number.isNaN(expiry) && expiry - now <= thirtyDays) {
          summary.expiring += 1;
        }
      }

      const status = normalize(document.status || "received");

      if (status === "verified") summary.verified += 1;
      else if (status === "rejected") summary.rejected += 1;
      else if (status === "archived") summary.archived += 1;
      else summary.received += 1;
    });

    return summary;
  }, [documents]);

  const requestStats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeRequirements = requirements.filter(
      (requirement) => normalize(requirement?.status || "active") === "active"
    );

    let missing = 0;
    let overdue = 0;
    let urgent = 0;

    activeRequirements.forEach((requirement) => {
      const meta = readRequirementMeta(requirement);
      const hasCurrentFile = documents.some(
        (document) =>
          !document?.is_deleted &&
          normalize(document?.status) !== "archived" &&
          normalize(resolveBaseType(document)) ===
            normalize(requirement?.document_name)
      );

      if (!hasCurrentFile && requirement?.required !== false) missing += 1;
      if (normalizeRequestPriority(meta.priority) === "urgent") urgent += 1;

      if (!hasCurrentFile && meta.dueDate) {
        const due = new Date(meta.dueDate);
        due.setHours(0, 0, 0, 0);
        if (!Number.isNaN(due.getTime()) && due.getTime() < now.getTime()) {
          overdue += 1;
        }
      }
    });

    return {
      active: activeRequirements.length,
      missing,
      overdue,
      urgent,
    };
  }, [documents, requirements]);

  const verifiedRate = counts.total
    ? Math.round((counts.verified / counts.total) * 100)
    : 0;

  const toggleBlock = (name) => {
    setExpandedBlocks((previous) => {
      const next = new Set(previous);

      if (next.has(name)) next.delete(name);
      else next.add(name);

      return next;
    });
  };

  const toggleGroup = (name) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandVisibleGroups = () => {
    setExpandedGroups(new Set(filteredBlockGroups.map((group) => group.name)));
  };

  const collapseVisibleGroups = () => {
    setExpandedGroups(new Set());
  };

  const uniqueDocumentName = (baseType, file, index) => {
    const sameTypeCount = documents.filter(
      (item) => normalize(resolveBaseType(item)) === normalize(baseType)
    ).length;

    if (sameTypeCount === 0 && index === 0) {
      return baseType;
    }

    return `${baseType} • ${file.name}`;
  };

  const insertDocumentRecord = async ({
    documentName,
    filePath,
    fileUrl,
    notes,
    status = "received",
    category = null,
    originalFileName = null,
    mimeType = null,
    fileSizeBytes = null,
    version = 1,
    replacedDocumentId = null,
  }) => {
    const payload = {
      student_id: studentId,
      student_type: studentType,
      document_name: documentName,
      document_category: category,
      status,
      file_path: filePath,
      file_url: fileUrl,
      original_file_name: originalFileName,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      version,
      replaced_document_id: replacedDocumentId,
      uploaded_by: actorId,
      notes,
      updated_at: new Date().toISOString(),
    };

    const result = await withTimeout(
      supabase
        .from("student_documents")
        .insert(payload)
        .select()
        .single(),
      "Document record creation timed out."
    );

    if (result.error) throw result.error;
    return result.data;
  };

  const updateDocumentRecord = async (id, patch) => {
    const payload = {
      ...patch,
      updated_at: new Date().toISOString(),
    };

    const current = documents.find(
      (item) => String(item.id) === String(id)
    );

    const optimisticRow = current
      ? { ...current, ...payload }
      : { id, ...payload };

    // Apply the next state immediately so a delayed network response never freezes
    // the Student Master File.
    safeSet(() => {
      setDocuments((previous) =>
        previous.map((item) =>
          String(item.id) === String(id) ? optimisticRow : item
        )
      );
    });

    const controller = new AbortController();
    let watchdog;

    try {
      const updatePromise = supabase
        .from("student_documents")
        .update(payload)
        .eq("id", id)
        .abortSignal(controller.signal);

      const result = await Promise.race([
        updatePromise,
        new Promise((resolve) => {
          watchdog = window.setTimeout(
            () => resolve({ __watchdog: true }),
            MUTATION_WATCHDOG_MS
          );
        }),
      ]);

      if (result?.__watchdog) {
        controller.abort();

        safeSet(() => {
          setSuccessMessage(
            "Document update submitted. Saved state is reconciling in the background."
          );
        });

        void notifyParent();
        return optimisticRow;
      }

      if (result?.error) throw result.error;
      return optimisticRow;
    } catch (updateError) {
      if (updateError?.name === "AbortError") {
        safeSet(() => {
          setSuccessMessage(
            "Document update submitted. Saved state is reconciling in the background."
          );
        });

        void notifyParent();
        return optimisticRow;
      }

      if (current) {
        safeSet(() => {
          setDocuments((previous) =>
            previous.map((item) =>
              String(item.id) === String(id) ? current : item
            )
          );
        });
      }

      throw updateError;
    } finally {
      if (watchdog) window.clearTimeout(watchdog);
    }
  };

  const uploadFiles = async (documentType, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !studentId || isSaving(`upload-${documentType}`)) return;

    const operationKey = `upload-${documentType}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    const createdRecords = [];
    const uploadedPaths = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const filePath = buildStoragePath(documentType, file);

        const uploadResult = await withTimeout(
          supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          }),
          `Upload timed out for ${file.name}.`
        );

        if (uploadResult.error) throw uploadResult.error;
        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        let recordName = uniqueDocumentName(documentType, file, index);

        try {
          const typeConfig = documentTypes.find(
            (item) => normalize(item.name) === normalize(documentType)
          );

          const record = await insertDocumentRecord({
            documentName: recordName,
            filePath,
            fileUrl: publicUrlData?.publicUrl || "",
            notes: `Uploaded file: ${file.name}`,
            category: typeConfig?.group || "Other",
            originalFileName: file.name,
            mimeType: file.type || null,
            fileSizeBytes: file.size || null,
            version: 1,
          });

          createdRecords.push(record);
        } catch (insertError) {
          const message = String(insertError?.message || "").toLowerCase();

          if (
            message.includes("duplicate") ||
            message.includes("unique") ||
            message.includes("already exists")
          ) {
            recordName = `${documentType} • ${Date.now()} • ${file.name}`;

            const typeConfig = documentTypes.find(
              (item) => normalize(item.name) === normalize(documentType)
            );

            const retryRecord = await insertDocumentRecord({
              documentName: recordName,
              filePath,
              fileUrl: publicUrlData?.publicUrl || "",
              notes: `Uploaded file: ${file.name}`,
              category: typeConfig?.group || "Other",
              originalFileName: file.name,
              mimeType: file.type || null,
              fileSizeBytes: file.size || null,
              version: 1,
            });

            createdRecords.push(retryRecord);
          } else {
            throw insertError;
          }
        }
      }

      safeSet(() => {
        setDocuments((previous) => [...createdRecords, ...previous]);
        setExpandedBlocks((previous) => new Set(previous).add(documentType));
        setSuccessMessage(
          `${createdRecords.length} file${
            createdRecords.length === 1 ? "" : "s"
          } uploaded to ${documentType}.`
        );
      });

      void createTimelineEvent({
        eventType: "documents_uploaded",
        title: "Documents Uploaded",
        description: `${createdRecords.length} file(s) uploaded to ${documentType}.`,
        newValue: documentType,
      });

      createdRecords.forEach((record) => {
        void createDocumentEvent({
          documentId: record.id,
          eventType: "uploaded",
          eventLabel: "Document uploaded",
          newStatus: record.status || "received",
          newNotes: record.notes || null,
          metadata: {
            document_type: documentType,
            file_name: record.original_file_name || getFileName(record),
            version: record.version || 1,
            category: record.document_category || null,
          },
        });
      });

      void notifyParent();
    } catch (uploadError) {
      // Remove orphaned storage objects that did not get a DB record.
      const recordedPaths = new Set(createdRecords.map((item) => item.file_path));
      const orphanedPaths = uploadedPaths.filter(
        (path) => !recordedPaths.has(path)
      );

      if (orphanedPaths.length) {
        supabase.storage.from(STORAGE_BUCKET).remove(orphanedPaths);
      }

      safeSet(() => {
        setError(uploadError.message || "Document upload failed.");
      });

      await loadDocuments();
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const replaceFile = async (document, file) => {
    if (!document?.id || !file || !studentId || isSaving(`replace-${document.id}`)) return;

    const operationKey = `replace-${document.id}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    try {
      const baseType = resolveBaseType(document);

      // Preserve history: archive the old DB row instead of overwriting it.
      const archivedAt = new Date().toISOString();

      const archived = await updateDocumentRecord(document.id, {
        status: "archived",
        archived_at: archivedAt,
        notes: `${document.notes || ""}${
          document.notes ? " " : ""
        }Archived during replacement on ${new Date().toLocaleDateString("en-GB")}.`,
      });

      const filePath = buildStoragePath(baseType, file);

      const uploadResult = await withTimeout(
        supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        }),
        "Replacement upload timed out."
      );

      if (uploadResult.error) throw uploadResult.error;

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const nextVersion = Number(document.version || 1) + 1;

      const replacementRecord = await insertDocumentRecord({
        documentName: `${baseType} • ${file.name}`,
        filePath,
        fileUrl: publicUrlData?.publicUrl || "",
        notes: `Replacement for ${getFileName(document)}.`,
        category: document.document_category || resolveBaseType(document),
        originalFileName: file.name,
        mimeType: file.type || null,
        fileSizeBytes: file.size || null,
        version: nextVersion,
        replacedDocumentId: document.id,
      });

      safeSet(() => {
        setDocuments((previous) => [
          replacementRecord,
          ...previous.map((item) =>
            String(item.id) === String(document.id) ? archived : item
          ),
        ]);

        setSuccessMessage(
          `${getFileName(document)} archived and replacement uploaded.`
        );
      });

      void createTimelineEvent({
        eventType: "document_replaced",
        title: "Document Replaced",
        description: `${baseType} was replaced. Previous file retained as archived history.`,
        newValue: baseType,
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "replaced",
        eventLabel: "Document replaced",
        previousStatus: document.status || "received",
        newStatus: "archived",
        previousNotes: document.notes || null,
        newNotes: archived.notes || null,
        metadata: {
          replacement_document_id: replacementRecord.id,
          old_version: document.version || 1,
          new_version: replacementRecord.version || nextVersion,
        },
      });

      void createDocumentEvent({
        documentId: replacementRecord.id,
        eventType: "replacement_uploaded",
        eventLabel: "Replacement uploaded",
        newStatus: replacementRecord.status || "received",
        newNotes: replacementRecord.notes || null,
        metadata: {
          replaces_document_id: document.id,
          version: replacementRecord.version || nextVersion,
        },
      });

      void notifyParent();
    } catch (replaceError) {
      safeSet(() => {
        setError(replaceError.message || "Replacement failed.");
      });

      await loadDocuments();
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const registerUndo = ({
    document,
    previousStatus,
    previousNotes,
    previousIsDeleted = document?.is_deleted || false,
    previousDeletedAt = document?.deleted_at || null,
    actionLabel,
  }) => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }

    setUndoAction({
      documentId: document.id,
      documentName: getFileName(document),
      previousStatus,
      previousNotes,
      previousIsDeleted,
      previousDeletedAt,
      actionLabel,
    });

    undoTimerRef.current = window.setTimeout(() => {
      setUndoAction(null);
      undoTimerRef.current = null;
    }, 12000);
  };

  const undoLastAction = async () => {
    if (!undoAction?.documentId) return;

    const currentDocument = documents.find(
      (item) => String(item.id) === String(undoAction.documentId)
    );

    if (!currentDocument) {
      setUndoAction(null);
      return;
    }

    const operationKey = `status-${currentDocument.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const restored = await updateDocumentRecord(currentDocument.id, {
        status: undoAction.previousStatus || "received",
        notes: undoAction.previousNotes || "",
        is_deleted: Boolean(undoAction.previousIsDeleted),
        deleted_at: undoAction.previousDeletedAt || null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(currentDocument.id) ? restored : item
          )
        );

        setSuccessMessage(
          `${undoAction.documentName} restored to ${undoAction.previousStatus || "received"}.`
        );
        setUndoAction(null);
      });

      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }

      void createTimelineEvent({
        eventType: "document_action_undone",
        title: "Document Action Undone",
        description: `${undoAction.actionLabel || "Document status change"} was undone for ${currentDocument.document_name}.`,
        newValue: undoAction.previousStatus || "received",
      });

      void createDocumentEvent({
        documentId: currentDocument.id,
        eventType: "action_undone",
        eventLabel: `${undoAction.actionLabel || "Status change"} undone`,
        previousStatus: currentDocument.status || null,
        newStatus: undoAction.previousStatus || "received",
        previousNotes: currentDocument.notes || null,
        newNotes: undoAction.previousNotes || null,
      });

      void notifyParent();
    } catch (undoError) {
      safeSet(() => {
        setError(undoError.message || "Undo failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const openNotificationPreview = async (preview, execute) => {
    if (!preview) return execute();

    setError("");

    // Open the UI immediately. The signed server token is prepared in the
    // background so a slow network never makes the Admin action feel frozen.
    setPendingNotification({
      preview,
      execute,
      previewToken: null,
      expiresAt: null,
      preparing: Boolean(preview.sendable),
      preparationError: "",
    });

    if (!preview.sendable) return null;

    void prepareStudentNotification(preview)
      .then((prepared) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                ...prepared,
                preparing: false,
                preparationError: "",
              }
            : current
        );
      })
      .catch((previewError) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                preparing: false,
                preparationError:
                  previewError?.message ||
                  "Notification security preparation failed. The document status was not changed.",
              }
            : current
        );
      });

    return null;
  };

  const confirmPendingNotification = async (confirmationText = "") => {
    const pending = pendingNotification;
    if (
      !pending ||
      notificationBusy ||
      pending.preparing ||
      pending.preparationError
    ) return;

    setNotificationBusy(true);
    setError("");

    try {
      const result = await pending.execute();
      if (!result) return;

      setPendingNotification(null);

      if (pending.preview.sendable) {
        const delivery = await sendPreparedStudentNotification({
          preview: pending.preview,
          previewToken: pending.previewToken,
          confirmationText,
        });
        setSuccessMessage(delivery.communicationWarning || "Document status updated and student email sent safely.");
      } else {
        setSuccessMessage("Document status updated. No email was sent because the student has no email address.");
      }

    } catch (notificationError) {
      setError(notificationError?.message || "The document status changed, but the student email could not be sent. Review Communication OS before retrying.");
    } finally {
      setNotificationBusy(false);
    }
  };

  const syncLinkedApplicationRequirements = async ({
    document,
    nextStatus,
    previousStatus = "",
  }) => {
    if (!document?.id || !studentId) {
      return { count: 0, action: null, warning: "" };
    }

    const normalizedNextStatus = normalize(nextStatus);
    const normalizedPreviousStatus = normalize(previousStatus);

    const targetRequirementStatus =
      normalizedNextStatus === "verified"
        ? "completed"
        : normalizedNextStatus === "rejected" ||
          (normalizedNextStatus === "received" &&
            ["verified", "rejected"].includes(normalizedPreviousStatus))
        ? "pending"
        : null;

    if (!targetRequirementStatus) {
      return { count: 0, action: null, warning: "" };
    }

    try {
      let applicationsResult = await supabase
        .from("student_applications")
        .select("id")
        .eq("student_id", studentId)
        .eq("student_type", studentType)
        .limit(200);

      if (applicationsResult.error) {
        applicationsResult = await supabase
          .from("student_applications")
          .select("id")
          .eq("student_id", studentId)
          .limit(200);
      }

      if (applicationsResult.error) throw applicationsResult.error;

      const applicationIds = (applicationsResult.data || [])
        .map((application) => application.id)
        .filter(Boolean);

      if (!applicationIds.length) {
        return {
          count: 0,
          action: targetRequirementStatus,
          warning: "",
        };
      }

      const requirementsResult = await supabase
        .from("student_application_requirements")
        .select("*")
        .in("application_id", applicationIds)
        .eq("requirement_type", "document")
        .limit(500);

      if (requirementsResult.error) throw requirementsResult.error;

      const documentNames = new Set(
        [
          document.document_name,
          resolveBaseType(document),
          getFileName(document),
        ]
          .map((value) => normalize(value))
          .filter(Boolean)
      );

      const matchedRequirements = (requirementsResult.data || []).filter(
        (requirement) => {
          const title = normalize(requirement.title);
          if (!title || !documentNames.has(title)) return false;

          const currentStatus = normalize(requirement.status || "pending");

          if (targetRequirementStatus === "completed") {
            return currentStatus !== "completed";
          }

          return currentStatus === "completed";
        }
      );

      if (!matchedRequirements.length) {
        return {
          count: 0,
          action: targetRequirementStatus,
          warning: "",
        };
      }

      const nowIso = new Date().toISOString();
      const requirementIds = matchedRequirements.map(
        (requirement) => requirement.id
      );

      const patch =
        targetRequirementStatus === "completed"
          ? {
              status: "completed",
              completed_at: nowIso,
              updated_at: nowIso,
            }
          : {
              status: "pending",
              completed_at: null,
              updated_at: nowIso,
            };

      const { error: updateError } = await supabase
        .from("student_application_requirements")
        .update(patch)
        .in("id", requirementIds);

      if (updateError) throw updateError;

      const eventRows = matchedRequirements.map((requirement) => ({
        student_id: Number(studentId),
        student_type: studentType,
        application_id: requirement.application_id,
        event_type:
          targetRequirementStatus === "completed"
            ? "document_requirement_auto_completed"
            : "document_requirement_auto_reopened",
        event_label:
          targetRequirementStatus === "completed"
            ? "Document requirement completed automatically"
            : "Document requirement reopened automatically",
        old_value: requirement.status || "pending",
        new_value: targetRequirementStatus,
        metadata: {
          requirement_id: requirement.id,
          requirement_title: requirement.title,
          document_id: document.id,
          document_name:
            document.document_name || resolveBaseType(document) || null,
        },
      }));

      const timelineRows = matchedRequirements.map((requirement) => ({
        student_id: Number(studentId),
        student_type: studentType,
        application_id: String(requirement.application_id),
        event_type:
          targetRequirementStatus === "completed"
            ? "application_document_requirement_completed"
            : "application_document_requirement_reopened",
        title:
          targetRequirementStatus === "completed"
            ? "Application Document Requirement Completed"
            : "Application Document Requirement Reopened",
        description:
          targetRequirementStatus === "completed"
            ? `${requirement.title} completed automatically after the matching document was verified.`
            : `${requirement.title} reopened because the matching document requires another review or upload.`,
        old_value: requirement.status || "pending",
        new_value: targetRequirementStatus,
      }));

      void supabase
        .from("student_application_events")
        .insert(eventRows)
        .then(({ error: eventError }) => {
          if (eventError) {
            console.warn(
              "Linked application requirement event logging failed:",
              eventError
            );
          }
        });

      void supabase
        .from("student_application_timeline")
        .insert(timelineRows)
        .then(({ error: timelineError }) => {
          if (timelineError) {
            console.warn(
              "Linked application requirement timeline logging failed:",
              timelineError
            );
          }
        });

      return {
        count: matchedRequirements.length,
        action: targetRequirementStatus,
        warning: "",
      };
    } catch (bridgeError) {
      console.warn(
        "Document → application requirement bridge failed:",
        bridgeError
      );

      return {
        count: 0,
        action: targetRequirementStatus,
        warning:
          "Document status saved, but the linked application requirement could not be synchronized automatically.",
      };
    }
  };

  const performChangeStatus = async (document, status, reason = "") => {
    if (!document?.id || isSaving(`status-${document.id}`)) return;

    const operationKey = `status-${document.id}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    try {
      const notes =
        status === "rejected" && reason
          ? `Rejected: ${reason}`
          : document.notes || `${document.document_name} marked ${status}.`;

      const nowIso = new Date().toISOString();

      const statusPatch = {
        status,
        notes,
      };

      if (status === "verified") {
        statusPatch.verified_by = actorId;
        statusPatch.verified_at = nowIso;
        statusPatch.rejected_by = null;
        statusPatch.rejected_at = null;
        statusPatch.rejection_reason = null;
      } else if (status === "rejected") {
        statusPatch.rejected_by = actorId;
        statusPatch.rejected_at = nowIso;
        statusPatch.rejection_reason = reason || null;
        statusPatch.verified_by = null;
        statusPatch.verified_at = null;
      } else if (status === "archived") {
        statusPatch.archived_at = nowIso;
      } else if (status === "received") {
        statusPatch.archived_at = null;

        if (normalize(document.status) === "verified") {
          statusPatch.verified_by = null;
          statusPatch.verified_at = null;
        }

        if (normalize(document.status) === "rejected") {
          statusPatch.rejected_by = null;
          statusPatch.rejected_at = null;
          statusPatch.rejection_reason = null;
        }
      }

      const saved = await updateDocumentRecord(document.id, statusPatch);

      const applicationRequirementSync =
        await syncLinkedApplicationRequirements({
          document: saved,
          nextStatus: status,
          previousStatus: document.status || "received",
        });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? saved : item
          )
        );

        const linkedMessage = applicationRequirementSync.count
          ? applicationRequirementSync.action === "completed"
            ? ` · ${applicationRequirementSync.count} linked application requirement${
                applicationRequirementSync.count === 1 ? "" : "s"
              } completed`
            : ` · ${applicationRequirementSync.count} linked application requirement${
                applicationRequirementSync.count === 1 ? "" : "s"
              } reopened`
          : "";

        setSuccessMessage(
          `${getFileName(document)} marked ${status}${linkedMessage}.${
            applicationRequirementSync.warning
              ? ` ${applicationRequirementSync.warning}`
              : ""
          }`
        );
      });

      registerUndo({
        document,
        previousStatus: document.status || "received",
        previousNotes: document.notes || "",
        actionLabel:
          status === "verified"
            ? "Verify"
            : status === "rejected"
            ? "Reject"
            : status === "archived"
            ? "Archive"
            : status === "received" && normalize(document.status) === "verified"
            ? "Unverify"
            : "Status change",
      });

      void createTimelineEvent({
        eventType: `document_${status}`,
        title: `Document ${status}`,
        description:
          status === "rejected" && reason
            ? `${document.document_name} rejected: ${reason}`
            : `${document.document_name} marked as ${status}.`,
        newValue: document.document_name,
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: `status_${status}`,
        eventLabel:
          status === "verified"
            ? "Document verified"
            : status === "rejected"
            ? "Document rejected"
            : status === "archived"
            ? "Document archived"
            : status === "received" && normalize(document.status) === "verified"
            ? "Document unverified"
            : status === "received" && normalize(document.status) === "rejected"
            ? "Returned to review"
            : "Document status changed",
        previousStatus: document.status || "received",
        newStatus: status,
        previousNotes: document.notes || null,
        newNotes: notes || null,
        reason: reason || null,
        metadata: {
          linked_application_requirements:
            applicationRequirementSync.count || 0,
          linked_requirement_action:
            applicationRequirementSync.action || null,
          linked_requirement_warning:
            applicationRequirementSync.warning || null,
        },
      });

      void notifyParent();
      return saved;
    } catch (statusError) {
      safeSet(() => {
        setError(statusError.message || "Document status update failed.");
      });
      return null;
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const changeStatus = async (document, status, reason = "") => {
    if (!document?.id) return;

    if (!["verified", "rejected"].includes(status)) {
      return performChangeStatus(document, status, reason);
    }

    const preview = buildStudentNotification({
      domain: "document",
      action: status,
      student,
      entity: document,
      previous: document,
      next: { ...document, status },
      reason,
      relatedType: "document",
      relatedId: document.id,
    });

    return openNotificationPreview(preview, () => performChangeStatus(document, status, reason));
  };

  const deleteDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const confirmed = window.confirm(
      `Move ${getFileName(document)} to recovery?\n\nThis is reversible. The physical file will not be removed yet.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const deletedAt = new Date().toISOString();

      const saved = await updateDocumentRecord(document.id, {
        is_deleted: true,
        deleted_at: deletedAt,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? saved : item
          )
        );
        setSuccessMessage(
          `${getFileName(document)} moved to recovery.`
        );
      });

      registerUndo({
        document,
        previousStatus: document.status || "received",
        previousNotes: document.notes || "",
        previousIsDeleted: Boolean(document.is_deleted),
        previousDeletedAt: document.deleted_at || null,
        actionLabel: "Move to recovery",
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "soft_deleted",
        eventLabel: "Moved to recovery",
        previousStatus: document.status || null,
        newStatus: document.status || null,
        metadata: { deleted_at: deletedAt },
      });

      void notifyParent();
    } catch (deleteError) {
      safeSet(() => {
        setError(deleteError.message || "Could not move document to recovery.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const restoreDeletedDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const restored = await updateDocumentRecord(document.id, {
        is_deleted: false,
        deleted_at: null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? restored : item
          )
        );
        setSuccessMessage(`${getFileName(document)} restored from recovery.`);
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "restored_from_recovery",
        eventLabel: "Restored from recovery",
        newStatus: document.status || "received",
      });

      void notifyParent();
    } catch (restoreError) {
      safeSet(() => setError(restoreError.message || "Restore failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const permanentlyDeleteDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const confirmed = window.confirm(
      `PERMANENTLY delete ${getFileName(document)}?\n\nThis removes the database record and attempts to remove the Storage object. This cannot be undone.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");

    try {
      if (document.file_path) {
        const removeResult = await withTimeout(
          supabase.storage.from(STORAGE_BUCKET).remove([document.file_path]),
          "Storage deletion timed out."
        );

        if (removeResult.error) {
          throw new Error(
            `Storage deletion blocked: ${removeResult.error.message}. Keep this file in Recovery until the Storage DELETE policy is configured.`
          );
        }
      }

      const result = await withTimeout(
        supabase.from("student_documents").delete().eq("id", document.id),
        "Permanent document deletion timed out."
      );

      if (result.error) throw result.error;

      safeSet(() => {
        setDocuments((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(document.id)
          )
        );
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(document.id);
          return next;
        });
        setSuccessMessage(`${getFileName(document)} permanently deleted.`);
      });

      void createDocumentEvent({
        documentId: null,
        eventType: "permanently_deleted",
        eventLabel: "Document permanently deleted",
        metadata: {
          deleted_document_id: document.id,
          document_name: document.document_name,
          file_path: document.file_path || null,
        },
      });

      void notifyParent();
    } catch (deleteError) {
      safeSet(() => {
        setError(deleteError.message || "Permanent deletion failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };


  const findRequirementByName = (documentName) =>
    requirements.find(
      (requirement) =>
        normalize(requirement?.document_name) === normalize(documentName)
    ) || null;

  const openDocumentRequest = (block = null) => {
    const typeConfig = block || null;
    const name = typeConfig?.name || "";
    const existingRequirement = name ? findRequirementByName(name) : null;
    const requestMeta = readRequirementMeta(existingRequirement || typeConfig || {});

    setRequestTarget(typeConfig);
    setRequestForm({
      documentName: name,
      required: existingRequirement?.required !== false,
      priority: requestMeta.priority || "normal",
      dueDate: requestMeta.dueDate
        ? String(requestMeta.dueDate).slice(0, 10)
        : "",
      instructions:
        requestMeta.instructions ||
        typeConfig?.description ||
        "Please upload a clear, complete and readable copy of this document.",
      verificationRequired:
        existingRequirement?.verification_required !== false,
      studentCanUpload: existingRequirement?.student_can_upload !== false,
      expiryTracking: Boolean(
        existingRequirement?.expiry_tracking || typeConfig?.expiryTracking
      ),
      notifyStudent: requestMeta.notifyStudent !== false,
    });
    setError("");
    setShowRequestCenter(true);
  };

  const resolveExistingRequirement = async (documentName) => {
    const local = findRequirementByName(documentName);
    if (local) return local;

    const strictResult = await supabase
      .from("student_document_requirements")
      .select("*")
      .eq("student_id", studentId)
      .eq("student_type", studentType)
      .eq("document_name", documentName)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!strictResult.error && strictResult.data?.[0]) {
      return strictResult.data[0];
    }

    const fallbackResult = await supabase
      .from("student_document_requirements")
      .select("*")
      .eq("student_id", studentId)
      .eq("document_name", documentName)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!fallbackResult.error && fallbackResult.data?.[0]) {
      return fallbackResult.data[0];
    }

    return null;
  };

  const persistDocumentRequest = async () => {
    const documentName = requestForm.documentName.trim();
    if (!studentId || !documentName) {
      setError("Choose a document before sending the request.");
      return null;
    }

    const operationKey = `request-${normalize(documentName)}`;
    if (isSaving(operationKey)) return null;

    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const typeConfig =
        documentTypes.find(
          (type) => normalize(type.name) === normalize(documentName)
        ) || {
          name: documentName,
          group: "Custom",
          stage: "Student-specific",
          expiryTracking: false,
        };

      const existingRequirement = await resolveExistingRequirement(documentName);
      const previousMeta = readRequirementMeta(existingRequirement || {});
      const nowIso = new Date().toISOString();
      const requestCount = existingRequirement
        ? Math.max(1, Number(previousMeta.requestCount || 1)) + 1
        : 1;
      const metadataNotes = buildRequirementNotes({
        instructions: requestForm.instructions,
        priority: requestForm.priority,
        dueDate: requestForm.dueDate,
        requestedAt: nowIso,
        requestedBy: actorId,
        requestCount,
        notifyStudent: requestForm.notifyStudent,
      });

      const corePayload = {
        student_id: Number(studentId),
        student_type: studentType,
        document_name: documentName,
        group_name: typeConfig.group || "Custom",
        required: Boolean(requestForm.required),
        verification_required: Boolean(requestForm.verificationRequired),
        expiry_tracking: Boolean(requestForm.expiryTracking),
        student_can_upload: Boolean(requestForm.studentCanUpload),
        counselor_can_upload: true,
        admin_only: false,
        status: "active",
      };

      const safePayload = {
        ...corePayload,
        notes: metadataNotes,
      };

      const richPayload = {
        ...safePayload,
        stage_name: typeConfig.stage || "Student-specific",
        instructions: requestForm.instructions.trim() || null,
        priority: normalizeRequestPriority(requestForm.priority),
        due_date: requestForm.dueDate || null,
        requested_at: nowIso,
        requested_by: actorId,
        request_count: requestCount,
        updated_at: nowIso,
      };

      const runMutation = async (payload) => {
        if (existingRequirement?.id) {
          return supabase
            .from("student_document_requirements")
            .update(payload)
            .eq("id", existingRequirement.id)
            .select("*")
            .single();
        }

        return supabase
          .from("student_document_requirements")
          .insert({
            ...payload,
            created_by: actorId,
          })
          .select("*")
          .single();
      };

      let result = await withTimeout(
        runMutation(richPayload),
        "Document request timed out."
      );

      if (result.error && isRequirementSchemaMismatch(result.error)) {
        result = await withTimeout(
          runMutation(safePayload),
          "Document request fallback timed out."
        );
      }

      if (result.error && isRequirementSchemaMismatch(result.error)) {
        result = await withTimeout(
          runMutation(corePayload),
          "Document request compatibility save timed out."
        );
      }

      if (result.error) throw result.error;

      const savedRequirement = {
        ...(result.data || {}),
        notes: result.data?.notes || metadataNotes,
        instructions:
          result.data?.instructions || requestForm.instructions.trim() || null,
        priority:
          result.data?.priority || normalizeRequestPriority(requestForm.priority),
        due_date: result.data?.due_date || requestForm.dueDate || null,
        requested_at: result.data?.requested_at || nowIso,
        requested_by: result.data?.requested_by || actorId,
        request_count: result.data?.request_count || requestCount,
      };

      safeSet(() => {
        setRequirements((previous) => {
          const exists = previous.some(
            (item) => String(item.id) === String(savedRequirement.id)
          );

          if (exists) {
            return previous.map((item) =>
              String(item.id) === String(savedRequirement.id)
                ? savedRequirement
                : item
            );
          }

          return [...previous, savedRequirement];
        });
        setExpandedBlocks((previous) =>
          new Set(previous).add(documentName)
        );
        setExpandedGroups((previous) =>
          new Set(previous).add(typeConfig.group || "Custom")
        );
        setCatalogScope("active");
        setStatusFilter("requested");
        setShowRequestCenter(false);
        setRequestTarget(null);
        setSuccessMessage(
          `${documentName} requested from the student${
            requestForm.dueDate ? ` · due ${formatDate(requestForm.dueDate)}` : ""
          }.`
        );
      });

      void createDocumentEvent({
        eventType: existingRequirement
          ? "requirement_requested_again"
          : "requirement_requested",
        eventLabel: existingRequirement
          ? "Document requested again"
          : "Document requested from student",
        reason: requestForm.instructions.trim() || null,
        metadata: {
          requirement_id: savedRequirement.id,
          document_name: documentName,
          priority: normalizeRequestPriority(requestForm.priority),
          due_date: requestForm.dueDate || null,
          required: Boolean(requestForm.required),
          verification_required: Boolean(requestForm.verificationRequired),
          request_count: requestCount,
        },
      });

      void createTimelineEvent({
        eventType: existingRequirement
          ? "document_requested_again"
          : "document_requested",
        title: existingRequirement
          ? "Document Requested Again"
          : "Document Requested",
        description: `${documentName} requested from the student${
          requestForm.dueDate ? ` with due date ${requestForm.dueDate}` : ""
        }.`,
        newValue: documentName,
      });

      void notifyParent();
      return savedRequirement;
    } catch (requestError) {
      safeSet(() => {
        setError(requestError?.message || "Document request could not be saved.");
      });
      return null;
    } finally {
      stopSaving(operationKey);
    }
  };

  const submitDocumentRequest = async () => {
    const documentName = requestForm.documentName.trim();
    if (!documentName) {
      setError("Choose a document before sending the request.");
      return;
    }

    const existingRequirement = await resolveExistingRequirement(documentName);
    const savedRequirement = await persistDocumentRequest();
    if (!savedRequirement || !requestForm.notifyStudent) return;

    let preview = null;

    try {
      preview = buildStudentNotification({
        domain: "document",
        action: existingRequirement ? "requested_again" : "requested",
        student,
        entity: {
          ...savedRequirement,
          id: savedRequirement.id,
          document_name: documentName,
          status: "requested",
        },
        previous: existingRequirement || null,
        next: {
          ...savedRequirement,
          document_name: documentName,
          status: "active",
          due_date: requestForm.dueDate || null,
          priority: normalizeRequestPriority(requestForm.priority),
          instructions: requestForm.instructions.trim(),
        },
        reason: requestForm.instructions.trim(),
        relatedType: "document_requirement",
        relatedId: savedRequirement.id,
      });
    } catch (previewError) {
      console.warn("Document request notification preview skipped:", previewError);
    }

    if (preview) {
      await openNotificationPreview(preview, async () => savedRequirement);
    }
  };

  const stopDocumentRequest = async () => {
    const documentName = requestForm.documentName.trim();
    const existingRequirement = await resolveExistingRequirement(documentName);
    if (!existingRequirement?.id) return;

    const confirmed = window.confirm(
      `Stop requesting ${documentName}?\n\nThe student will no longer see it as an active request. Existing uploaded files will remain in document history.`
    );
    if (!confirmed) return;

    const operationKey = `request-stop-${existingRequirement.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const { error: stopError } = await supabase
        .from("student_document_requirements")
        .update({ status: "inactive" })
        .eq("id", existingRequirement.id);

      if (stopError) throw stopError;

      safeSet(() => {
        setRequirements((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(existingRequirement.id)
          )
        );
        setShowRequestCenter(false);
        setRequestTarget(null);
        setSuccessMessage(`${documentName} request stopped.`);
      });

      void createDocumentEvent({
        eventType: "requirement_stopped",
        eventLabel: "Document request stopped",
        metadata: {
          requirement_id: existingRequirement.id,
          document_name: documentName,
        },
      });

      void createTimelineEvent({
        eventType: "document_request_stopped",
        title: "Document Request Stopped",
        description: `${documentName} is no longer an active student request.`,
        newValue: documentName,
      });

      void notifyParent();
    } catch (stopError) {
      safeSet(() => {
        setError(stopError?.message || "Document request could not be stopped.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const addCustomType = async () => {
    const name = customTypeName.trim();
    if (!name || !studentId) return;

    const alreadyExists = documentTypes.some(
      (type) => normalize(type.name) === normalize(name)
    );

    if (alreadyExists) {
      setError("That document type already exists.");
      return;
    }

    const operationKey = "add-document-type";
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_document_requirements")
          .insert({
            student_id: Number(studentId),
            student_type: studentType,
            document_name: name,
            group_name: customTypeGroup.trim() || "Custom",
            required: true,
            verification_required: true,
            expiry_tracking: false,
            student_can_upload: true,
            counselor_can_upload: true,
            admin_only: false,
            status: "active",
            created_by: actorId,
          })
          .select()
          .single(),
        "Document type creation timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) => [...previous, data]);
        setExpandedBlocks((previous) => new Set(previous).add(name));
        setCustomTypeName("");
        setCustomTypeGroup("Custom");
        setGroupFilter("all");
        setCatalogScope("active");
        setShowAddType(false);
        setSuccessMessage(`${name} document block permanently added.`);
      });

      void createDocumentEvent({
        eventType: "requirement_created",
        eventLabel: "Document requirement created",
        metadata: {
          requirement_id: data.id,
          document_name: name,
          group_name: data.group_name,
        },
      });
    } catch (requirementError) {
      safeSet(() => {
        setError(
          requirementError.message ||
            "Could not permanently create this document type."
        );
      });
    } finally {
      stopSaving(operationKey);
    }
  };


  const openMetadataEditor = (document) => {
    setMetadataTarget(document);
    setMetadataForm({
      document_category:
        document.document_category || resolveBaseType(document) || "",
      issue_date: document.issue_date || "",
      expiry_date: document.expiry_date || "",
      notes: document.notes || "",
    });
  };

  const saveMetadata = async () => {
    if (!metadataTarget?.id) return;

    const operationKey = `metadata-${metadataTarget.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const saved = await updateDocumentRecord(metadataTarget.id, {
        document_category: metadataForm.document_category.trim() || null,
        issue_date: metadataForm.issue_date || null,
        expiry_date: metadataForm.expiry_date || null,
        notes: metadataForm.notes.trim() || null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(metadataTarget.id) ? saved : item
          )
        );

        // Keep the inspector open and refresh it with the saved row.
        // This prevents the confusing "save -> modal closes -> old-looking state" flow.
        setMetadataTarget(saved);
        setMetadataForm({
          document_category: saved.document_category || "",
          issue_date: saved.issue_date || "",
          expiry_date: saved.expiry_date || "",
          notes: saved.notes || "",
        });

        setSuccessMessage(`${getFileName(saved)} details saved.`);
      });

      void createDocumentEvent({
        documentId: metadataTarget.id,
        eventType: "metadata_updated",
        eventLabel: "Document metadata updated",
        previousNotes: metadataTarget.notes || null,
        newNotes: saved.notes || null,
        metadata: {
          document_category: saved.document_category || null,
          issue_date: saved.issue_date || null,
          expiry_date: saved.expiry_date || null,
        },
      });

      void notifyParent();
    } catch (metadataError) {
      safeSet(() => {
        setError(metadataError.message || "Document details update failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const toggleSelected = (documentId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const performBulkChangeStatus = async (status) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    const selectedDocuments = documents.filter(
      (item) => ids.includes(item.id) && !item.is_deleted
    );

    if (!selectedDocuments.length) return;

    const operationKey = `bulk-${status}`;
    startSaving(operationKey);
    setError("");

    const nowIso = new Date().toISOString();
    const patch = { status };

    if (status === "verified") {
      patch.verified_by = actorId;
      patch.verified_at = nowIso;
      patch.rejected_by = null;
      patch.rejected_at = null;
      patch.rejection_reason = null;
    }

    if (status === "archived") {
      patch.archived_at = nowIso;
    }

    if (status === "received") {
      patch.archived_at = null;
      patch.verified_by = null;
      patch.verified_at = null;
      patch.rejected_by = null;
      patch.rejected_at = null;
      patch.rejection_reason = null;
    }

    try {
      const { error: bulkError } = await withTimeout(
        supabase
          .from("student_documents")
          .update({
            ...patch,
            updated_at: nowIso,
          })
          .in("id", ids),
        "Bulk document update timed out."
      );

      if (bulkError) throw bulkError;

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            ids.includes(item.id)
              ? { ...item, ...patch, updated_at: nowIso }
              : item
          )
        );
        setSuccessMessage(
          `${selectedDocuments.length} document${
            selectedDocuments.length === 1 ? "" : "s"
          } moved to ${status}.`
        );
        clearSelection();
      });

      selectedDocuments.forEach((document) => {
        void createDocumentEvent({
          documentId: document.id,
          eventType: `bulk_status_${status}`,
          eventLabel: `Bulk status changed to ${status}`,
          previousStatus: document.status || null,
          newStatus: status,
        });
      });

      void notifyParent();
      return true;
    } catch (bulkError) {
      safeSet(() => {
        setError(bulkError.message || "Bulk update failed.");
      });
      return false;
    } finally {
      stopSaving(operationKey);
    }
  };

  const bulkChangeStatus = async (status) => {
    const ids = Array.from(selectedIds);
    const selectedDocuments = documents.filter((item) => ids.includes(item.id) && !item.is_deleted);

    if (!selectedDocuments.length) return;
    if (status !== "verified") return performBulkChangeStatus(status);

    const preview = buildStudentNotification({
      domain: "document",
      action: "verified",
      student,
      entity: selectedDocuments[0] || {},
      items: selectedDocuments,
      relatedType: "document",
      relatedId: null,
    });

    return openNotificationPreview(preview, () => performBulkChangeStatus(status));
  };

  const bulkSoftDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    const confirmed = window.confirm(
      `Move ${ids.length} selected document${ids.length === 1 ? "" : "s"} to recovery?`
    );
    if (!confirmed) return;

    const operationKey = "bulk-delete";
    startSaving(operationKey);
    setError("");

    const deletedAt = new Date().toISOString();

    try {
      const { error: bulkError } = await withTimeout(
        supabase
          .from("student_documents")
          .update({
            is_deleted: true,
            deleted_at: deletedAt,
            updated_at: deletedAt,
          })
          .in("id", ids),
        "Bulk recovery action timed out."
      );

      if (bulkError) throw bulkError;

      const affectedDocuments = documents.filter((item) =>
        ids.includes(item.id)
      );

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            ids.includes(item.id)
              ? { ...item, is_deleted: true, deleted_at: deletedAt }
              : item
          )
        );
        setSuccessMessage(`${ids.length} document(s) moved to recovery.`);
        clearSelection();
      });

      affectedDocuments.forEach((document) => {
        void createDocumentEvent({
          documentId: document.id,
          eventType: "bulk_soft_deleted",
          eventLabel: "Moved to recovery in bulk",
          previousStatus: document.status || null,
          newStatus: document.status || null,
          metadata: { deleted_at: deletedAt },
        });
      });

      void notifyParent();
    } catch (bulkError) {
      safeSet(() => setError(bulkError.message || "Bulk recovery action failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const bulkDownload = () => {
    const selectedDocuments = documents.filter(
      (item) =>
        selectedIds.has(item.id) &&
        !item.is_deleted &&
        Boolean(item.file_url)
    );

    if (!selectedDocuments.length) {
      setError("No downloadable files are selected.");
      return;
    }

    selectedDocuments.forEach((item, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = item.file_url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.download = getFileName(item);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 150);
    });

    setSuccessMessage(
      `${selectedDocuments.length} download${
        selectedDocuments.length === 1 ? "" : "s"
      } started.`
    );
  };

  const openDocument = (item) => {
    if (!item?.file_url) return;
    window.open(item.file_url, "_blank", "noopener,noreferrer");
  };

  const downloadDocument = (item) => {
    if (!item?.file_url) return;

    const link = document.createElement("a");
    link.href = item.file_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = getFileName(item);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusClass = (status, isDeleted = false) => {
    if (isDeleted) {
      return "border-slate-500 bg-slate-100 text-slate-800";
    }

    switch (normalize(status)) {
      case "verified":
        return "border-emerald-400 bg-emerald-50 text-emerald-800";
      case "rejected":
        return "border-red-400 bg-red-50 text-red-800";
      case "archived":
        return "border-slate-400 bg-slate-100 text-slate-700";
      default:
        return "border-blue-400 bg-blue-50 text-blue-800";
    }
  };

  const renderDocumentBlock = (block) => {
    const isExpanded = expandedBlocks.has(block.name);
    const verified = block.files.filter(
      (file) => normalize(file.status) === "verified"
    ).length;
    const rejected = block.files.filter(
      (file) => normalize(file.status) === "rejected"
    ).length;
    const archived = block.files.filter(
      (file) => normalize(file.status) === "archived"
    ).length;
    const isUploading = isSaving(`upload-${block.name}`);
    const latestFile = block.files[0] || null;
    const priorityKey = normalize(block.priority);
    const studentRequired =
      Boolean(block.requirementId) && Boolean(block.required);
    const hasActiveRequest = Boolean(block.requirementId);
    const requestPriority = normalizeRequestPriority(block.requestPriority);
    const requestDueDate = block.requestDueDate || "";
    const requestCount = Math.max(1, Number(block.requestCount || 1));
    const priorityLabel = studentRequired
      ? "Required for student"
      : block.requirementId
      ? "Student-specific"
      : block.priority || "Catalog";
    const priorityClass = studentRequired
      ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
      : priorityKey === "core"
      ? "border-red-300 bg-red-50 text-red-700"
      : priorityKey === "common"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : priorityKey === "post arrival"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-slate-300 bg-slate-50 text-slate-600";

    const currentFiles = block.activeFiles || block.files.filter(
      (file) => normalize(file.status) !== "archived"
    );
    const hasRejected = currentFiles.some(
      (file) => normalize(file.status) === "rejected"
    );
    const hasReview = currentFiles.some(
      (file) => normalize(file.status || "received") === "received"
    );
    const hasVerified = currentFiles.some(
      (file) => normalize(file.status) === "verified"
    );
    const isMissing = currentFiles.length === 0;
    const operationalLabel = hasRejected
      ? "Rejected · Action needed"
      : hasReview
      ? "Awaiting review"
      : hasVerified
      ? "Verified"
      : isMissing && studentRequired
      ? "Required · Missing"
      : isMissing && priorityKey === "core"
      ? "Essential · Not uploaded"
      : currentFiles.length > 0
      ? "Uploaded"
      : "Catalog reference";
    const operationalClass = hasRejected
      ? "border-red-400 bg-red-50 text-red-800"
      : hasReview
      ? "border-blue-400 bg-blue-50 text-blue-800"
      : hasVerified
      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
      : isMissing && (studentRequired || priorityKey === "core")
      ? "border-orange-400 bg-[#FFF4E8] text-orange-800"
      : "border-slate-300 bg-slate-50 text-slate-600";
    const operationalBorderClass = hasRejected
      ? "border-red-400"
      : hasReview
      ? "border-blue-400"
      : hasVerified
      ? "border-emerald-400"
      : isMissing && (studentRequired || priorityKey === "core")
      ? "border-[#FF9B57]"
      : "border-[#C9D7E6]";

    return (
      <article
        key={block.name}
        className={`min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] bg-white shadow-[0_8px_22px_rgba(18,56,101,0.05)] transition hover:border-[#FF5A0A] hover:shadow-[0_12px_28px_rgba(18,56,101,0.08)] ${operationalBorderClass}`}
      >
        <div className="flex min-w-0 flex-col gap-3 border-b-2 border-[#FFB37A] bg-[#FFF8EF] p-3.5 lg:flex-row lg:items-center">
          <button
            type="button"
            onClick={() => toggleBlock(block.name)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-orange-700">
              <FolderOpen size={19} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="break-words text-base font-black text-[#10233F]">
                  {block.name}
                </span>

                {viewMode === "detailed" ? (
                  <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] text-slate-600">
                    {block.group}
                  </span>
                ) : null}

                <span className="rounded-full border border-[#B8CCE2] bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] text-[#123865]">
                  {block.stage || "Application"}
                </span>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] ${priorityClass}`}
                >
                  {priorityLabel}
                </span>

                {viewMode === "detailed" && block.expiryTracking ? (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] text-amber-800">
                    Expiry tracked
                  </span>
                ) : null}


                {hasActiveRequest ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] ${getRequestPriorityClasses(
                      requestPriority
                    )}`}
                  >
                    {requestPriority} request
                  </span>
                ) : null}

                {hasActiveRequest && requestDueDate ? (
                  <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] text-violet-700">
                    Due {formatDate(requestDueDate)}
                  </span>
                ) : null}

                {hasActiveRequest && requestCount > 1 ? (
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.09em] text-slate-600">
                    Requested ×{requestCount}
                  </span>
                ) : null}
              </span>

              {viewMode === "detailed" && block.description ? (
                <span className="mt-1.5 block max-w-5xl text-xs font-semibold leading-5 text-slate-600">
                  {block.description}
                </span>
              ) : null}

              <span className="mt-1.5 block text-[11px] font-bold text-slate-500">
                {block.files.length} file{block.files.length === 1 ? "" : "s"}
                {" · "}
                {verified} verified
                {rejected ? ` · ${rejected} rejected` : ""}
                {archived ? ` · ${archived} archived` : ""}
                {latestFile
                  ? ` · Last activity ${formatDate(
                      latestFile.updated_at || latestFile.created_at
                    )}`
                  : " · No upload yet"}
              </span>
            </span>

            {isExpanded ? (
              <ChevronDown size={18} className="shrink-0 text-slate-400" />
            ) : (
              <ChevronRight size={18} className="shrink-0 text-slate-400" />
            )}
          </button>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <span
              className={`inline-flex min-h-9 items-center rounded-xl border-2 px-3 text-[9px] font-black uppercase tracking-[0.08em] ${operationalClass}`}
            >
              {operationalLabel}
            </span>

            <button
              type="button"
              onClick={() => openDocumentRequest(block)}
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-[11px] font-black transition ${
                hasActiveRequest
                  ? "border-[#123865] bg-[#123865] text-white hover:bg-[#315B88]"
                  : "border-[#FF5A0A] bg-white text-orange-700 hover:bg-[#FFF4E8]"
              }`}
            >
              <Send size={14} />
              {hasActiveRequest
                ? hasRejected
                  ? "Request Again"
                  : "Edit Request"
                : "Request Student"}
            </button>

            <label
              className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-3 py-2 text-[11px] font-black text-white transition hover:bg-orange-600 ${
                isUploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {isUploading ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}

              {isUploading
                ? "Uploading..."
                : viewMode === "compact"
                ? "Add File"
                : "Upload Files"}

              <input
                type="file"
                multiple
                disabled={isUploading}
                className="hidden"
                onChange={(event) => {
                  uploadFiles(block.name, event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {isExpanded ? (
          <div className="border-t-2 border-orange-200 bg-[#FFF8EF] p-3 sm:p-4">
            {hasActiveRequest ? (
              <div className="mb-3 rounded-[1.2rem] border-2 border-[#123865] bg-white p-3.5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-800">
                        <BellRing size={12} /> Active Student Request
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${getRequestPriorityClasses(requestPriority)}`}>
                        {requestPriority} priority
                      </span>
                      {requestDueDate ? (
                        <span className="rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-violet-700">
                          Due {formatDate(requestDueDate)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-black text-[#10233F]">
                      {block.requestInstructions || block.description || "Student upload requested."}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      Student upload {block.studentCanUpload === false ? "disabled" : "enabled"}
                      {block.verificationRequired === false ? " · Verification optional" : " · Verification required"}
                      {` · Request #${requestCount}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDocumentRequest(block)}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 text-[10px] font-black text-white transition hover:bg-[#315B88]"
                  >
                    <Send size={13} /> Manage Request
                  </button>
                </div>
              </div>
            ) : null}

            {block.files.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-white p-6 text-center">
                <FilePlus2 size={26} className="mx-auto text-orange-400" />
                <p className="mt-2 text-sm font-black text-[#10233F]">
                  No files in this block yet
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Upload one file or many files together.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {block.files.map((document) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    getFileName={getFileName}
                    statusClass={statusClass}
                    busy={
                      isSaving(`status-${document.id}`) ||
                      isSaving(`replace-${document.id}`) ||
                      isSaving(`delete-${document.id}`)
                    }
                    saving={
                      isSaving(`status-${document.id}`) ||
                      isSaving(`replace-${document.id}`) ||
                      isSaving(`delete-${document.id}`)
                    }
                    onOpen={() => openDocument(document)}
                    onDownload={() => downloadDocument(document)}
                    onVerify={() => changeStatus(document, "verified")}
                    onUnverify={() => changeStatus(document, "received")}
                    onReject={() => {
                      setRejectionTarget(document);
                      setRejectionReason("");
                    }}
                    onArchive={() =>
                      changeStatus(document, "archived")
                    }
                    onRestore={() =>
                      changeStatus(document, "received")
                    }
                    selected={selectedIds.has(document.id)}
                    onToggleSelected={() => toggleSelected(document.id)}
                    onEditDetails={() => openMetadataEditor(document)}
                    onDelete={() => deleteDocument(document)}
                    onRestoreDeleted={() => restoreDeletedDocument(document)}
                    onPermanentDelete={() => permanentlyDeleteDocument(document)}
                    onReplace={(file) => replaceFile(document, file)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <StudentNotificationPreviewModal
        pending={pendingNotification}
        busy={notificationBusy}
        onCancel={() => !notificationBusy && setPendingNotification(null)}
        onConfirm={confirmPendingNotification}
      />
      {/* PARTNER OS DOCUMENT STRATEGY CENTER */}
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(17rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                <FolderOpen size={12} />
                Student Master File
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Document Operations Center
            </h2>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Control the complete student document vault: upload files, verify
              evidence, manage recovery, inspect history, track expiry and keep
              every document action audit-safe.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Document Strategy Actions
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Request exact evidence from the student, set priority and due dates,
              notify them, inspect history or manage the live document vault.
            </p>

            <div className="mt-4 min-w-0 space-y-2.5">
              <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="[&>div>button]:min-h-11 [&>div>button]:w-full [&>div>button]:justify-center [&>div>button]:whitespace-nowrap [&>div>button]:rounded-xl [&>div>button]:border-2 [&>div>button]:border-white/35 [&>div>button]:bg-[#123865] [&>div>button]:px-4 [&>div>button]:text-xs [&>div>button]:font-black [&>div>button]:text-white [&>div>button]:shadow-sm [&>div>button]:hover:border-white [&>div>button]:hover:bg-[#0d2b50]">
                  <StudentNotificationComposer
                    student={student}
                    context="document"
                    buttonLabel="Send Update"
                    compact
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openDocumentRequest(null)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 active:translate-y-0"
                >
                  <Send size={15} />
                  Request
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddType(true)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 active:translate-y-0"
                >
                  <Plus size={15} />
                  Add Type
                </button>
              </div>

              <div className="grid min-w-0 grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistory(true);
                    void reloadHistory();
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-white bg-white px-2.5 text-[10px] font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  <History size={14} />
                  <span className="hidden sm:inline">History</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeleted((current) => !current);
                    setStatusFilter("all");
                    clearSelection();
                  }}
                  aria-pressed={showDeleted}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 text-[10px] font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 ${
                    showDeleted
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-white bg-white text-[#123865] hover:bg-[#FFF4E8]"
                  }`}
                >
                  <Undo2 size={14} />
                  <span className="hidden sm:inline">Recovery</span>
                  {counts.deleted ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[8px] ${
                        showDeleted
                          ? "bg-white/15 text-white"
                          : "bg-[#123865]/10 text-[#123865]"
                      }`}
                    >
                      {counts.deleted}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={loadDocuments}
                  disabled={loading || savingKeys.size > 0}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-white bg-white px-2.5 text-[10px] font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5">
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5A0A]">
                Live Vault Snapshot
              </p>
              <p className="mt-1 text-sm font-black text-[#123865] sm:text-base">
                Requests, evidence and review health at a glance
              </p>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border-2 border-[#C9D7E6] bg-white px-3.5 py-3 shadow-sm sm:w-auto sm:min-w-[15rem]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Verification progress
                  </span>
                  <span className="text-xs font-black text-[#123865]">
                    {verifiedRate}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#FF5A0A] transition-all duration-500"
                    style={{ width: `${verifiedRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <Metric
              label="Document Types"
              value={documentTypes.length}
              icon={Database}
              tone="blue"
              helper="Complete Italy-first catalog"
            />
            <Metric
              label="Files"
              value={counts.total}
              icon={Files}
              helper="Current uploaded evidence"
            />
            <Metric
              label="Active Requests"
              value={requestStats.active}
              icon={BellRing}
              tone="blue"
              helper="Open requests sent to student"
            />
            <Metric
              label="Missing Requests"
              value={requestStats.missing}
              icon={FilePlus2}
              tone={requestStats.overdue ? "red" : "orange"}
              helper={requestStats.overdue ? `${requestStats.overdue} overdue request${requestStats.overdue === 1 ? "" : "s"}` : "Requested files not uploaded"}
            />
            <Metric
              label="Verified"
              value={counts.verified}
              icon={BadgeCheck}
              tone="green"
              helper="Accepted by operations"
            />
            <Metric
              label="Awaiting Review"
              value={counts.received}
              icon={CircleAlert}
              tone="blue"
              helper="Uploaded and waiting for decision"
            />
            <Metric
              label="Rejected"
              value={counts.rejected}
              icon={XCircle}
              tone="red"
              helper="Correction or replacement required"
            />
            <Metric
              label="Expiring Soon"
              value={counts.expiring}
              icon={CalendarClock}
              tone="orange"
              helper="Expiry within the next 30 days"
            />
            <Metric
              label="Verified Rate"
              value={`${verifiedRate}%`}
              icon={ShieldCheck}
              tone={verifiedRate >= 80 ? "green" : "orange"}
              helper={`${counts.verified} of ${counts.total} active file${counts.total === 1 ? "" : "s"} verified`}
            />
          </div>
        </div>
      </section>

      {savingKeys.size > 0 ? (
        <div
          className="flex min-w-0 items-center gap-3 rounded-[1.2rem] border-2 border-[#FF5A0A] bg-[#123865] px-4 py-3 shadow-[0_10px_28px_rgba(18,56,101,0.18)]"
          style={{ color: "#ffffff" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#173b70]">
            <LoaderCircle
              size={17}
              className="animate-spin"
              style={{ color: "#ff9b45" }}
            />
          </span>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-black leading-tight"
              style={{ color: "#ffffff" }}
            >
              {savingKeys.size} document operation{savingKeys.size === 1 ? "" : "s"} running
            </p>
            <p
              className="mt-1 text-xs font-bold leading-relaxed"
              style={{ color: "#ffffff" }}
            >
              Other files remain usable while Zaifan OS finishes this action.
            </p>
          </div>
        </div>
      ) : null}

      {/* FEEDBACK */}
      {error ? (
        <div className="flex min-w-0 items-start gap-3 rounded-[1.2rem] border-2 border-[#FB7185] bg-[#FFF4F4] p-4 text-sm font-bold text-red-800 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
          <CircleAlert className="mt-0.5 shrink-0" size={17} />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-[1.2rem] border-2 border-[#34D399] bg-[#F0FFF8] p-4 text-sm font-bold text-emerald-800 shadow-[0_8px_22px_rgba(18,56,101,0.05)] sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
            <span className="min-w-0 flex-1">{successMessage}</span>
          </div>

          <div className="flex items-center gap-2">
            {undoAction ? (
              <button
                type="button"
                onClick={undoLastAction}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-[11px] font-black transition hover:bg-[#315B88]"
                style={{ color: "#ffffff" }}
              >
                <RotateCcw size={14} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Undo</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-white/70"
              aria-label="Dismiss success"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <section className="min-w-0 rounded-[1.2rem] border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3 shadow-[0_6px_18px_rgba(18,56,101,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <ListChecks size={17} className="text-[#123865]" />
              <span className="text-sm font-black text-[#123865]">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={bulkDownload}
                className="rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-2 text-[11px] font-black text-orange-800"
              >
                Download selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("verified")}
                className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800"
              >
                Verify selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("archived")}
                className="rounded-xl border-2 border-slate-400 bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700"
              >
                Archive selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("received")}
                className="rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-800"
              >
                Return to review
              </button>

              <button
                type="button"
                onClick={bulkSoftDelete}
                className="rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-[11px] font-black text-red-800"
              >
                Move to recovery
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2 text-[11px] font-black text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* GUIDED CATALOG NAVIGATOR */}
      <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-4 border-b-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-orange-800">
                <ListChecks size={13} />
                Guided workspace
              </span>
              <span className="rounded-full border-2 border-[#B8CCE2] bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#123865]">
                {documentTypes.length} permanent types
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black tracking-[-0.02em] text-[#10233F] sm:text-2xl">
              Find the right document without opening a 166-item wall
            </h3>
            <p className="mt-1.5 max-w-4xl text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
              Start with the student&apos;s active file, move by journey stage, or open the complete future-proof library only when needed. Search always checks the full catalog.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={expandVisibleGroups}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-[#123865] bg-white px-3 text-[11px] font-black text-[#123865] transition hover:bg-blue-50"
            >
              <ChevronDown size={14} />
              Expand groups
            </button>
            <button
              type="button"
              onClick={collapseVisibleGroups}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronRight size={14} />
              Collapse
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid min-w-0 gap-2 md:grid-cols-3">
            {[
              {
                value: "common",
                title: "Daily Focus",
                text: "Core, common and already-active records",
              },
              {
                value: "active",
                title: "Student File",
                text: "Only uploaded or student-specific requirements",
              },
              {
                value: "complete",
                title: "Complete Library",
                text: "Every conditional and future workflow type",
              },
            ].map((option) => {
              const active = catalogScope === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCatalogScope(option.value)}
                  aria-pressed={active}
                  className={`min-w-0 rounded-[1.15rem] border-2 p-3 text-left transition ${
                    active
                      ? "border-[#FF5A0A] bg-[#123865] shadow-[0_8px_22px_rgba(18,56,101,0.16)]"
                      : "border-[#C9D7E6] bg-[#FFF8EF] hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
                  }`}
                >
                  <span
                    className={`block text-sm font-black ${
                      active ? "text-white" : "text-[#10233F]"
                    }`}
                  >
                    {option.title}
                  </span>
                  <span
                    className={`mt-1 block text-[11px] font-semibold leading-4 ${
                      active ? "text-slate-100" : "text-slate-600"
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-0 rounded-[1.2rem] border-2 border-[#D7E2EE] bg-[#FFF8EF] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#123865]">
                Journey stage
              </p>
              {stageFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => setStageFilter("all")}
                  className="text-[10px] font-black text-orange-700 underline decoration-2 underline-offset-2"
                >
                  Clear stage
                </button>
              ) : null}
            </div>

            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setStageFilter("all")}
                className={`min-h-9 shrink-0 rounded-xl border-2 px-3 text-[10px] font-black transition ${
                  stageFilter === "all"
                    ? "border-[#123865] bg-[#123865] text-white"
                    : "border-[#C9D7E6] bg-white text-[#123865] hover:border-[#FF5A0A]"
                }`}
              >
                All stages
              </button>

              {documentStages.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`min-h-9 shrink-0 rounded-xl border-2 px-3 text-[10px] font-black transition ${
                    stageFilter === stage
                      ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
                      : "border-[#C9D7E6] bg-white text-slate-700 hover:border-[#FF5A0A]"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search any document, purpose, stage, file or note..."
                className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-10 pr-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              aria-expanded={showAdvancedFilters}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 text-[11px] font-black transition ${
                showAdvancedFilters || groupFilter !== "all" || statusFilter !== "all"
                  ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
                  : "border-[#123865] bg-white text-[#123865] hover:bg-blue-50"
              }`}
            >
              <Search size={14} />
              Advanced filters
              {showAdvancedFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className="inline-flex min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-1">
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className={`rounded-lg px-3 text-[10px] font-black transition ${
                  viewMode === "compact"
                    ? "bg-[#123865] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setViewMode("detailed")}
                className={`rounded-lg px-3 text-[10px] font-black transition ${
                  viewMode === "detailed"
                    ? "bg-[#123865] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Detailed
              </button>
            </div>
          </div>

          {showAdvancedFilters ? (
            <div className="grid min-w-0 gap-3 rounded-[1.2rem] border-2 border-[#FFB37A] bg-[#FFF4E8] p-3 md:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#123865]">
                  Document group
                </span>
                <select
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                  className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A]"
                >
                  <option value="all">All document groups</option>
                  {documentGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#123865]">
                  Operational status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A]"
                >
                  <option value="all">All statuses</option>
                  <option value="attention">Needs attention</option>
                  <option value="requested">Active student requests</option>
                  <option value="missing">Missing essential / required</option>
                  <option value="received">Awaiting review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                  <option value="deleted">Recovery</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-3 rounded-[1.2rem] border-2 border-[#D7E2EE] bg-[#FFF8EF] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black text-[#123865]">
                {filteredBlocks.length} visible types inside {filteredBlockGroups.length} workspace group{filteredBlockGroups.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">
                Rejected, missing student requirements and awaiting-review files are sorted first. Groups stay collapsed until you need them.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setGroupFilter("all");
                setStageFilter("all");
                setCatalogScope("common");
                setViewMode("compact");
                setShowAdvancedFilters(false);
              }}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-[#123865] bg-white px-3 text-[11px] font-black text-[#123865] transition hover:bg-slate-50"
            >
              <RotateCcw size={13} />
              Reset workspace
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORY WORKSPACES */}
      <section className="space-y-4">
        {loading && documents.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[1.35rem] border-2 border-[#C9D7E6] bg-[#FFF8EF] shadow-inner">
            <div className="text-center">
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-3 text-sm font-black text-[#10233F]">
                Loading student files
              </p>
            </div>
          </div>
        ) : null}

        {!loading && filteredBlockGroups.length === 0 ? (
          <div className="rounded-[1.35rem] border-2 border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-8 text-center">
            <File size={32} className="mx-auto text-orange-400" />
            <h3 className="mt-3 text-lg font-black text-[#10233F]">
              No matching document workspace
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Clear the filters, change the journey stage or search another document name.
            </p>
          </div>
        ) : null}

        {filteredBlockGroups.map((group) => {
          const forcedOpen =
            Boolean(search) ||
            groupFilter !== "all" ||
            stageFilter !== "all" ||
            statusFilter !== "all" ||
            filteredBlockGroups.length === 1;
          const isGroupExpanded =
            forcedOpen || expandedGroups.has(group.name);

          return (
            <section
              key={group.name}
              className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_32px_rgba(18,56,101,0.08)]"
            >
              <button
                type="button"
                onClick={() => !forcedOpen && toggleGroup(group.name)}
                className="flex min-w-0 w-full flex-col gap-3 bg-[#123865] p-4 text-left text-white sm:p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-[#123865] shadow-sm">
                    <FolderOpen size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-words text-base font-black text-white sm:text-lg">
                        {group.name}
                      </span>
                      <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                        {group.blocks.length} type{group.blocks.length === 1 ? "" : "s"}
                      </span>
                    </span>

                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {group.uploadedBlocks ? (
                        <span className="rounded-full border border-blue-200/40 bg-blue-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          {group.uploadedBlocks} uploaded
                        </span>
                      ) : null}
                      {group.reviewBlocks ? (
                        <span className="rounded-full border border-blue-200/40 bg-blue-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          {group.reviewBlocks} review
                        </span>
                      ) : null}
                      {group.verifiedBlocks ? (
                        <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          {group.verifiedBlocks} verified
                        </span>
                      ) : null}
                      {group.rejectedBlocks ? (
                        <span className="rounded-full border border-red-200/50 bg-red-300/20 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          {group.rejectedBlocks} rejected
                        </span>
                      ) : null}
                      {group.missingRequired ? (
                        <span className="rounded-full border border-orange-200/60 bg-orange-300/20 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          {group.missingRequired} required missing
                        </span>
                      ) : null}
                      {!group.uploadedBlocks && !group.requiredBlocks ? (
                        <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-slate-100">
                          Reference catalog
                        </span>
                      ) : null}
                    </span>
                  </span>
                </span>

                <span className="flex min-w-0 w-full items-center gap-3 lg:w-auto lg:min-w-[15rem]">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-200">
                      <span>Verified progress</span>
                      <span>{group.completionRate}%</span>
                    </span>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/15">
                      <span
                        className="block h-full rounded-full bg-[#FF5A0A] transition-all"
                        style={{ width: `${group.completionRate}%` }}
                      />
                    </span>
                  </span>

                  {isGroupExpanded ? (
                    <ChevronDown size={19} className="shrink-0 text-white" />
                  ) : (
                    <ChevronRight size={19} className="shrink-0 text-white" />
                  )}
                </span>
              </button>

              {isGroupExpanded ? (
                <div className="space-y-2.5 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-3 sm:p-4">
                  {group.blocks.map(renderDocumentBlock)}
                </div>
              ) : null}
            </section>
          );
        })}
      </section>

      {/* ADD CUSTOM TYPE */}
      {showRequestCenter ? (
        <div className="fixed inset-0 z-[1260] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border-[4px] border-[#123865] bg-[#FFF8EF] shadow-[0_28px_90px_rgba(15,23,42,0.38)]">
            <div className="flex items-start justify-between gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white sm:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    <BellRing size={12} /> Student Request Center
                  </span>
                  {findRequirementByName(requestForm.documentName) ? (
                    <span className="rounded-full border border-orange-300 bg-orange-500/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">
                      Existing request
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Request a document from the student
                </h3>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-200">
                  Choose the exact document, explain what is needed, set urgency and a due date. The request becomes visible in the Student Portal immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRequestCenter(false);
                  setRequestTarget(null);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/35 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close request center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <section className="rounded-[1.4rem] border-[3px] border-[#FF5A0A] bg-white p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.13em] text-[#123865]">
                      Document to request
                    </span>
                    <input
                      list="zaifan-document-request-options"
                      value={requestForm.documentName}
                      onChange={(event) => {
                        const nextName = event.target.value;
                        const matchedType = documentTypes.find(
                          (type) => normalize(type.name) === normalize(nextName)
                        );
                        const existingRequirement = findRequirementByName(nextName);
                        const meta = readRequirementMeta(existingRequirement || matchedType || {});

                        setRequestTarget(matchedType || null);
                        setRequestForm((previous) => ({
                          ...previous,
                          documentName: nextName,
                          instructions:
                            existingRequirement || matchedType
                              ? meta.instructions || matchedType?.description || previous.instructions
                              : previous.instructions,
                          expiryTracking:
                            existingRequirement || matchedType
                              ? Boolean(existingRequirement?.expiry_tracking || matchedType?.expiryTracking)
                              : previous.expiryTracking,
                        }));
                      }}
                      placeholder="Search or type a document name"
                      className="h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3.5 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                    />
                    <datalist id="zaifan-document-request-options">
                      {documentTypes.map((type) => (
                        <option key={type.name} value={type.name}>
                          {type.group} · {type.stage || "Application"}
                        </option>
                      ))}
                    </datalist>
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                      {requestTarget
                        ? `${requestTarget.group || "Custom"} · ${requestTarget.stage || "Student-specific"}`
                        : "Choose from the complete Zaifan catalog or type a genuine custom requirement."}
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.13em] text-[#123865]">
                      Due date
                    </span>
                    <input
                      type="date"
                      value={requestForm.dueDate}
                      onChange={(event) =>
                        setRequestForm((previous) => ({
                          ...previous,
                          dueDate: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3.5 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A]"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.13em] text-[#123865]">
                      Priority
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-1.5">
                      {["low", "normal", "high", "urgent"].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            setRequestForm((previous) => ({
                              ...previous,
                              priority,
                            }))
                          }
                          className={`min-h-9 rounded-lg border px-2 text-[9px] font-black uppercase tracking-[0.08em] transition ${
                            requestForm.priority === priority
                              ? getRequestPriorityClasses(priority)
                              : "border-transparent bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.13em] text-[#123865]">
                      Instructions visible to the student
                    </span>
                    <textarea
                      rows={5}
                      value={requestForm.instructions}
                      onChange={(event) =>
                        setRequestForm((previous) => ({
                          ...previous,
                          instructions: event.target.value,
                        }))
                      }
                      placeholder="Example: Upload a clear colour scan of the passport bio page. All four corners must be visible."
                      className="w-full resize-none rounded-xl border-2 border-[#C9D7E6] bg-white px-3.5 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[1.4rem] border-2 border-[#C9D7E6] bg-white p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
                  Request controls
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["required", "Required for journey", "Counts toward document readiness"],
                    ["verificationRequired", "Admin verification required", "Must be accepted before completion"],
                    ["studentCanUpload", "Student upload enabled", "Student can upload or replace the file"],
                    ["expiryTracking", "Track issue / expiry dates", "Useful for passport, IELTS, insurance and certificates"],
                    ["notifyStudent", "Notify student", "Open the safe notification preview before saving"],
                  ].map(([key, label, helper]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setRequestForm((previous) => ({
                          ...previous,
                          [key]: !previous[key],
                        }))
                      }
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                        requestForm[key]
                          ? "border-[#123865] bg-[#EDF4F8]"
                          : "border-slate-200 bg-slate-50"
                      } ${key === "notifyStudent" ? "sm:col-span-2" : ""}`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          requestForm[key]
                            ? "border-[#123865] bg-[#123865] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <CheckCircle2 size={12} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-black text-[#10233F]">
                          {label}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold leading-4 text-slate-500">
                          {helper}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {findRequirementByName(requestForm.documentName) ? (
                    <button
                      type="button"
                      onClick={stopDocumentRequest}
                      disabled={savingKeys.size > 0}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Stop Active Request
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestCenter(false);
                      setRequestTarget(null);
                    }}
                    className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submitDocumentRequest}
                    disabled={
                      !requestForm.documentName.trim() ||
                      savingKeys.size > 0 ||
                      notificationBusy
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 text-xs font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingKeys.size > 0 ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {findRequirementByName(requestForm.documentName)
                      ? "Save / Request Again"
                      : "Send Document Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showAddType ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.6rem] border-2 border-[#FF5A0A] bg-[#FFF8EF] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Student Master File
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Add Document Type
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-slate-500 transition hover:text-orange-600"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                  Document type
                </span>
                <input
                  value={customTypeName}
                  onChange={(event) => setCustomTypeName(event.target.value)}
                  placeholder="e.g. CIMEA Verification"
                  className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                  Group
                </span>
                <input
                  value={customTypeGroup}
                  onChange={(event) => setCustomTypeGroup(event.target.value)}
                  placeholder="e.g. Italy Admission"
                  className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-[11px] font-black text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addCustomType}
                className="rounded-xl border-2 border-orange-600 bg-[#FF5A0A] px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-orange-600"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* DOCUMENT INSPECTOR */}
      {metadataTarget ? (
        <div className="fixed inset-3 z-[1210] flex justify-end pointer-events-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-28 sm:w-[min(94vw,38rem)]">
          <aside className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-[1.6rem] border-[4px] border-[#123865] bg-[#FFF8EF] shadow-[-24px_18px_70px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#FF5A0A] bg-white p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Document Inspector
                </p>
                <h3 className="mt-1 truncate text-xl font-black text-[#10233F]">
                  {getFileName(metadataTarget)}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  View and edit the permanent metadata for this exact file without leaving the document workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMetadataTarget(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-slate-500"
                title="Close inspector"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2">
                <span className="text-[11px] font-black text-emerald-800">
                  Changes stay visible here after saving.
                </span>
                <span className="rounded-full border border-emerald-300 bg-white px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                  Persistent
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InspectorStat
                  label="Status"
                  value={metadataTarget.is_deleted ? "Recovery" : metadataTarget.status || "received"}
                />
                <InspectorStat
                  label="Version"
                  value={`v${metadataTarget.version || 1}`}
                />
                <InspectorStat
                  label="Original file"
                  value={metadataTarget.original_file_name || getFileName(metadataTarget)}
                />
                <InspectorStat
                  label="File type"
                  value={metadataTarget.mime_type || "Unknown"}
                />
                <InspectorStat
                  label="File size"
                  value={
                    metadataTarget.file_size_bytes
                      ? `${(Number(metadataTarget.file_size_bytes) / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown"
                  }
                />
                <InspectorStat
                  label="Uploaded"
                  value={formatDate(metadataTarget.created_at)}
                />
                <InspectorStat
                  label="Verified"
                  value={metadataTarget.verified_at ? formatDate(metadataTarget.verified_at) : "Not verified"}
                />
                <InspectorStat
                  label="Rejected"
                  value={metadataTarget.rejected_at ? formatDate(metadataTarget.rejected_at) : "No"}
                />
              </div>

              {metadataTarget.rejection_reason ? (
                <div className="mt-4 rounded-[1.3rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                    Rejection reason
                  </p>
                  <p className="mt-2 text-sm font-semibold text-red-900">
                    {metadataTarget.rejection_reason}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 rounded-[1.35rem] border-2 border-[#FF5A0A] bg-white p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock size={17} className="text-orange-600" />
                  <h4 className="text-sm font-black text-[#10233F]">
                    Editable document details
                  </h4>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                      Category
                    </span>
                    <input
                      value={metadataForm.document_category}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          document_category: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                      Issue date
                    </span>
                    <input
                      type="date"
                      value={metadataForm.issue_date}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          issue_date: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                      Expiry date
                    </span>
                    <input
                      type="date"
                      value={metadataForm.expiry_date}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          expiry_date: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A]"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                      Internal notes
                    </span>
                    <textarea
                      rows={5}
                      value={metadataForm.notes}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full resize-none rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#FF5A0A]"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMetadataTarget(null)}
                    className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-[11px] font-black text-slate-700"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={saveMetadata}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-700 bg-[#FF5A0A] px-4 py-2.5 text-[11px] font-black text-white"
                  >
                    <Save size={14} />
                    Save details
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[1.35rem] border-2 border-[#C9D7E6] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Storage reference
                </p>
                <p className="mt-2 break-all text-xs font-semibold text-slate-700">
                  {metadataTarget.file_path || "No Storage path"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* DOCUMENT HISTORY */}
      {showHistory ? (
        <div className="fixed inset-0 z-[1210] flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-2xl flex-col border-l-[4px] border-[#123865] bg-[#FFF8EF] shadow-[-30px_0_100px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b-2 border-[#FF5A0A] bg-white p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Permanent Audit Trail
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Document History
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reloadHistory}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white"
                  title="Refresh history"
                >
                  <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {historyEvents.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-white p-8 text-center">
                  <Database size={28} className="mx-auto text-orange-500" />
                  <p className="mt-3 text-sm font-black text-[#10233F]">
                    No document history recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#10233F]">
                            {event.event_label || event.event_type}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(event.created_at)}
                          </p>
                        </div>

                        {event.new_status ? (
                          <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-800">
                            {event.new_status}
                          </span>
                        ) : null}
                      </div>

                      {event.reason ? (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                          {event.reason}
                        </p>
                      ) : null}

                      {(event.previous_status || event.new_status) ? (
                        <p className="mt-3 text-xs font-semibold text-slate-600">
                          {event.previous_status || "—"} → {event.new_status || "—"}
                        </p>
                      ) : null}

                      {event.metadata &&
                      Object.keys(event.metadata).length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {event.metadata.file_name ? (
                            <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-600">
                              {event.metadata.file_name}
                            </span>
                          ) : null}

                          {event.metadata.version ? (
                            <span className="rounded-full border border-[#FF5A0A] bg-[#FFF4E8] px-2 py-1 text-[9px] font-black text-orange-700">
                              v{event.metadata.version}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* REJECTION */}
      {rejectionTarget ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.6rem] border-2 border-red-400 bg-[#FFF8EF] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
                  Verification Action
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Reject {getFileName(rejectionTarget)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-red-300 bg-white text-slate-500 transition hover:text-red-600"
              >
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-[11px] font-black text-[#10233F]">
                Rejection reason
              </span>

              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain exactly what needs to be corrected or replaced..."
                rows={5}
                className="w-full resize-none rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-[11px] font-black text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={async () => {
                  await changeStatus(
                    rejectionTarget,
                    "rejected",
                    rejectionReason.trim()
                  );
                  setRejectionTarget(null);
                  setRejectionReason("");
                }}
                className="rounded-xl border-2 border-red-700 bg-red-600 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InspectorStat({ label, value }) {
  return <ZaifanMetricCard level="baby" surface="navy" label={label} value={value} tone="navy" />;
}

function Metric({ label, value, icon: Icon, tone = "slate", helper = "" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} detail={helper} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}

function DocumentRow({
  document,
  getFileName,
  statusClass,
  busy,
  saving,
  onOpen,
  onDownload,
  onVerify,
  onUnverify,
  onReject,
  onArchive,
  onRestore,
  selected,
  onToggleSelected,
  onEditDetails,
  onDelete,
  onRestoreDeleted,
  onPermanentDelete,
  onReplace,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = normalize(document.status || "received");
  const isArchived = status === "archived";
  const isDeleted = Boolean(document.is_deleted);

  const expiryState = (() => {
    if (!document.expiry_date) return null;

    const expiry = new Date(document.expiry_date).getTime();
    if (Number.isNaN(expiry)) return null;

    const days = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));

    if (days < 0) return { label: "Expired", tone: "red" };
    if (days <= 30) return { label: `${days}d to expiry`, tone: "orange" };
    return { label: `Expires ${new Date(document.expiry_date).toLocaleDateString("en-GB")}`, tone: "slate" };
  })();

  return (
    <div
      className={`rounded-2xl border-2 p-3 shadow-[0_4px_14px_rgba(15,35,63,0.035)] transition ${
        isDeleted
          ? "border-slate-400 bg-slate-100/80"
          : "border-[#C9D7E6] bg-white hover:border-[#FF5A0A]"
      }`}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSelected}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
              selected
                ? "border-[#123865] bg-[#123865] text-white"
                : "border-[#C9D7E6] bg-white text-slate-400"
            }`}
            title={selected ? "Unselect document" : "Select document"}
          >
            {selected ? (
              <CheckSquare size={15} style={{ color: "#ffffff" }} />
            ) : (
              <Square size={15} />
            )}
          </button>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-200 bg-[#FFF4E8] text-orange-600">
            <File size={17} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="max-w-full truncate text-sm font-black text-[#10233F]">
                {getFileName(document)}
              </p>

              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-black capitalize ${statusClass(
                  status,
                  isDeleted
                )}`}
              >
                {saving ? "saving..." : status}
              </span>
            </div>

            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {document.document_name || "Document"} · Updated{" "}
              {formatDate(document.updated_at || document.created_at)}
            </p>

            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                v{document.version || 1}
              </span>

              {document.document_category ? (
                <span className="rounded-full border border-orange-200 bg-[#FFF4E8] px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
                  {document.document_category}
                </span>
              ) : null}

              {expiryState ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                    expiryState.tone === "red"
                      ? "border-red-300 bg-red-50 text-red-800"
                      : expiryState.tone === "orange"
                      ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
                      : "border-slate-300 bg-slate-50 text-slate-600"
                  }`}
                >
                  {expiryState.label}
                </span>
              ) : null}
            </div>

            {document.notes ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {document.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDeleted ? (
            <>
              <button
                type="button"
                onClick={onRestoreDeleted}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-blue-400 bg-blue-50 px-2.5 py-2 text-[11px] font-black text-blue-800"
              >
                <RotateCcw size={13} />
                Restore
              </button>

              <button
                type="button"
                onClick={onPermanentDelete}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-500 bg-red-50 px-2.5 py-2 text-[11px] font-black text-red-800"
              >
                <Trash2 size={13} />
                Delete forever
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEditDetails}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#123865] bg-white px-2.5 py-2 text-[11px] font-black text-[#123865] transition hover:bg-slate-50 disabled:opacity-40"
              >
                <CalendarClock size={13} />
                Details
              </button>

          {document.file_url ? (
            <>
              <button
                type="button"
                onClick={onOpen}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#FF5A0A] sm:w-auto bg-[#FFF4E8] px-2.5 py-2 text-[11px] font-black text-orange-700 transition hover:bg-orange-100 disabled:opacity-40"
              >
                <Eye size={13} />
                Preview
              </button>

              <button
                type="button"
                onClick={onDownload}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-blue-300 sm:w-auto bg-blue-50 px-2.5 py-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
              >
                <Download size={13} />
                Download
              </button>
            </>
          ) : null}

          {!isArchived ? (
            status === "verified" ? (
              <button
                type="button"
                onClick={onUnverify}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 px-2.5 py-2 text-[11px] font-black text-amber-800 transition hover:bg-amber-100 disabled:opacity-40 sm:w-auto"
                title="Move this document back to review"
              >
                <RotateCcw size={13} />
                Unverify
              </button>
            ) : (
              <button
                type="button"
                onClick={onVerify}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40 sm:w-auto"
              >
                <BadgeCheck size={13} />
                Verify
              </button>
            )
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              disabled={busy}
              className="flex h-9 w-full items-center justify-center rounded-lg border-2 border-slate-300 sm:w-9 bg-white text-slate-500 transition hover:border-[#FF5A0A] hover:text-orange-600 disabled:opacity-40"
              aria-label="More document actions"
              title="More document actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-11 z-30 w-[min(13rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-2 border-[#FF5A0A] bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                {!isArchived ? (
                  <>
                    {status === "rejected" ? (
                      <MenuButton
                        icon={RotateCcw}
                        label="Return to review"
                        onClick={() => {
                          setMenuOpen(false);
                          onUnverify();
                        }}
                      />
                    ) : (
                      <MenuButton
                        icon={XCircle}
                        label="Reject with reason"
                        onClick={() => {
                          setMenuOpen(false);
                          onReject();
                        }}
                        tone="red"
                      />
                    )}

                    <MenuButton
                      icon={CalendarClock}
                      label="Edit details / expiry"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditDetails();
                      }}
                    />

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-black text-[#10233F] transition hover:bg-[#FFF4E8] hover:text-orange-700">
                      <RotateCcw size={14} />
                      Replace file
                      <input
                        type="file"
                        className="hidden"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onReplace(file);
                          event.target.value = "";
                          setMenuOpen(false);
                        }}
                      />
                    </label>

                    <MenuButton
                      icon={Archive}
                      label="Archive"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive();
                      }}
                    />
                  </>
                ) : (
                  <MenuButton
                    icon={RotateCcw}
                    label="Restore to review"
                    onClick={() => {
                      setMenuOpen(false);
                      onRestore();
                    }}
                  />
                )}

                <div className="my-1 h-px bg-slate-200" />

                <MenuButton
                  icon={Trash2}
                  label="Permanently delete"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  tone="red"
                />
              </div>
            ) : null}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[11px] font-black transition ${
        tone === "red"
          ? "text-red-700 hover:bg-red-50"
          : "text-[#10233F] hover:bg-[#FFF4E8] hover:text-orange-700"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal") || value.includes("info")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
}

export default StudentDocumentsPanel;
