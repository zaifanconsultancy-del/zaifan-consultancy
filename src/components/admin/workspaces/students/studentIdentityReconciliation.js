import { supabase } from "../../../../lib/supabaseClient";

const TABLE_BY_TYPE = Object.freeze({
  inquiry: "inquiries",
  appointment: "appointments",
});

function normalizeType(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "appointment"
    ? "appointment"
    : "inquiry";
}

function safeRecordIdentity(record) {
  return {
    id: record?.id,
    type: normalizeType(
      record?.student_type || record?.__leadType || record?.type || "inquiry"
    ),
    personId: String(record?.person_id || "").trim(),
  };
}

function assertRecord(record) {
  const identity = safeRecordIdentity(record);

  if (identity.id === null || identity.id === undefined || identity.id === "") {
    throw new Error("A source record is missing its ID.");
  }

  if (!TABLE_BY_TYPE[identity.type]) {
    throw new Error(`Unsupported student record type: ${identity.type}`);
  }

  return identity;
}

export function createPersonId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  // UUID-like fallback for older browser engines.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function updatePersonId({ table, id, personId }) {
  const { data, error } = await supabase
    .from(table)
    .update({ person_id: personId })
    .eq("id", id)
    .select("id, person_id")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      `The ${table} record #${id} was not updated. Check RLS/permissions and that the record still exists.`
    );
  }

  return data;
}

async function rollbackUpdates(completed = []) {
  const rollbackErrors = [];

  for (const item of [...completed].reverse()) {
    try {
      await updatePersonId({
        table: item.table,
        id: item.id,
        personId: item.previousPersonId || null,
      });
    } catch (error) {
      rollbackErrors.push({
        ...item,
        error: error?.message || String(error),
      });
    }
  }

  return rollbackErrors;
}

function conflictingPersonIds(records = []) {
  return [
    ...new Set(
      records
        .map((record) => String(record?.person_id || "").trim())
        .filter(Boolean)
    ),
  ];
}

export function inspectReconciliation(records = []) {
  const usable = records.filter(Boolean);
  const personIds = conflictingPersonIds(usable);

  return {
    recordCount: usable.length,
    existingPersonIds: personIds,
    hasConflict: personIds.length > 1,
    canLink: usable.length >= 2 && personIds.length <= 1,
    targetPersonId: personIds[0] || "",
  };
}

/**
 * Persist a reviewed set of inquiry/appointment rows under one person_id.
 *
 * Safety:
 * - requires at least two rows;
 * - refuses to silently combine different existing person_ids;
 * - updates one row at a time and best-effort rolls back if a later write fails;
 * - does not delete or merge source rows.
 */
export async function linkStudentRecords({
  records = [],
  targetPersonId = "",
} = {}) {
  const identities = records.map(assertRecord);
  const inspection = inspectReconciliation(records);

  if (identities.length < 2) {
    throw new Error("Choose at least two source records to link.");
  }

  if (inspection.hasConflict) {
    throw new Error(
      "These records already belong to different permanent Person IDs. Separate/review them before linking."
    );
  }

  const personId =
    String(targetPersonId || inspection.targetPersonId || "").trim() ||
    createPersonId();

  const completed = [];

  try {
    for (let index = 0; index < identities.length; index += 1) {
      const identity = identities[index];
      const source = records[index];
      const table = TABLE_BY_TYPE[identity.type];

      if (identity.personId === personId) continue;

      await updatePersonId({
        table,
        id: identity.id,
        personId,
      });

      completed.push({
        table,
        id: identity.id,
        previousPersonId: identity.personId || null,
        source,
      });
    }

    return {
      personId,
      updatedCount: completed.length,
      linkedCount: identities.length,
    };
  } catch (error) {
    const rollbackErrors = await rollbackUpdates(completed);

    const rollbackMessage = rollbackErrors.length
      ? ` ${rollbackErrors.length} rollback operation(s) also failed; refresh and verify the affected records before continuing.`
      : " Earlier writes were rolled back.";

    throw new Error(
      `${error?.message || "Identity reconciliation failed."}${rollbackMessage}`
    );
  }
}

/**
 * Explicitly split one source record away from its current person by assigning
 * a new permanent person_id. The source record itself is preserved.
 */
export async function separateStudentRecord({ record } = {}) {
  const identity = assertRecord(record);
  const table = TABLE_BY_TYPE[identity.type];
  const newPersonId = createPersonId();

  const updated = await updatePersonId({
    table,
    id: identity.id,
    personId: newPersonId,
  });

  return {
    personId: newPersonId,
    previousPersonId: identity.personId || "",
    record: updated,
  };
}