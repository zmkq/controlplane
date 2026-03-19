function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: Array<keyof T>,
) {
  const headerLine = headers.join(',');
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(','),
  );

  return [headerLine, ...lines].join('\n');
}
