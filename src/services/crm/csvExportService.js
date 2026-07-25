const CSV_FORMULA_PREFIXES = new Set(["=", "+", "-", "@"]);

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFilename(filename = "export.csv") {
  const clean = String(filename ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  if (!clean) return "export.csv";
  return clean.toLowerCase().endsWith(".csv") ? clean : `${clean}.csv`;
}

function escapeCsvValue(value) {
  let text =
    value === null || value === undefined ? "" : String(value);

  // Prevent spreadsheet applications from interpreting exported user data
  // as a formula when the CSV is opened.
  const firstNonWhitespace = text.trimStart().charAt(0);

  if (CSV_FORMULA_PREFIXES.has(firstNonWhitespace)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCSVFile(filename, headers, rows) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("CSV download is only available in the browser.");
  }

  const safeHeaders = safeArray(headers);
  const safeRows = safeArray(rows);

  const lines = [
    safeHeaders.map(escapeCsvValue).join(","),
    ...safeRows.map((row) =>
      safeArray(row).map(escapeCsvValue).join(",")
    ),
  ];

  // UTF-8 BOM improves Excel compatibility for names and international text.
  const csvContent = `\uFEFF${lines.join("\r\n")}`;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = normalizeFilename(filename);
  link.style.display = "none";

  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();

    // Revoke on the next task so browsers have time to start the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}