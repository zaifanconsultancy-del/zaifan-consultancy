const NORMALIZED_EMPTY = "";

export function normalizeIdentityText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeIdentityEmail(value) {
  return normalizeIdentityText(value);
}

export function normalizeIdentityPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return NORMALIZED_EMPTY;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return NORMALIZED_EMPTY;

  // Compare the most stable national/international tail while avoiding
  // formatting differences such as +92, 0092, spaces and dashes.
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizeStudentType(value) {
  const normalized = normalizeIdentityText(value);
  return normalized === "appointment" ? "appointment" : "inquiry";
}

function getLeadType(lead) {
  return normalizeStudentType(
    lead?.student_type || lead?.__leadType || lead?.type || "inquiry"
  );
}

function getLeadName(lead) {
  return (
    lead?.full_name ||
    lead?.name ||
    lead?.student_name ||
    lead?.applicant_name ||
    "Unnamed student"
  );
}

function getCreatedAt(lead) {
  return (
    lead?.created_at ||
    lead?.updated_at ||
    lead?.appointment_date ||
    lead?.date ||
    null
  );
}

function safeTimestamp(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getPortalSourceIdentity(account) {
  const id =
    account?.student_id ??
    account?.studentId ??
    account?.source_student_id ??
    account?.lead_id ??
    null;

  const type = normalizeStudentType(
    account?.student_type ||
      account?.studentType ||
      account?.source_student_type ||
      account?.lead_type ||
      "inquiry"
  );

  if (id === null || id === undefined || id === "") return "";

  return `${String(id)}:${type}`;
}

function leadSourceIdentity(lead) {
  if (!lead?.id) return "";
  return `${String(lead.id)}:${getLeadType(lead)}`;
}

function getStatusScore(lead) {
  const status = normalizeIdentityText(
    lead?.status || lead?.stage || lead?.appointment_status
  );

  if (
    [
      "approved",
      "active",
      "confirmed",
      "completed",
      "contacted",
      "qualified",
      "converted",
      "submitted",
      "offer received",
    ].some((token) => status.includes(token))
  ) {
    return 35;
  }

  if (
    ["cancelled", "canceled", "rejected", "withdrawn", "closed-lost"].some(
      (token) => status.includes(token)
    )
  ) {
    return -45;
  }

  return 0;
}

function primaryRecordScore(lead, portalAccounts = []) {
  let score = getStatusScore(lead);
  const sourceIdentity = leadSourceIdentity(lead);

  if (lead?.person_id) score += 80;

  if (
    portalAccounts.some(
      (account) =>
        getPortalSourceIdentity(account) === sourceIdentity ||
        (lead?.person_id &&
          String(account?.person_id || "") === String(lead.person_id))
    )
  ) {
    score += 120;
  }

  // Inquiry is normally the original acquisition identity and is safer than
  // an old cancelled appointment when everything else is equal.
  if (getLeadType(lead) === "inquiry") score += 8;

  // Current/recent evidence wins only as a tiebreaker.
  score += Math.min(20, safeTimestamp(getCreatedAt(lead)) / 1e12);

  return score;
}

function buildHeuristicFingerprint(lead) {
  const email = normalizeIdentityEmail(lead?.email);
  const phone = normalizeIdentityPhone(lead?.phone);
  const name = normalizeIdentityText(getLeadName(lead));

  // A heuristic match always requires at least two human signals.
  if (email && phone) return `email-phone:${email}|${phone}`;
  if (email && name) return `email-name:${email}|${name}`;
  if (phone && name) return `phone-name:${phone}|${name}`;

  return "";
}

function getExplicitIdentityKey(lead) {
  const personId = String(lead?.person_id || "").trim();
  return personId ? `person:${personId}` : "";
}

function getPortalPersonIdForLead(lead, portalAccounts) {
  const sourceIdentity = leadSourceIdentity(lead);

  const matched = portalAccounts.find(
    (account) => getPortalSourceIdentity(account) === sourceIdentity
  );

  return String(matched?.person_id || "").trim();
}

function getGroupIdentityKey(lead, portalAccounts) {
  const explicit = getExplicitIdentityKey(lead);
  if (explicit) return { key: explicit, confidence: "verified" };

  const portalPersonId = getPortalPersonIdForLead(lead, portalAccounts);
  if (portalPersonId) {
    return {
      key: `person:${portalPersonId}`,
      confidence: "portal-linked",
    };
  }

  const heuristic = buildHeuristicFingerprint(lead);
  if (heuristic) {
    return {
      key: `candidate:${heuristic}`,
      confidence: "review",
    };
  }

  return {
    key: `source:${leadSourceIdentity(lead) || cryptoFallback(lead)}`,
    confidence: "unlinked",
  };
}

function cryptoFallback(lead) {
  const email = normalizeIdentityEmail(lead?.email);
  const phone = normalizeIdentityPhone(lead?.phone);
  const name = normalizeIdentityText(getLeadName(lead));
  return `${name}|${email}|${phone}`;
}

function shortPersonId(personId) {
  const value = String(personId || "").trim();
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-5)}`;
}

function findPortalAccountsForGroup(records, personId, portalAccounts) {
  const sourceIds = new Set(records.map(leadSourceIdentity).filter(Boolean));

  return portalAccounts.filter((account) => {
    if (
      personId &&
      String(account?.person_id || "").trim() === String(personId).trim()
    ) {
      return true;
    }

    return sourceIds.has(getPortalSourceIdentity(account));
  });
}

function chooseCanonicalName(records) {
  const names = records
    .map((record) => getLeadName(record))
    .filter((name) => name && name !== "Unnamed student");

  return names[0] || "Unnamed student";
}

function chooseCanonicalEmail(records, portalAccounts) {
  const portalEmail = portalAccounts
    .map((account) => account?.email || account?.student_email)
    .find(Boolean);

  return (
    portalEmail ||
    records.map((record) => record?.email).find(Boolean) ||
    ""
  );
}

function chooseCanonicalPhone(records) {
  return records.map((record) => record?.phone).find(Boolean) || "";
}

function confidenceRank(value) {
  return {
    verified: 4,
    "portal-linked": 3,
    review: 2,
    unlinked: 1,
  }[value] || 0;
}

export function buildCanonicalStudents({
  inquiries = [],
  appointments = [],
  portalAccounts = [],
} = {}) {
  const leads = [
    ...inquiries.map((lead) => ({
      ...lead,
      __leadType: "inquiry",
    })),
    ...appointments.map((lead) => ({
      ...lead,
      __leadType: "appointment",
    })),
  ].filter((lead) => lead?.id !== null && lead?.id !== undefined);

  const groups = new Map();

  leads.forEach((lead) => {
    const identity = getGroupIdentityKey(lead, portalAccounts);
    const existing = groups.get(identity.key) || {
      key: identity.key,
      confidence: identity.confidence,
      records: [],
    };

    existing.records.push(lead);

    if (confidenceRank(identity.confidence) > confidenceRank(existing.confidence)) {
      existing.confidence = identity.confidence;
    }

    groups.set(identity.key, existing);
  });

  return [...groups.values()]
    .map((group) => {
      const personIdRecord = group.records.find((record) => record?.person_id);
      const personIdFromKey = group.key.startsWith("person:")
        ? group.key.slice("person:".length)
        : "";

      const personId =
        String(personIdRecord?.person_id || personIdFromKey || "").trim();

      const matchedPortalAccounts = findPortalAccountsForGroup(
        group.records,
        personId,
        portalAccounts
      );

      const primaryRecord = [...group.records].sort(
        (a, b) =>
          primaryRecordScore(b, matchedPortalAccounts) -
          primaryRecordScore(a, matchedPortalAccounts)
      )[0];

      const cancelledRecords = group.records.filter((record) => {
        const status = normalizeIdentityText(
          record?.status || record?.stage || record?.appointment_status
        );
        return status.includes("cancel");
      }).length;

      const activePortalAccount =
        matchedPortalAccounts.find((account) => account?.is_active !== false) ||
        matchedPortalAccounts[0] ||
        null;

      return {
        key: group.key,
        personId,
        personIdLabel: personId ? shortPersonId(personId) : "",
        confidence: group.confidence,
        requiresReview: ["review", "unlinked"].includes(group.confidence),
        name: chooseCanonicalName(group.records),
        email: chooseCanonicalEmail(group.records, matchedPortalAccounts),
        phone: chooseCanonicalPhone(group.records),
        records: group.records.sort(
          (a, b) => safeTimestamp(getCreatedAt(b)) - safeTimestamp(getCreatedAt(a))
        ),
        primaryRecord,
        portalAccounts: matchedPortalAccounts,
        portalAccount: activePortalAccount,
        portalConnected: Boolean(activePortalAccount),
        recordCount: group.records.length,
        cancelledRecords,
        lastActivityAt:
          group.records
            .map(getCreatedAt)
            .sort((a, b) => safeTimestamp(b) - safeTimestamp(a))[0] || null,
      };
    })
    .sort((a, b) => safeTimestamp(b.lastActivityAt) - safeTimestamp(a.lastActivityAt));
}

export function getCanonicalStudentStats(students = []) {
  return {
    total: students.length,
    verified: students.filter((student) =>
      ["verified", "portal-linked"].includes(student.confidence)
    ).length,
    review: students.filter((student) => student.requiresReview).length,
    portalConnected: students.filter((student) => student.portalConnected).length,
    multipleRecords: students.filter((student) => student.recordCount > 1).length,
  };
}

export function getRecordLabel(record) {
  if (!record) return "Unknown record";
  const type = getLeadType(record);
  return `${type === "appointment" ? "Appointment" : "Inquiry"} #${record.id}`;
}

export function getRecordStatus(record) {
  return (
    record?.status ||
    record?.stage ||
    record?.appointment_status ||
    "Unknown"
  );
}

export function getRecordType(record) {
  return getLeadType(record);
}
