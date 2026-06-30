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
  const error = getRecord(maybe.error);
  const description = getRecord(maybe.description);
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
    return normalizeFlatAnalysisResult(maybe);
  }

  const prediction = getRecord(maybe.prediction);
  const condition = getRecord(prediction?.condition);
  const grade = getRecord(prediction?.grade);
  const evidence = getRecord(maybe.evidence);
  const description = getRecord(maybe.description);
  const report = getRecord(maybe.report);
  const classifierExplanation = getRecord(maybe.classifierExplanation);
  const gradeAssessment = getRecord(classifierExplanation?.gradeAssessment) ?? getRecord(report?.gradeReasoning);

  if (!prediction || !description) return null;

  const originalLabel = getOriginalLabel(maybe, prediction, grade, condition, gradeAssessment);
  const originalGrade = originalLabel ? normalizeGradeLabel(originalLabel) : null;
  const originalMarksAbnormal = originalGrade === "비정상";
  const conditionLabel =
    condition?.label === "abnormal" || originalMarksAbnormal ? "abnormal" : "normal";
  const gradeCandidate =
    originalGrade && originalGrade !== "비정상"
      ? originalGrade
      : normalizeGradeLabel(
          String(
            grade?.labelKo ||
              grade?.label ||
              gradeAssessment?.labelKo ||
              gradeAssessment?.label ||
              report?.gradeReasoning && getRecord(report.gradeReasoning)?.candidate ||
              "상",
          ),
        );
  const confidence = Number(grade?.confidence || gradeAssessment?.confidence || condition?.confidence || 0.8);

  const reportExecutiveSummary = asStringArray(report?.executiveSummary);
  const classifierExecutiveSummary = asStringArray(classifierExplanation?.executiveSummary);
  const normalEvidence = asStringArray(classifierExplanation?.normalEvidence);
  const detailedAssessment = getArray(report?.detailedAssessment).length > 0
    ? getArray(report?.detailedAssessment)
    : getArray(classifierExplanation?.detailedAssessment);
  const detailedReasons = normalizeDetailedAssessment(detailedAssessment);
  const gradeReasoningReasons = normalizeGradeReasoning(gradeAssessment);
  const descriptionReasons = asStringArray(description?.reasons);

  const reasons = uniqueStrings([
    ...descriptionReasons,
    ...reportExecutiveSummary,
    ...classifierExecutiveSummary,
    ...normalEvidence,
    ...detailedReasons,
    ...gradeReasoningReasons,
  ]).slice(0, 12);

  const warnings = uniqueStrings([
    ...asStringArray(description?.warnings),
    ...asStringArray(report?.warnings),
    ...asStringArray(classifierExplanation?.limitations),
    ...asStringArray(report?.limitations),
  ]).slice(0, 8);

  const summary = String(
    report?.headline ||
      classifierExplanation?.headline ||
      description?.summary ||
      classifierExplanation?.summary ||
      "분석이 완료되었습니다.",
  );

  const recommendation = String(
    report?.recommendation ||
      description?.recommendation ||
      classifierExplanation?.recommendation ||
      gradeAssessment?.reasoning ||
      "추가 검수를 권장합니다.",
  );

  const standardReferences = getArray(evidence?.standardReferences);
  const criteriaChunks = getArray(evidence?.criteriaChunks);
  const citations = getArray(report?.citations).length > 0
    ? getArray(report?.citations)
    : getArray(classifierExplanation?.citations);
  const evidenceCards = normalizeEvidenceCards({ citations, standardReferences, criteriaChunks });

  const perImageFindings = getArray(evidence?.perImageFindings).length > 0
    ? getArray(evidence?.perImageFindings)
    : getArray(maybe.perImageFindings);

  return {
    condition: conditionLabel,
    grade: conditionLabel === "abnormal" ? "비정상" : gradeCandidate,
    originalLabel: originalLabel || undefined,
    confidence: Math.round(confidence > 1 ? confidence : confidence * 100),
    summary,
    reasons,
    warnings,
    recommendation,
    imageCount: Number(maybe.imageCount || perImageFindings.length || 0) || undefined,
    perImageFindings: normalizePerImageFindings(perImageFindings),
    evidence: evidenceCards,
    measurements: normalizeMeasurements(evidence?.normalizedInput),
  };
}

function normalizeFlatAnalysisResult(maybe: Record<string, unknown>): AnalysisResult {
  const originalLabel = getOriginalLabel(maybe);
  const originalGrade = originalLabel ? normalizeGradeLabel(originalLabel) : null;
  const currentGrade = normalizeGradeLabel(String(maybe.grade || "상"));
  const grade = originalGrade || currentGrade;
  const condition =
    maybe.condition === "abnormal" || grade === "비정상" ? "abnormal" : "normal";
  const confidence = Number(maybe.confidence || 80);

  return {
    ...(maybe as AnalysisResult),
    condition,
    grade: condition === "abnormal" ? "비정상" : grade,
    originalLabel: originalLabel || (maybe as AnalysisResult).originalLabel,
    confidence: Math.round(confidence > 1 ? confidence : confidence * 100),
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

function getOriginalLabel(...records: Array<Record<string, unknown> | undefined>) {
  for (const record of records) {
    if (!record) continue;
    const value = record.originalLabel ?? record.original_label ?? record.rawLabel ?? record.raw_label;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function normalizeGradeLabel(label: string): AnalysisGrade {
  const normalized = label.trim().toLowerCase();
  const compact = normalized.replace(/[\s_-]/g, "");

  if (
    ["abnormal", "bad", "defect", "defective", "reject", "rejected", "fail", "ng"].includes(compact) ||
    label.includes("비정상") ||
    label.includes("불량") ||
    label.includes("결함") ||
    label.includes("이상")
  ) {
    return "비정상";
  }

  if (
    ["special", "excellent", "best", "premium", "grade1", "class1", "label1", "1", "a", "s"].includes(compact) ||
    label.includes("특") ||
    label.includes("1급")
  ) {
    return "특";
  }

  if (
    ["high", "good", "grade2", "class2", "label2", "2", "b"].includes(compact) ||
    label.includes("상") ||
    label.includes("2급")
  ) {
    return "상";
  }

  if (
    ["normal", "average", "common", "medium", "grade3", "class3", "label3", "3", "c"].includes(compact) ||
    label.includes("보통") ||
    label.includes("3급")
  ) {
    return "보통";
  }

  return "보통";
}

function normalizeDetailedAssessment(value: unknown[]) {
  return value
    .map((item) => {
      const record = getRecord(item);
      if (!record) return "";
      const dimension = stringOrEmpty(record.dimension);
      const status = stringOrEmpty(record.status);
      const description = stringOrEmpty(record.description);
      if (!dimension && !description) return "";
      if (dimension && status && description) return `${dimension} · ${status}: ${description}`;
      if (dimension && description) return `${dimension}: ${description}`;
      return description;
    })
    .filter(Boolean);
}

function normalizeGradeReasoning(value: Record<string, unknown> | undefined) {
  if (!value) return [];

  return uniqueStrings([
    stringOrEmpty(value.reasoning),
    ...asStringArray(value.whyNotHigher).map((text) => `상위 등급 제외 근거: ${text}`),
    ...asStringArray(value.whyNotLower).map((text) => `하위 등급 제외 근거: ${text}`),
  ]).filter(Boolean);
}

function normalizeEvidenceCards({
  citations,
  standardReferences,
  criteriaChunks,
}: {
  citations: unknown[];
  standardReferences: unknown[];
  criteriaChunks: unknown[];
}) {
  const citationCards = citations
    .map((item, index) => {
      const citation = getRecord(item);
      if (!citation) return null;
      const grade = stringOrEmpty(citation.grade);
      const criterion = stringOrEmpty(citation.criterion);
      const documentName = stringOrEmpty(citation.documentName);
      const titleParts = [criterion || `근거 ${index + 1}`, grade && `${grade} 기준`].filter(Boolean);
      return {
        title: titleParts.join(" · ") || `근거 ${index + 1}`,
        body: [
          stringOrEmpty(citation.rule),
          documentName ? `출처: ${documentName}` : "",
          stringOrEmpty(citation.sectionPath),
        ]
          .filter(Boolean)
          .join("\n"),
      };
    })
    .filter((item): item is { title: string; body: string } => Boolean(item && item.body));

  if (citationCards.length > 0) return dedupeEvidence(citationCards).slice(0, 8);

  const usefulCriteria = criteriaChunks
    .map((item, index) => {
      const chunk = getRecord(item);
      if (!chunk) return null;
      const rule = stringOrEmpty(chunk.rule);
      const criterion = stringOrEmpty(chunk.criterion);
      const grade = stringOrEmpty(chunk.grade);
      if (!rule || rule.length < 4) return null;
      if (["schema_version", "document_type", "scope", "language"].includes(criterion)) return null;
      return {
        title: [criterion || `기준 ${index + 1}`, grade].filter(Boolean).join(" · ") || `기준 ${index + 1}`,
        body: [rule, stringOrEmpty(chunk.documentName), stringOrEmpty(chunk.sectionPath)].filter(Boolean).join("\n"),
      };
    })
    .filter((item): item is { title: string; body: string } => Boolean(item));

  if (usefulCriteria.length > 0) return dedupeEvidence(usefulCriteria).slice(0, 6);

  return standardReferences
    .map((item, index) => {
      const reference = getRecord(item);
      if (!reference) return null;
      const scope = stringOrEmpty(reference.scope);
      const title = scope ? `${scope} 기준 문서` : `근거 ${index + 1}`;
      return {
        title,
        body: String(reference.matchedRule || reference.body || reference.path || "표준규격 근거가 반환되었습니다."),
      };
    })
    .filter((item): item is { title: string; body: string } => Boolean(item))
    .slice(0, 4);
}

function normalizeMeasurements(normalizedInput: unknown) {
  const input = getRecord(normalizedInput);
  const measurements = getRecord(input?.measurements);
  if (!measurements) return undefined;

  const labelMap: Record<string, string> = {
    stem_length_cm: "줄기 길이(cm)",
    bundle_count: "묶음 본수",
    leaf_area_cm2: "잎 면적(cm²)",
    pot_size_ho: "화분 호수",
    pot_top_diameter_cm: "화분 윗지름(cm)",
    pot_bottom_diameter_cm: "화분 밑지름(cm)",
    pot_height_cm: "화분 높이(cm)",
    potted_stem_length_cm: "줄기 길이(cm)",
  };

  const items = Object.entries(measurements)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => ({
      label: labelMap[key] || key,
      value: String(value),
    }));

  return items.length > 0 ? items : undefined;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value).trim()
    : "";
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
}

function dedupeEvidence(items: Array<{ title: string; body: string }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title}\n${item.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
