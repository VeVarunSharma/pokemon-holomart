export function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function cardsToCsv(items) {
  const columns = [
    ["ID", "id"],
    ["Card", "name"],
    ["Expansion", "set"],
    ["Number", "number"],
    ["Rarity", "rarity"],
    ["Condition", "condition"],
    ["Price", "price"],
    ["Market price", "marketPrice"],
    ["Seller", "seller"],
    ["Stock", "stock"]
  ];
  return [
    columns.map(([heading]) => escapeCsv(heading)).join(","),
    ...items.map((item) => columns.map(([, key]) => escapeCsv(item[key])).join(","))
  ].join("\r\n");
}

export function downloadCsv(items, documentRef = document) {
  const blob = new Blob([cardsToCsv(items)], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = documentRef.createElement("a");
  link.href = href;
  link.download = `holomart-card-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(href);
}
