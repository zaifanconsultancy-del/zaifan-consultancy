// Zaifan University Requirement Library MAX — Italy-first reusable requirement taxonomy
// 96 master templates. Requirements describe WHAT must be true; Documents remain the evidence.
// Only relevant templates are applied to each student/university/programme.

export const UNIVERSITY_REQUIREMENT_CATEGORIES = {
  academic_qualification: { label: "Academic Qualification", description: "Core eligibility of the qualification used for admission." },
  academic_performance: { label: "Academic Performance", description: "Grades, GPA and performance evidence used to assess suitability." },
  curricular_prerequisites: { label: "Curricular Prerequisites", description: "Subject, credit and background requirements tied to the chosen programme." },
  language: { label: "Language", description: "English, Italian and programme-language evidence or exemptions." },
  selection: { label: "Tests & Selection", description: "Tests, interviews, ranking or programme-specific selection checks." },
  application_materials: { label: "Application Materials", description: "Materials used by the university to evaluate the candidate." },
  recognition_authenticity: { label: "Recognition & Authenticity", description: "Qualification recognition, translation, legalization and authenticity checks." },
  education_system: { label: "Education-System Rules", description: "Country or school-system conditions that can affect eligibility." },
  enrolment_admin: { label: "Enrolment & Administrative", description: "Deadlines, fees, quotas and post-admission administrative conditions." },
  programme_specific: { label: "Programme-Specific", description: "Requirements that apply only to particular academic fields or programmes." },
};

export const UNIVERSITY_REQUIREMENT_LIBRARY = [
  {
    "id": "academic_transcript",
    "category": "academic_qualification",
    "name": "Academic Transcript",
    "studentDescription": "Official transcript showing subjects, grades and study history.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "degree_current_qualification",
    "category": "academic_qualification",
    "name": "Degree / Current Qualification",
    "studentDescription": "Degree certificate or current qualification used to access the programme.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "qualification_access_next_cycle",
    "category": "academic_qualification",
    "name": "Qualification Gives Access to Next Study Cycle",
    "studentDescription": "Confirm that the qualification normally permits entry to the requested study cycle.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "institution_accreditation",
    "category": "academic_qualification",
    "name": "Recognised / Accredited Awarding Institution",
    "studentDescription": "Confirm that the school or university awarding the qualification is officially recognised.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "final_or_provisional_award",
    "category": "academic_qualification",
    "name": "Final Degree or Provisional Graduation Evidence",
    "studentDescription": "Provide the final award or official provisional evidence if graduation is still pending.",
    "levels": [
      "master"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "bachelor_minimum_duration",
    "category": "academic_qualification",
    "name": "Bachelor Degree Minimum Duration",
    "studentDescription": "Confirm the previous university qualification meets the required duration or equivalent credit level.",
    "levels": [
      "master"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "bachelor_180_ects_equivalent",
    "category": "academic_qualification",
    "name": "180 ECTS / Equivalent Prior Study",
    "studentDescription": "Confirm sufficient first-cycle university study or equivalent academic workload.",
    "levels": [
      "master"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "secondary_school_diploma",
    "category": "academic_qualification",
    "name": "Secondary School Diploma",
    "studentDescription": "Final secondary-school qualification required for first-cycle entry.",
    "levels": [
      "bachelor"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "twelve_year_schooling",
    "category": "academic_qualification",
    "name": "Minimum 12 Years of Schooling",
    "studentDescription": "Confirm the applicant completed the schooling duration normally required for first-cycle admission.",
    "levels": [
      "bachelor"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "qualification_completion_deadline",
    "category": "academic_qualification",
    "name": "Qualification Completion by Enrolment Deadline",
    "studentDescription": "Confirm the final qualification will be obtained by the university's stated deadline.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "gpa_weighted_average",
    "category": "academic_performance",
    "name": "GPA / Weighted Average",
    "studentDescription": "Record the GPA or weighted average used by the university to assess academic suitability.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "grading_scale",
    "category": "academic_performance",
    "name": "Official Grading Scale",
    "studentDescription": "Provide the institution's grading scale when marks are not self-explanatory.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "minimum_gpa_threshold",
    "category": "academic_performance",
    "name": "Minimum GPA Threshold",
    "studentDescription": "Check whether the programme or applicant country has a minimum GPA requirement.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "minimum_percentage_threshold",
    "category": "academic_performance",
    "name": "Minimum Percentage / Average Threshold",
    "studentDescription": "Check whether a minimum percentage or average grade is required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "academic_rank",
    "category": "academic_performance",
    "name": "Class Rank / Cohort Position",
    "studentDescription": "Provide class rank or cohort position if requested by the programme.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "failed_repeated_courses",
    "category": "academic_performance",
    "name": "Failed / Repeated Course Review",
    "studentDescription": "Check whether failed or repeated courses affect eligibility or selection.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "recent_semester_results",
    "category": "academic_performance",
    "name": "Latest Semester Results",
    "studentDescription": "Provide the most recent results when the final transcript is not yet available.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "academic_progression_consistency",
    "category": "academic_performance",
    "name": "Academic Progression Consistency",
    "studentDescription": "Review whether the academic record shows suitable progression for the chosen programme.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "field_compatibility",
    "category": "curricular_prerequisites",
    "name": "Previous Degree Field Compatibility",
    "studentDescription": "Confirm the previous study field is compatible with the requested programme.",
    "levels": [
      "master"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "specific_curricular_credits",
    "category": "curricular_prerequisites",
    "name": "Specific Curricular Credits / ECTS",
    "studentDescription": "Check required subject-area credits or equivalent coursework.",
    "levels": [
      "master"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "course_syllabi",
    "category": "curricular_prerequisites",
    "name": "Course Syllabi / Detailed Course Descriptions",
    "studentDescription": "Provide detailed descriptions of prior courses when curricular matching is required.",
    "levels": [
      "master"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "prerequisite_subjects",
    "category": "curricular_prerequisites",
    "name": "Required Prerequisite Subjects",
    "studentDescription": "Confirm required prerequisite subjects have been completed.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "mathematics_background",
    "category": "curricular_prerequisites",
    "name": "Mathematics Background",
    "studentDescription": "Confirm the programme's required mathematics preparation.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "computer",
      "data",
      "engineering",
      "economics",
      "finance",
      "physics",
      "mathematics"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "programming_background",
    "category": "curricular_prerequisites",
    "name": "Programming Background",
    "studentDescription": "Confirm prior programming study or equivalent competence.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "computer",
      "software",
      "data",
      "artificial intelligence",
      "informatics",
      "cyber"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "algorithms_data_structures",
    "category": "curricular_prerequisites",
    "name": "Algorithms & Data Structures Background",
    "studentDescription": "Confirm prior study of algorithms, data structures or equivalent computer-science foundations.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "computer",
      "software",
      "data",
      "artificial intelligence",
      "informatics",
      "cyber"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "statistics_probability",
    "category": "curricular_prerequisites",
    "name": "Statistics / Probability Background",
    "studentDescription": "Confirm required statistics or probability preparation.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "data",
      "statistics",
      "economics",
      "finance",
      "artificial intelligence",
      "machine learning"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "physics_background",
    "category": "curricular_prerequisites",
    "name": "Physics Background",
    "studentDescription": "Confirm required physics preparation.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "engineering",
      "physics",
      "aerospace",
      "mechanical",
      "electrical",
      "civil"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "economics_business_background",
    "category": "curricular_prerequisites",
    "name": "Economics / Business Background",
    "studentDescription": "Confirm required economics, accounting, finance or management preparation.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "economics",
      "business",
      "finance",
      "management",
      "marketing"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "design_architecture_background",
    "category": "curricular_prerequisites",
    "name": "Design / Architecture Academic Background",
    "studentDescription": "Confirm relevant design, architecture or planning background.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "architecture",
      "design",
      "urban",
      "planning"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "lab_science_background",
    "category": "curricular_prerequisites",
    "name": "Laboratory Science Background",
    "studentDescription": "Confirm required laboratory science preparation.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "chemistry",
      "biology",
      "biotechnology",
      "pharmacy",
      "medicine",
      "biomedical"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "language_requirement",
    "category": "language",
    "name": "Language Requirement",
    "studentDescription": "Confirm the language level required by the chosen programme.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "english_b2",
    "category": "language",
    "name": "English B2 or Programme Threshold",
    "studentDescription": "Confirm the required English level, commonly B2 or the programme's stated equivalent.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "italian_b2",
    "category": "language",
    "name": "Italian B2 or Programme Threshold",
    "studentDescription": "Confirm the required Italian level for programmes taught in Italian or where specifically required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "ielts_threshold",
    "category": "language",
    "name": "IELTS Minimum Score",
    "studentDescription": "Check the minimum IELTS overall score and any component requirements.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "toefl_threshold",
    "category": "language",
    "name": "TOEFL Minimum Score",
    "studentDescription": "Check the minimum TOEFL score and accepted test format.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "cambridge_threshold",
    "category": "language",
    "name": "Cambridge English Qualification",
    "studentDescription": "Check accepted Cambridge English certificates and minimum grades.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "moi_exemption",
    "category": "language",
    "name": "Medium of Instruction Exemption",
    "studentDescription": "Confirm whether an official English-medium statement can replace a language test.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "language_certificate_validity",
    "category": "language",
    "name": "Language Certificate Validity",
    "studentDescription": "Check certificate age, validity period and verification rules.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "language_result_sharing",
    "category": "language",
    "name": "Official Language Result Sharing",
    "studentDescription": "Check whether official test scores must be sent directly to the university.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "dual_language_requirement",
    "category": "language",
    "name": "Dual English / Italian Requirement",
    "studentDescription": "Confirm whether both English and Italian requirements apply for the programme or enrolment route.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "programme_selection_procedure",
    "category": "selection",
    "name": "Programme-Specific Selection Procedure",
    "studentDescription": "Check the programme's official selection method, ranking rules and evaluation stages.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "entrance_test",
    "category": "selection",
    "name": "Entrance / Admission Test",
    "studentDescription": "Confirm whether an admission test is required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "tolc_test",
    "category": "selection",
    "name": "TOLC Test",
    "studentDescription": "Check whether the relevant CISIA TOLC test is required and which version applies.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "university_internal_test",
    "category": "selection",
    "name": "University Internal Admission Test",
    "studentDescription": "Check for a university-specific admission or aptitude test.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "sat_score",
    "category": "selection",
    "name": "SAT Score",
    "studentDescription": "Check whether SAT is accepted or required for the programme.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "gre_score",
    "category": "selection",
    "name": "GRE General Test",
    "studentDescription": "Check whether GRE is required, accepted or useful for the programme.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "gmat_score",
    "category": "selection",
    "name": "GMAT / GMAT Focus Score",
    "studentDescription": "Check whether GMAT is required or accepted for business-related programmes.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "business",
      "management",
      "finance",
      "economics",
      "mba"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "academic_interview",
    "category": "selection",
    "name": "Academic Interview",
    "studentDescription": "Prepare for an academic or suitability interview if required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "portfolio_assessment",
    "category": "selection",
    "name": "Portfolio Assessment",
    "studentDescription": "Prepare and submit the portfolio required for creative or design programmes.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "architecture",
      "design",
      "art",
      "fashion",
      "urban",
      "planning"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "ranking_quota",
    "category": "selection",
    "name": "Ranking / Limited Places",
    "studentDescription": "Check ranking methodology, reserved places and limited-access conditions.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "cv",
    "category": "application_materials",
    "name": "CV",
    "studentDescription": "Provide an up-to-date academic or professional CV.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "statement_of_purpose",
    "category": "application_materials",
    "name": "Statement of Purpose",
    "studentDescription": "Provide the motivation or statement requested for programme evaluation.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "motivation_letter",
    "category": "application_materials",
    "name": "Motivation Letter",
    "studentDescription": "Prepare a programme-specific motivation letter when separately required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "recommendation_letters",
    "category": "application_materials",
    "name": "Recommendation Letters",
    "studentDescription": "Provide the required number and type of academic or professional references.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "passport_copy",
    "category": "application_materials",
    "name": "Passport / Identity Copy",
    "studentDescription": "Provide a valid identity document for the admission application.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "passport_validity",
    "category": "application_materials",
    "name": "Passport Validity",
    "studentDescription": "Confirm the identity document remains valid through the required admission or enrolment stage.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "work_experience_evidence",
    "category": "application_materials",
    "name": "Relevant Work Experience Evidence",
    "studentDescription": "Provide employment or internship evidence when experience is part of selection.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "training_certificates",
    "category": "application_materials",
    "name": "Training / Professional Certificates",
    "studentDescription": "Provide relevant training or professional certificates when they strengthen or satisfy programme requirements.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "research_proposal",
    "category": "application_materials",
    "name": "Research Proposal",
    "studentDescription": "Prepare a research proposal when required by the academic programme.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "research",
      "phd",
      "thesis"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "project_sample",
    "category": "application_materials",
    "name": "Project / Writing Sample",
    "studentDescription": "Provide a project, writing, coding or academic sample when the programme requests one.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "official_translation",
    "category": "recognition_authenticity",
    "name": "Official Translation",
    "studentDescription": "Check whether academic documents require an official translation into an accepted language.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "cimea_comparability",
    "category": "recognition_authenticity",
    "name": "CIMEA Statement of Comparability",
    "studentDescription": "Check whether CIMEA comparability is required or accepted for qualification recognition.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "cimea_verification",
    "category": "recognition_authenticity",
    "name": "CIMEA Statement of Verification",
    "studentDescription": "Check whether CIMEA verification or equivalent authenticity evidence is required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "declaration_of_value",
    "category": "recognition_authenticity",
    "name": "Declaration of Value (Dichiarazione di Valore)",
    "studentDescription": "Check whether a Declaration of Value is required or accepted as recognition evidence.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "diploma_supplement",
    "category": "recognition_authenticity",
    "name": "Diploma Supplement",
    "studentDescription": "Provide the Diploma Supplement when available or accepted for qualification recognition.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "apostille_legalization",
    "category": "recognition_authenticity",
    "name": "Apostille / Legalization",
    "studentDescription": "Check whether qualification documents require Apostille or consular legalization.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "document_authenticity",
    "category": "recognition_authenticity",
    "name": "Document Authenticity Verification",
    "studentDescription": "Ensure documents can be verified through issuing institutions, secure links, QR codes or required authentication channels.",
    "levels": [
      "all"
    ],
    "priority": "recommended",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "certified_copies",
    "category": "recognition_authenticity",
    "name": "Certified Copies",
    "studentDescription": "Check whether certified copies are required instead of ordinary scans.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "original_documents_enrolment",
    "category": "recognition_authenticity",
    "name": "Original Documents at Enrolment",
    "studentDescription": "Confirm which original documents must be produced after admission.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "ardi_correspondence",
    "category": "recognition_authenticity",
    "name": "ARDI / ENIC-NARIC Correspondence Check",
    "studentDescription": "Check official qualification correspondence where the university or recognition route uses it.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "national_entrance_exam",
    "category": "education_system",
    "name": "National University Entrance Examination",
    "studentDescription": "Provide evidence of passing the national higher-education entrance exam where the education system requires it.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "ten_year_schooling_compensation",
    "category": "education_system",
    "name": "10-Year Schooling Compensation",
    "studentDescription": "Check the additional university study or post-secondary qualification required for a 10-year school system.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "eleven_year_schooling_compensation",
    "category": "education_system",
    "name": "11-Year Schooling Compensation",
    "studentDescription": "Check the additional university study required for an 11-year school system.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "alevel_subjects",
    "category": "education_system",
    "name": "A-Level Subject Requirements",
    "studentDescription": "Confirm the number and relevance of Advanced Level subjects required for first-cycle entry.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "ib_diploma_conditions",
    "category": "education_system",
    "name": "International Baccalaureate Conditions",
    "studentDescription": "Check IB diploma recognition and programme-specific subject conditions.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "foundation_year",
    "category": "education_system",
    "name": "Foundation Year / Preparatory Year",
    "studentDescription": "Confirm whether a recognised foundation or preparatory year is needed to bridge qualification gaps.",
    "levels": [
      "bachelor"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "pakistan_hec_transcript",
    "category": "education_system",
    "name": "Pakistan HEC / Registrar-Certified Transcript",
    "studentDescription": "For Pakistani qualifications, check whether the university requires transcripts certified by the university registrar or HEC.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [
      "pakistan"
    ],
    "defaultTarget": ""
  },
  {
    "id": "pakistan_four_year_bachelor",
    "category": "education_system",
    "name": "Pakistan 4-Year Bachelor Structure",
    "studentDescription": "For Pakistani applicants, check whether the university requires a continuous four-year bachelor structure for Master's access.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [
      "pakistan"
    ],
    "defaultTarget": ""
  },
  {
    "id": "application_deadline",
    "category": "enrolment_admin",
    "name": "Application Deadline",
    "studentDescription": "Confirm the application submission deadline for the exact programme and applicant category.",
    "levels": [
      "all"
    ],
    "priority": "core",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "application_fee",
    "category": "enrolment_admin",
    "name": "Application Fee",
    "studentDescription": "Confirm the application fee, payment deadline and accepted payment method.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "non_eu_quota",
    "category": "enrolment_admin",
    "name": "Non-EU / Visa Applicant Quota",
    "studentDescription": "Check whether limited places or a separate quota applies to non-EU applicants residing abroad.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "preselection_required",
    "category": "enrolment_admin",
    "name": "Pre-selection / Preliminary Evaluation",
    "studentDescription": "Check whether a preliminary evaluation or pre-selection must be completed before formal enrolment.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "universitaly_preenrolment",
    "category": "enrolment_admin",
    "name": "Universitaly Pre-enrolment",
    "studentDescription": "After admission where applicable, complete the required Universitaly pre-enrolment step for the study-visa route.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "offer_acceptance_deadline",
    "category": "enrolment_admin",
    "name": "Offer Acceptance Deadline",
    "studentDescription": "Confirm the deadline and procedure for accepting an admission offer.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "enrolment_deadline",
    "category": "enrolment_admin",
    "name": "Final Enrolment Deadline",
    "studentDescription": "Confirm the final enrolment or matriculation deadline and required actions.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "enrolment_documents",
    "category": "enrolment_admin",
    "name": "Final Enrolment Documents",
    "studentDescription": "Confirm which documents must be submitted or verified to complete enrolment.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "architecture_portfolio",
    "category": "programme_specific",
    "name": "Architecture / Design Portfolio",
    "studentDescription": "Prepare the portfolio required for architecture, design or related programmes.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "architecture",
      "design",
      "urban",
      "planning"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "architecture_aptitude",
    "category": "programme_specific",
    "name": "Architecture Aptitude / National Selection",
    "studentDescription": "Check architecture-specific aptitude, ranking or national selection requirements.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "architecture"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "computer_science_core",
    "category": "programme_specific",
    "name": "Computer Science Core Background",
    "studentDescription": "Confirm sufficient computer-science foundations for the requested programme.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "computer",
      "software",
      "informatics",
      "cyber",
      "artificial intelligence"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "data_science_quantitative",
    "category": "programme_specific",
    "name": "Data Science Quantitative Background",
    "studentDescription": "Confirm mathematics, statistics and programming preparation for data-science programmes.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "data science",
      "machine learning",
      "artificial intelligence",
      "statistics"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "engineering_core",
    "category": "programme_specific",
    "name": "Engineering Core Background",
    "studentDescription": "Confirm engineering fundamentals and discipline-specific prerequisites.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "engineering",
      "mechanical",
      "electrical",
      "civil",
      "aerospace",
      "energy"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "business_quantitative",
    "category": "programme_specific",
    "name": "Business / Economics Quantitative Background",
    "studentDescription": "Confirm economics, mathematics, statistics or business prerequisites.",
    "levels": [
      "master"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "business",
      "economics",
      "finance",
      "management"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "medicine_admission",
    "category": "programme_specific",
    "name": "Medicine / Health Admission Conditions",
    "studentDescription": "Check health-programme access tests, quotas and programme-specific admission conditions.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "medicine",
      "medical",
      "dentistry",
      "health",
      "nursing"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "science_lab_prerequisites",
    "category": "programme_specific",
    "name": "Science Laboratory Prerequisites",
    "studentDescription": "Confirm laboratory science and discipline-specific prerequisite coursework.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "chemistry",
      "biology",
      "biotechnology",
      "pharmacy",
      "biomedical"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "humanities_language_prerequisites",
    "category": "programme_specific",
    "name": "Humanities / Language Academic Prerequisites",
    "studentDescription": "Confirm required language, literature, history or humanities background.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "literature",
      "language",
      "history",
      "humanities",
      "translation"
    ],
    "countries": [],
    "defaultTarget": ""
  },
  {
    "id": "law_prior_study",
    "category": "programme_specific",
    "name": "Law / Legal Studies Prior Background",
    "studentDescription": "Confirm legal-study prerequisites or qualification compatibility where required.",
    "levels": [
      "all"
    ],
    "priority": "conditional",
    "tags": [],
    "programKeywords": [
      "law",
      "legal"
    ],
    "countries": [],
    "defaultTarget": ""
  }
];

const normalize = (value = "") =>
  String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

const levelKey = (value = "") => {
  const clean = normalize(value);
  if (clean.includes("master") || clean.includes("msc") || clean.includes("second cycle")) return "master";
  if (clean.includes("bachelor") || clean.includes("bsc") || clean.includes("first cycle") || clean.includes("undergraduate")) return "bachelor";
  return "unknown";
};

export function getUniversityRequirementTemplate(idOrName = "") {
  const key = normalize(idOrName);
  if (!key) return null;
  return UNIVERSITY_REQUIREMENT_LIBRARY.find((item) => normalize(item.id) === key || normalize(item.name) === key) || null;
}

export function getUniversityRequirementCategory(category = "") {
  return UNIVERSITY_REQUIREMENT_CATEGORIES[category] || {
    label: String(category || "General").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    description: "University-specific admission requirement.",
  };
}

export function getUniversityRequirementMeta(requirement = {}) {
  const template = getUniversityRequirementTemplate(requirement.requirement_template_id || requirement.template_id || requirement.requirement_name || requirement.title) || null;
  const rawCategory = requirement.requirement_category || "";
  const legacyCategoryMap = { academic: "academic_qualification", application: "application_materials", language: "language" };
  const category = legacyCategoryMap[rawCategory] || template?.category || rawCategory || "general";
  const categoryMeta = getUniversityRequirementCategory(category);
  return {
    template,
    category,
    categoryLabel: categoryMeta.label,
    categoryDescription: categoryMeta.description,
    description: requirement.student_description || requirement.description || requirement.notes || template?.studentDescription || "",
    priority: template?.priority || "conditional",
  };
}

function isLevelMatch(template, level) {
  const levels = Array.isArray(template.levels) ? template.levels : ["all"];
  return levels.includes("all") || levels.includes(level);
}
function hasProgramKeyword(template, text) { return Boolean(template.programKeywords?.length) && template.programKeywords.some((k) => text.includes(normalize(k))); }
function hasCountryMatch(template, text) { return Boolean(template.countries?.length) && template.countries.some((c) => text.includes(normalize(c))); }

export function getRecommendedUniversityRequirements({ university = {}, student = {}, application = null } = {}) {
  const level = levelKey([university.degree_level, university.study_level, application?.degree_level, student.degree_level, student.study_level, university.program, university.course_name, application?.program, application?.course_name].filter(Boolean).join(" "));
  const programmeText = normalize([university.program, university.course_name, university.program_name, application?.program, application?.course_name, application?.program_name, student.program, student.program_interest, student.course_interest].filter(Boolean).join(" "));
  const countryText = normalize([student.nationality, student.country_of_qualification, student.education_country, student.country, student.country_name].filter(Boolean).join(" "));
  const selected = UNIVERSITY_REQUIREMENT_LIBRARY.filter((template) => {
    if (!isLevelMatch(template, level)) return false;
    if (template.priority === "core") return true;
    if (template.priority === "recommended") {
      if (template.countries?.length && !hasCountryMatch(template, countryText)) return false;
      if (template.programKeywords?.length && !hasProgramKeyword(template, programmeText)) return false;
      return true;
    }
    if (hasProgramKeyword(template, programmeText)) return true;
    if (hasCountryMatch(template, countryText)) return true;
    return false;
  });
  const order={core:0,recommended:1,conditional:2};
  return [...selected].sort((a,b)=>(order[a.priority]??9)-(order[b.priority]??9)||a.name.localeCompare(b.name));
}

export function groupUniversityRequirements(requirements = []) {
  const groups = new Map();
  for (const requirement of Array.isArray(requirements) ? requirements : []) {
    const meta = getUniversityRequirementMeta(requirement);
    const key = meta.category || "general";
    if (!groups.has(key)) groups.set(key, { id:key, label:meta.categoryLabel, description:meta.categoryDescription, requirements:[] });
    groups.get(key).requirements.push(requirement);
  }
  return Array.from(groups.values()).sort((a,b)=>a.label.localeCompare(b.label));
}

export function getUniversityRequirementLibraryStats() {
  const byCategory=Object.fromEntries(Object.keys(UNIVERSITY_REQUIREMENT_CATEGORIES).map((category)=>[category,UNIVERSITY_REQUIREMENT_LIBRARY.filter((item)=>item.category===category).length]));
  return {total:UNIVERSITY_REQUIREMENT_LIBRARY.length,byCategory};
}
