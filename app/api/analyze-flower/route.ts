import { NextResponse } from "next/server";
import { enqueueAnalysisJob, isRedisEnabled } from "@/lib/floraiRedis";
import { debugLog, summarizeFormDataForLog } from "@/lib/floraiDebug";
import type {
  AnalyzeQueuedResponse,
  FloraiRedisJob,
  RedisJobImage,
} from "@/lib/floraiAnalysisContracts";
import type { AnalysisResult } from "@/types/flower";

export const runtime = "nodejs";

const concernPattern = new RegExp(
  "손상|시듦|시들|변색|상처|곰팡이|마름|마른|꺾임|병충해|갈변|황화|낙엽|이상",
);

type ParsedPayload = {
  taxonomy?: {
    categoryType?: string;
    item?: string;
    cultivar?: string;
    cultivarClassId?: string;
    cultivarClassName?: string;
  };
  measurements?: Record<string, string>;
  userObservations?: Record<string, string>;
  captureGuide?: Record<string, string>;
  images?: Array<Record<string, string | number>>;
  imageCount?: number;
  memo?: string;
  shippedAt?: string;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = parsePayload(formData);

  debugLog("ANALYZE_REQUEST_RECEIVED", {
    redisEnabled: isRedisEnabled(),
    formData: summarizeFormDataForLog(formData),
    parsedPayload: payload,
  });

  if (isRedisEnabled()) {
    try {
      const job = await createRedisJob(formData, payload);

      debugLog("REDIS_JOB_CREATED", job);

      await enqueueAnalysisJob(job.jobId, job);

      debugLog("REDIS_JOB_ENQUEUED", {
        jobId: job.jobId,
        status: job.status,
        schemaVersion: job.schemaVersion,
      });

      const response: AnalyzeQueuedResponse = {
        ok: true,
        mode: "redis",
        jobId: job.jobId,
        status: "queued",
        pollUrl: `/api/analyze-flower/status/${job.jobId}`,
      };

      debugLog("ANALYZE_QUEUED_RESPONSE", response);

      return NextResponse.json(response, { status: 202 });
    } catch (error) {
      debugLog("REDIS_JOB_ENQUEUE_ERROR", {
        message: error instanceof Error ? error.message : String(error),
      });
      console.error("Redis job enqueue failed", error);
      return NextResponse.json(
        {
          ok: false,
          mode: "redis",
          status: "failed",
          error: {
            code: "REDIS_ENQUEUE_FAILED",
            message:
              "분석 작업 등록에 실패했습니다. 서버 연결 상태를 확인해 주세요.",
          },
        },
        { status: 500 },
      );
    }
  }

  const mockResult = createMockAnalysisResult(formData, payload);
  debugLog("MOCK_ANALYSIS_RESPONSE", mockResult);

  return NextResponse.json(mockResult);
}

async function createRedisJob(
  formData: FormData,
  payload: ParsedPayload,
): Promise<FloraiRedisJob> {
  const jobId = createJobId();
  const images = await createJobImages(formData, payload);

  return {
    schemaVersion: "florai.redis.job.v1",
    jobId,
    status: "queued",
    createdAt: new Date().toISOString(),
    input: {
      taxonomy: payload.taxonomy ?? extractTaxonomy(formData),
      measurements: payload.measurements ?? extractMeasurements(formData),
      userObservations:
        payload.userObservations ?? extractUserObservations(formData),
      captureGuide: payload.captureGuide ?? extractCaptureGuide(formData),
      memo: payload.memo ?? getField(formData, "memo", ""),
      shippedAt: payload.shippedAt ?? getField(formData, "shippedAt", ""),
    },
    image: images[0],
    images,
    modelRequest: {
      task: "quality_grading",
      pipeline: "condition_then_grade",
      returnEvidence: true,
      returnDescription: true,
    },
  };
}

async function createJobImages(
  formData: FormData,
  payload: ParsedPayload,
): Promise<RedisJobImage[]> {
  const rawImages = formData.getAll("images");
  const fallbackImage = formData.get("image");
  const imageEntries =
    rawImages.length > 0 ? rawImages : fallbackImage ? [fallbackImage] : [];
  const metas = parseImageMetas(formData, payload);

  if (imageEntries.length === 0) {
    throw new Error("이미지 파일이 필요합니다.");
  }

  return Promise.all(
    imageEntries.map((rawImage, index) =>
      createJobImage(rawImage, getImageMeta(metas, index), index),
    ),
  );
}

async function createJobImage(
  rawImage: FormDataEntryValue,
  meta: Record<string, string | number>,
  index: number,
): Promise<RedisJobImage> {
  const view = String(meta.view || (index === 0 ? "front_full" : "additional"));
  const label = String(
    meta.label || (index === 0 ? "대표 사진" : `추가 사진 ${index + 1}`),
  );
  const role = index === 0 ? "main" : "additional";

  if (rawImage instanceof File) {
    const arrayBuffer = await rawImage.arrayBuffer();
    return {
      kind: "base64",
      role,
      view,
      label,
      index,
      mimeType: rawImage.type || "application/octet-stream",
      filename: rawImage.name || String(meta.filename || `florai-${view}.jpg`),
      dataBase64: Buffer.from(arrayBuffer).toString("base64"),
    };
  }

  if (typeof rawImage === "string" && rawImage.startsWith("data:")) {
    const [header, dataBase64 = ""] = rawImage.split(",");
    const mimeType = header.match(/^data:([^;]+)/)?.[1] || "image/jpeg";
    return {
      kind: "base64",
      role,
      view,
      label,
      index,
      mimeType,
      filename: String(meta.filename || `florai-${view}.jpg`),
      dataBase64,
    };
  }

  if (typeof rawImage === "string") {
    return {
      kind: "base64",
      role,
      view,
      label,
      index,
      mimeType: "image/jpeg",
      filename: String(meta.filename || `florai-${view}.jpg`),
      dataBase64: rawImage,
    };
  }

  throw new Error("지원하지 않는 이미지 형식입니다.");
}

function parseImageMetas(formData: FormData, payload: ParsedPayload) {
  const metasFromPayload = Array.isArray(payload.images) ? payload.images : [];
  const metasFromFormData = formData
    .getAll("imageMeta")
    .map((value) => {
      if (typeof value !== "string") return null;
      try {
        return JSON.parse(value) as Record<string, string | number>;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<Record<string, string | number>>;

  return metasFromFormData.length > 0 ? metasFromFormData : metasFromPayload;
}

function getImageMeta(
  metas: Array<Record<string, string | number>>,
  index: number,
) {
  return (
    metas.find((meta) => Number(meta.index) === index) ?? metas[index] ?? {}
  );
}

function createJobId() {
  const random = crypto.randomUUID().slice(0, 8);
  return `florai_${Date.now()}_${random}`;
}

function parsePayload(formData: FormData): ParsedPayload {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string" || !rawPayload) {
    return {};
  }

  try {
    return JSON.parse(rawPayload) as ParsedPayload;
  } catch {
    return {};
  }
}

function createMockAnalysisResult(formData: FormData, payload: ParsedPayload) {
  const taxonomy = payload.taxonomy ?? {};
  const measurements = payload.measurements ?? {};
  const observations = payload.userObservations ?? {};
  const categoryType =
    taxonomy.categoryType || getField(formData, "categoryType", "cut_flower");
  const item = taxonomy.item || getField(formData, "item", "화훼류");
  const cultivar = taxonomy.cultivar || getField(formData, "cultivar", "");
  const cultivarClassId =
    taxonomy.cultivarClassId || getField(formData, "cultivarClassId", "");
  const cultivarClassName =
    taxonomy.cultivarClassName ||
    getField(
      formData,
      "cultivarClassName",
      getDisplayClassName(item, cultivar),
    );
  const memo = payload.memo || getField(formData, "memo", "");
  const hasConcern = concernPattern.test(memo);
  const imageCount =
    Number(
      payload.imageCount ||
        payload.images?.length ||
        getField(formData, "imageCount", "1"),
    ) || 1;

  return categoryType === "potted_plant"
    ? createPottedPlantMock({
        cultivarClassName,
        cultivarClassId,
        measurements,
        observations,
        hasConcern,
        imageCount,
        imageMetas: payload.images,
      })
    : createCutFlowerMock({
        cultivarClassName,
        cultivarClassId,
        measurements,
        observations,
        hasConcern,
        imageCount,
        imageMetas: payload.images,
      });
}

function createPottedPlantMock({
  cultivarClassName,
  cultivarClassId,
  measurements,
  observations,
  hasConcern,
  imageCount,
  imageMetas,
}: {
  cultivarClassName: string;
  cultivarClassId: string;
  measurements: Record<string, string>;
  observations: Record<string, string>;
  hasConcern: boolean;
  imageCount: number;
  imageMetas?: Array<Record<string, string | number>>;
}): AnalysisResult {
  void cultivarClassId;
  const leafArea = measurements.leafArea || "미입력";
  const pottedStemLengthCm = measurements.pottedStemLengthCm || "미입력";
  const growthCondition = observations.growthCondition || "균형 양호";
  const floweringStatus = observations.floweringStatus || "꽃 없음";
  const abnormal =
    hasConcern ||
    [growthCondition, floweringStatus].some((value) =>
      /시듦|왜소|이상/.test(value),
    );

  return {
    condition: abnormal ? "abnormal" : "normal",
    grade: abnormal ? "비정상" : "상",
    confidence: abnormal ? 77 : 86,
    summary: abnormal
      ? `${cultivarClassName}에서 입력 조건상 생육 이상 가능성이 있어 추가 확인이 필요합니다.`
      : `${cultivarClassName}의 잎 면적과 전체 생육 상태가 전반적으로 양호합니다.`,
    reasons: [
      `품목·품종 정보를 수신했습니다.`,
      `${measurements.potSizeHo || "-"}호 화분 규격을 기준 물체로 함께 전달했습니다.`,
      `잎 면적은 '${leafArea}', 줄기 길이는 '${pottedStemLengthCm}cm'입니다.`,
      `개화 여부는 '${floweringStatus}', 전체 생육 상태는 '${growthCondition}'입니다.`,
      `총 ${imageCount}장의 멀티뷰 이미지를 수신했습니다.`,
    ],
    warnings: [
      "AI 보조 판정 결과이므로 출하 전 실물 상태를 한 번 더 확인해 주세요.",
      ...(hasConcern ? ["메모에 이상 징후 가능성이 포함되어 있습니다."] : []),
    ],
    recommendation: abnormal
      ? "화분 모양, 잎 면적, 줄기 길이가 잘 보이도록 가이드에 맞춰 재촬영해 주세요."
      : "화분 전체와 식물 끝부분이 잘 보이는 촬영 조건을 유지하면 판정 안정성이 높아집니다.",
    imageCount,
    perImageFindings: createMockPerImageFindings(imageMetas, imageCount),
    measurements: [
      { label: "화분 호수", value: `${measurements.potSizeHo || "-"}호` },
      { label: "윗지름", value: `${measurements.potTopDiameterCm || "-"}cm` },
      {
        label: "밑지름",
        value: `${measurements.potBottomDiameterCm || "-"}cm`,
      },
      { label: "높이", value: `${measurements.potHeightCm || "-"}cm` },
      { label: "잎 면적", value: leafArea },
      { label: "줄기 길이", value: `${pottedStemLengthCm}cm` },
    ],
  };
}

function createCutFlowerMock({
  cultivarClassName,
  cultivarClassId,
  measurements,
  observations,
  hasConcern,
  imageCount,
  imageMetas,
}: {
  cultivarClassName: string;
  cultivarClassId: string;
  measurements: Record<string, string>;
  observations: Record<string, string>;
  hasConcern: boolean;
  imageCount: number;
  imageMetas?: Array<Record<string, string | number>>;
}): AnalysisResult {
  void cultivarClassId;
  const stemLength = Number(measurements.stemLengthCm || 0);
  const floweringStage = observations.floweringStage || "4/5 개화";
  const leafArea = measurements.leafArea || "미입력";
  const abnormal = hasConcern || floweringStage === "미개화/과개화";
  const grade: AnalysisResult["grade"] = abnormal
    ? "비정상"
    : stemLength >= 70 && floweringStage === "4/5 개화"
      ? "특"
      : stemLength >= 60
        ? "상"
        : "보통";

  return {
    condition: abnormal ? "abnormal" : "normal",
    grade,
    confidence: abnormal ? 76 : grade === "특" ? 90 : grade === "상" ? 84 : 73,
    summary: abnormal
      ? `${cultivarClassName}에서 개화 상태 또는 메모상 이상 가능성이 있어 추가 검수가 필요합니다.`
      : `${cultivarClassName}는 입력된 줄기 길이·개화 정도·잎 면적 기준으로 ${grade} 등급 후보입니다.`,
    reasons: [
      `품목·품종 정보를 수신했습니다.`,
      `꽃대/줄기 길이 ${measurements.stemLengthCm || "미입력"}cm, 묶음 본수 ${measurements.bundleCount || "미입력"}본입니다.`,
      `개화 정도는 '${floweringStage}', 잎 면적은 '${leafArea}'입니다.`,
      `총 ${imageCount}장의 멀티뷰 이미지를 수신했습니다.`,
      "절화류는 자를 함께 촬영하도록 안내하여 이미지 내 줄기 신장 추정을 보조합니다.",
    ],
    warnings: [
      "AI 보조 판정 결과이므로 출하 전 실물 상태를 한 번 더 확인해 주세요.",
      ...(hasConcern
        ? ["메모에 손상·변색·시듦 등 품질 저하 가능성이 포함되어 있습니다."]
        : []),
    ],
    recommendation: abnormal
      ? "개화 정도와 잎 면적이 잘 보이도록 재촬영하고, 자가 함께 포함되었는지 확인해 주세요."
      : "자를 함께 촬영하고 품질 판정 기준과 비교하면 설명 신뢰도가 높아집니다.",
    imageCount,
    perImageFindings: createMockPerImageFindings(imageMetas, imageCount),
    evidence: [
      {
        title: "거베라 크기 구분 참고",
        body: "1묶음 평균 꽃대 길이 기준 1급 70cm 이상, 2급 60cm 이상~70cm 미만, 3급 40cm 이상~60cm 미만을 활용합니다.",
      },
      {
        title: "촬영 기준 참고",
        body: "절화류는 줄기 신장 추정을 위해 자를 반드시 함께 촬영하도록 안내합니다.",
      },
    ],
    measurements: [
      {
        label: "꽃대/줄기 길이",
        value: `${measurements.stemLengthCm || "-"}cm`,
      },
      { label: "묶음 본수", value: `${measurements.bundleCount || "-"}본` },
      { label: "개화 정도", value: floweringStage },
      { label: "잎 면적", value: leafArea },
    ],
  };
}

function createMockPerImageFindings(
  imageMetas: Array<Record<string, string | number>> | undefined,
  imageCount: number,
) {
  const metas =
    imageMetas && imageMetas.length > 0
      ? imageMetas
      : createFallbackImageMetas(imageCount);
  return metas.map((meta, index) => {
    const view = String(
      meta.view || (index === 0 ? "front_full" : "additional"),
    );
    const label = String(
      meta.label || (index === 0 ? "대표 사진" : `추가 사진 ${index + 1}`),
    );
    return {
      view,
      label,
      findings: getMockFindingsByView(view),
    };
  });
}

function createFallbackImageMetas(imageCount: number) {
  return Array.from({ length: imageCount }, (_, index) => ({
    index,
    view: index === 0 ? "front_full" : "additional",
    label: index === 0 ? "대표 사진" : `추가 사진 ${index + 1}`,
  }));
}

function getMockFindingsByView(view: string) {
  if (view === "top_view") {
    return [
      "상단 뷰를 통해 잎 면적과 퍼짐 정도를 보조 확인할 수 있습니다.",
      "꽃 또는 잎의 겹침 상태를 정면 사진보다 넓게 확인할 수 있습니다.",
    ];
  }

  if (view === "close_up") {
    return [
      "근접 사진을 통해 꽃잎, 잎, 줄기 표면의 손상 여부를 보조 확인할 수 있습니다.",
    ];
  }

  return [
    "정면 전체 사진을 통해 전체 형태, 기준 물체, 크기 정보를 확인할 수 있습니다.",
  ];
}

function extractTaxonomy(formData: FormData) {
  return {
    categoryType: getField(formData, "categoryType", "cut_flower"),
    itemId: getField(formData, "itemId", ""),
    item: getField(formData, "item", "화훼류"),
    cultivarId: getField(formData, "cultivarId", ""),
    cultivar: getField(formData, "cultivar", ""),
    cultivarClassId: getField(formData, "cultivarClassId", ""),
    cultivarClassName: getField(formData, "cultivarClassName", ""),
  };
}

function extractMeasurements(formData: FormData) {
  return {
    stemLengthCm: getField(formData, "stemLengthCm", ""),
    bundleCount: getField(formData, "bundleCount", ""),
    leafArea: getField(formData, "leafArea", ""),
    potSizeHo: getField(formData, "potSizeHo", ""),
    potTopDiameterCm: getField(formData, "potTopDiameterCm", ""),
    potBottomDiameterCm: getField(formData, "potBottomDiameterCm", ""),
    potHeightCm: getField(formData, "potHeightCm", ""),
    pottedStemLengthCm: getField(formData, "pottedStemLengthCm", ""),
  };
}

function extractUserObservations(formData: FormData) {
  return {
    floweringStage: getField(formData, "floweringStage", ""),
    floweringStatus: getField(formData, "floweringStatus", ""),
    growthCondition: getField(formData, "growthCondition", ""),
  };
}

function extractCaptureGuide(formData: FormData) {
  return {
    captureMode: getField(formData, "captureMode", ""),
    referenceObject: getField(formData, "referenceObject", ""),
  };
}

function getField(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) || fallback);
}

function getDisplayClassName(item: string, cultivar: string) {
  if (item && cultivar) {
    return `${item}_${cultivar}`;
  }

  return item || "화훼류";
}
