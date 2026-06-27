import type { AnalysisGrade, AnalysisResult } from "@/types/flower";

export type RedisJobImage = {
  kind: "base64";
  role: "main" | "additional";
  view: string;
  label: string;
  index: number;
  mimeType: string;
  filename: string;
  dataBase64: string;
};

export type FloraiRedisJob = {
  schemaVersion: "florai.redis.job.v1";
  jobId: string;
  status: "queued";
  createdAt: string;
  input: {
    taxonomy?: Record<string, unknown>;
    measurements?: Record<string, unknown>;
    userObservations?: Record<string, unknown>;
    captureGuide?: Record<string, unknown>;
    memo?: string;
    shippedAt?: string;
  };
  /** @deprecated use images[0] instead. Kept for old worker compatibility. */
  image?: RedisJobImage;
  images: RedisJobImage[];
  modelRequest: {
    task: "quality_grading";
    pipeline: "condition_then_grade";
    returnEvidence: true;
    returnDescription: true;
  };
};

export type AnalyzeQueuedResponse = {
  ok: true;
  mode: "redis";
  jobId: string;
  status: "queued";
  pollUrl: string;
};

export type AnalyzeCompletedResponse = AnalysisResult;

export type AnalyzeStatusResponse =
  | {
      ok: true;
      mode: "redis";
      jobId: string;
      status: "queued" | "processing";
    }
  | {
      ok: true;
      mode: "redis";
      jobId: string;
      status: "completed";
      result: AnalysisResult;
    }
  | {
      ok: false;
      mode: "redis";
      jobId: string;
      status: "not_found" | "failed";
      error: {
        code: string;
        message: string;
        detail?: unknown;
      };
    };

export function getWorkerResultStatus(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const maybe = raw as Record<string, unknown>;
  if (typeof maybe.status === "string") return maybe.status;
  return null;
}

export function getWorkerResultErrorMessage(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "worker 결과가 객체 형식이 아닙니다.";
  }

  const maybe = raw as Record<string, unknown>;
  const error = maybe.error as Record<string, unknown> | undefined;
  const description = maybe.description as Record<string, unknown> | undefined;
  const warnings = description?.warnings;

  if (typeof error?.message === "string") return error.message;
  if (typeof maybe.message === "string") return maybe.message;
  if (Array.isArray(warnings) && warnings.length > 0) return String(warnings[0]);
  if (typeof description?.summary === "string") return description.summary;

  return "worker가 실패 결과를 반환했습니다.";
}

export function normalizeWorkerResult(raw: unknown): AnalysisResult | null {
  const unwrapped = unwrapWorkerResult(raw);
  if (!unwrapped || typeof unwrapped !== "object") return null;

  const maybe = unwrapped as Record<string, unknown>;
  if (typeof maybe.summary === "string" && Array.isArray(maybe.reasons)) {
    return maybe as AnalysisResult;
  }

  const prediction = maybe.prediction as Record<string, unknown> | undefined;
  const condition = prediction?.condition as Record<string, unknown> | undefined;
  const grade = prediction?.grade as Record<string, unknown> | undefined;
  const evidence = maybe.evidence as Record<string, unknown> | undefined;
  const description = maybe.description as Record<string, unknown> | undefined;

  if (!prediction || !description) return null;

  const conditionLabel = condition?.label === "abnormal" ? "abnormal" : "normal";
  const gradeKo = normalizeGradeLabel(String(grade?.labelKo || grade?.label || "상"));
  const confidence = Number(grade?.confidence || condition?.confidence || 0.8);
  const standardReferences = Array.isArray(evidence?.standardReferences)
    ? evidence.standardReferences
    : [];
  const perImageFindings = Array.isArray(evidence?.perImageFindings)
    ? evidence.perImageFindings
    : Array.isArray(maybe.perImageFindings)
      ? maybe.perImageFindings
      : [];

  return {
    condition: conditionLabel,
    grade: conditionLabel === "abnormal" ? "비정상" : gradeKo,
    confidence: Math.round(confidence > 1 ? confidence : confidence * 100),
    summary: String(description.summary || "분석이 완료되었습니다."),
    reasons: asStringArray(description.reasons),
    warnings: asStringArray(description.warnings),
    recommendation: String(description.recommendation || "추가 검수를 권장합니다."),
    imageCount: Number(maybe.imageCount || perImageFindings.length || 0) || undefined,
    perImageFindings: normalizePerImageFindings(perImageFindings),
    evidence: standardReferences.map((item, index) => {
      const reference = item as Record<string, unknown>;
      return {
        title: String(reference.title || `근거 ${index + 1}`),
        body: String(reference.matchedRule || reference.body || "표준규격 근거가 반환되었습니다."),
      };
    }),
  };
}

function normalizePerImageFindings(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const findings = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        view: String(record.view || "additional"),
        label: String(record.label || "추가 이미지"),
        findings: asStringArray(record.findings),
      };
    })
    .filter(Boolean) as Array<{ view: string; label: string; findings: string[] }>;

  return findings.length > 0 ? findings : undefined;
}

function unwrapWorkerResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const maybe = raw as Record<string, unknown>;
  const wrapperKeys = ["result", "analysisResult", "output", "data"];

  for (const key of wrapperKeys) {
    const value = maybe[key];
    if (value && typeof value === "object") return value;
  }

  return raw;
}

function normalizeGradeLabel(label: string): Exclude<AnalysisGrade, "비정상"> {
  if (label === "special") return "특";
  if (label === "high") return "상";
  if (label === "normal") return "보통";
  if (label.includes("특")) return "특";
  if (label.includes("상")) return "상";
  return "보통";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}
