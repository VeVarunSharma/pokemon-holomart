export function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function feedbackToCsv(items) {
  const columns = [
    ["ID", "id"],
    ["Company", "company"],
    ["Channel", "channel"],
    ["Theme", "theme"],
    ["Sentiment", "sentiment"],
    ["Plan", "plan"],
    ["Date", "date"],
    ["Feedback", "excerpt"],
    ["Votes", "votes"]
  ];
  return [
    columns.map(([heading]) => escapeCsv(heading)).join(","),
    ...items.map((item) => columns.map(([, key]) => escapeCsv(item[key])).join(","))
  ].join("\r\n");
}

export function downloadCsv(items, documentRef = document) {
  const blob = new Blob([feedbackToCsv(items)], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = documentRef.createElement("a");
  link.href = href;
  link.download = `signal-desk-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(href);
}
