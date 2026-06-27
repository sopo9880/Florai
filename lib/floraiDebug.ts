const DEBUG_VALUES = new Set(["1", "true", "yes", "on"]);

export function isFloraiDebugEnabled() {
  return DEBUG_VALUES.has(String(process.env.FLORAI_DEBUG_LOG || "").toLowerCase());
}

export function debugLog(label: string, data?: unknown) {
  if (!isFloraiDebugEnabled()) return;

  const time = new Date().toISOString();
  const prefix = `[Florai Debug][${time}] ${label}`;

  if (typeof data === "undefined") {
    console.log(prefix);
    return;
  }

  console.log(`${prefix}\n${JSON.stringify(redactForLog(data), null, 2)}`);
}

export function summarizeFormDataForLog(formData: FormData) {
  const summary: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    appendSummaryValue(summary, key, summarizeFormDataValue(key, value));
  }

  return summary;
}

function appendSummaryValue(summary: Record<string, unknown>, key: string, value: unknown) {
  if (!(key in summary)) {
    summary[key] = value;
    return;
  }

  const current = summary[key];
  summary[key] = Array.isArray(current) ? [...current, value] : [current, value];
}

function summarizeFormDataValue(key: string, value: FormDataEntryValue) {
  if (value instanceof File) {
    return {
      kind: "File",
      name: value.name,
      type: value.type || "application/octet-stream",
      sizeBytes: value.size,
    };
  }

  if (typeof value === "string" && value.startsWith("data:")) {
    const [header, body = ""] = value.split(",");
    return {
      kind: "data-url",
      mimeType: header.match(/^data:([^;]+)/)?.[1] || "unknown",
      base64Length: body.length,
      base64Preview: `${body.slice(0, 32)}...`,
    };
  }

  if (key.toLowerCase().includes("payload") || key.toLowerCase().includes("imagemeta")) {
    return tryParseJson(String(value));
  }

  return value;
}

export function redactForLog(value: unknown): unknown {
  if (value === null || typeof value === "undefined") return value;

  if (typeof value === "string") {
    if (value.length > 300) {
      return `${value.slice(0, 180)}... [truncated ${value.length} chars]`;
    }
    return value;
  }

  if (typeof value !== "object") return value;

  if (value instanceof File) {
    return {
      kind: "File",
      name: value.name,
      type: value.type || "application/octet-stream",
      sizeBytes: value.size,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item));
  }

  const record = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(record)) {
    const lowered = key.toLowerCase();

    if (lowered.includes("password") || lowered.includes("token") || lowered.includes("secret")) {
      output[key] = "[redacted]";
      continue;
    }

    if (key === "dataBase64" && typeof item === "string") {
      output[key] = {
        kind: "base64",
        length: item.length,
        preview: `${item.slice(0, 32)}...`,
      };
      continue;
    }

    output[key] = redactForLog(item);
  }

  return output;
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
