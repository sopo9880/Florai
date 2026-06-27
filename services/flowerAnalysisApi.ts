import { buildCaptureGuide } from "@/constants/captureGuides";
import type {
  AnalyzeQueuedResponse,
  AnalyzeStatusResponse,
} from "@/lib/floraiAnalysisContracts";
import type { AnalysisResult, FlowerAnalysisRequest } from "@/types/flower";

const ANALYSIS_ENDPOINT =
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL || "/api/analyze-flower";
const concernPattern = new RegExp(
  "손상|시듦|시들|변색|상처|곰팡이|마름|마른|꺾임|병충해|갈변|황화|낙엽|이상",
);

export async function requestFlowerAnalysis(
  request: FlowerAnalysisRequest,
): Promise<AnalysisResult> {
  if (process.env.NEXT_PUBLIC_USE_CLIENT_MOCK_ANALYSIS === "true") {
    return requestMockFlowerAnalysis(request);
  }

  return requestRealFlowerAnalysis(request);
}

async function requestRealFlowerAnalysis(
  request: FlowerAnalysisRequest,
): Promise<AnalysisResult> {
  const response = await fetch(ANALYSIS_ENDPOINT, {
    method: "POST",
    body: buildFlowerAnalysisFormData(request),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error("꽃 분석 요청에 실패했습니다.");
  }

  const data = (await response.json()) as
    | AnalysisResult
    | AnalyzeQueuedResponse;

  if (isQueuedResponse(data)) {
    return pollAnalysisResult(data.pollUrl);
  }

  return data;
}

async function pollAnalysisResult(pollUrl: string): Promise<AnalysisResult> {
  const timeoutMs = Number(
    process.env.NEXT_PUBLIC_ANALYSIS_POLL_TIMEOUT_MS || 120_000,
  );
  const intervalMs = Number(
    process.env.NEXT_PUBLIC_ANALYSIS_POLL_INTERVAL_MS || 40_000,
  );
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(intervalMs);

    const response = await fetch(pollUrl, { cache: "no-store" });
    const status = (await response.json()) as AnalyzeStatusResponse;

    if (!response.ok && response.status !== 404) {
      throw new Error(
        !status.ok && status.error?.message
          ? status.error.message
          : "분석 결과 조회에 실패했습니다.",
      );
    }

    if (!status.ok) {
      throw new Error(status.error.message);
    }

    if (status.status === "completed") {
      return status.result;
    }
  }

  throw new Error("모델 분석 시간이 초과되었습니다.");
}

function isQueuedResponse(
  value: AnalysisResult | AnalyzeQueuedResponse,
): value is AnalyzeQueuedResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "mode" in value &&
    value.mode === "redis" &&
    "jobId" in value &&
    "pollUrl" in value
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestMockFlowerAnalysis(
  request: FlowerAnalysisRequest,
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800));
  return createMockAnalysisResult(request);
}

export function buildFlowerAnalysisFormData(
  request: FlowerAnalysisRequest,
): FormData {
  const formData = new FormData();
  const payload = createStructuredPayload(request);

  request.images.forEach((image, index) => {
    if (image.file) {
      formData.append("images", image.file);
    } else {
      formData.append("images", image.dataUrl);
    }

    formData.append(
      "imageMeta",
      JSON.stringify({
        index,
        id: image.id,
        view: image.view,
        label: image.label,
        filename: image.file?.name || `florai-${image.view}.jpg`,
      }),
    );
  });

  const primaryImage = request.images[0];
  if (primaryImage) {
    if (primaryImage.file) {
      formData.append("image", primaryImage.file);
    } else {
      formData.append("image", primaryImage.dataUrl);
    }
  }

  formData.append("payload", JSON.stringify(payload));

  for (const [key, value] of Object.entries(payload.flatFields)) {
    formData.append(key, value);
  }

  return formData;
}

function createStructuredPayload(request: FlowerAnalysisRequest) {
  const captureGuide = request.captureGuide || buildCaptureGuide(request);
  const imageViews = request.images.map((image, index) => ({
    index,
    id: image.id,
    role: index === 0 ? "main" : "additional",
    view: image.view,
    label: image.label,
    filename: image.file?.name || `florai-${image.view}.jpg`,
  }));

  return {
    taxonomy: {
      categoryType: request.categoryType,
      itemId: request.itemId,
      item: request.item,
      cultivarId: request.cultivarId,
      cultivar: request.cultivar,
      cultivarClassId: request.cultivarClassId,
      cultivarClassName: request.cultivarClassName,
    },
    measurements:
      request.categoryType === "potted_plant"
        ? {
            potSizeHo: request.potSizeHo,
            potTopDiameterCm: request.potTopDiameterCm,
            potBottomDiameterCm: request.potBottomDiameterCm,
            potHeightCm: request.potHeightCm,
            leafArea: request.leafArea,
            pottedStemLengthCm: request.pottedStemLengthCm,
          }
        : {
            stemLengthCm: request.stemLengthCm,
            bundleCount: request.bundleCount,
            leafArea: request.leafArea,
          },
    userObservations:
      request.categoryType === "potted_plant"
        ? {
            floweringStatus: request.floweringStatus,
            growthCondition: request.growthCondition,
          }
        : {
            floweringStage: request.floweringStage,
          },
    captureGuide,
    images: imageViews,
    imageCount: imageViews.length,
    memo: request.memo,
    shippedAt: request.shippedAt,
    flatFields: {
      categoryType: request.categoryType,
      itemId: request.itemId,
      item: request.item,
      cultivarId: request.cultivarId,
      cultivar: request.cultivar,
      cultivarClassId: request.cultivarClassId,
      cultivarClassName: request.cultivarClassName,
      stemLengthCm: request.stemLengthCm,
      bundleCount: request.bundleCount,
      floweringStage: request.floweringStage,
      leafArea: request.leafArea,
      potSizeHo: request.potSizeHo,
      potTopDiameterCm: request.potTopDiameterCm,
      potBottomDiameterCm: request.potBottomDiameterCm,
      potHeightCm: request.potHeightCm,
      pottedStemLengthCm: request.pottedStemLengthCm,
      floweringStatus: request.floweringStatus,
      growthCondition: request.growthCondition,
      shootingPart: request.shootingPart,
      shippedAt: request.shippedAt,
      memo: request.memo,
      captureMode: captureGuide.mode,
      referenceObject: captureGuide.referenceObject,
      imageCount: String(imageViews.length),
      imageViews: JSON.stringify(imageViews),
    },
  };
}

function createMockAnalysisResult(
  request: FlowerAnalysisRequest,
): AnalysisResult {
  const displayClassName =
    request.cultivarClassName || getDisplayClassName(request);
  const memo = request.memo.trim();
  const hasConcern = concernPattern.test(memo);
  const imageCount = request.images.length;

  if (request.categoryType === "potted_plant") {
    const abnormal =
      hasConcern ||
      /시듦|이상/.test(request.floweringStatus) ||
      /왜소|이상/.test(request.growthCondition);

    return {
      condition: abnormal ? "abnormal" : "normal",
      grade: abnormal ? "비정상" : "상",
      confidence: abnormal ? 77 : 86,
      summary: abnormal
        ? `${displayClassName}에서 입력 조건상 생육 이상 가능성이 있어 추가 확인이 필요합니다.`
        : `${displayClassName}의 잎 면적과 전체 생육 상태가 전반적으로 양호합니다.`,
      reasons: [
        `${request.potSizeHo}호 화분 규격을 기준 물체로 함께 전달했습니다.`,
        `잎 면적은 '${request.leafArea || "미입력"}', 줄기 길이는 '${request.pottedStemLengthCm || "미입력"}cm'로 입력되었습니다.`,
        `개화 여부는 '${request.floweringStatus}', 전체 생육 상태는 '${request.growthCondition}'으로 입력되었습니다.`,
        `총 ${imageCount}장의 멀티뷰 이미지를 함께 전달했습니다.`,
        "분화류는 화분 모양과 실제 화분 규격을 기준으로 이미지 내 크기 추정을 수행하는 구조입니다.",
      ],
      warnings: [
        "현재 결과는 Render API 라우트에서 반환하는 임시 mock 판정입니다.",
        "실제 모델 연결 후에는 Vision Encoder 결과와 RAG 기준표 근거가 결합됩니다.",
        ...(hasConcern ? ["메모에 이상 징후 가능성이 포함되어 있습니다."] : []),
      ],
      recommendation: abnormal
        ? "화분 전체, 잎 면적, 줄기 길이가 잘 보이도록 화분 모양 가이드에 맞춰 재촬영해 주세요."
        : "화분 전체와 식물 끝부분이 잘 보이는 촬영 조건을 유지하면 판정 안정성이 높아집니다.",
      imageCount,
      perImageFindings: createMockPerImageFindings(request.images),
      measurements: [
        { label: "화분 호수", value: `${request.potSizeHo}호` },
        { label: "윗지름", value: `${request.potTopDiameterCm}cm` },
        { label: "밑지름", value: `${request.potBottomDiameterCm}cm` },
        { label: "높이", value: `${request.potHeightCm}cm` },
        { label: "잎 면적", value: request.leafArea || "-" },
        { label: "줄기 길이", value: `${request.pottedStemLengthCm || "-"}cm` },
      ],
    };
  }

  const stemLength = Number(request.stemLengthCm);
  const abnormal = hasConcern || request.floweringStage === "미개화/과개화";
  const grade: AnalysisResult["grade"] = abnormal
    ? "비정상"
    : stemLength >= 70 && request.floweringStage === "4/5 개화"
      ? "특"
      : stemLength >= 60
        ? "상"
        : "보통";

  return {
    condition: abnormal ? "abnormal" : "normal",
    grade,
    confidence: abnormal ? 76 : grade === "특" ? 90 : grade === "상" ? 84 : 73,
    summary: abnormal
      ? `${displayClassName}에서 개화 상태 또는 메모상 이상 가능성이 있어 추가 검수가 필요합니다.`
      : `${displayClassName}는 입력된 줄기 길이·개화 정도·잎 면적 기준으로 ${grade} 등급 후보입니다.`,
    reasons: [
      `꽃대/줄기 길이 ${request.stemLengthCm || "미입력"}cm, 묶음 본수 ${request.bundleCount || "미입력"}본이 서버에 전달되었습니다.`,
      `개화 정도는 '${request.floweringStage}', 잎 면적은 '${request.leafArea || "미입력"}'으로 입력되었습니다.`,
      `총 ${imageCount}장의 멀티뷰 이미지를 함께 전달했습니다.`,
      "절화류는 자를 함께 촬영하도록 안내하여 이미지 내 줄기 신장 추정을 보조합니다.",
    ],
    warnings: [
      "현재 결과는 Render API 라우트에서 반환하는 임시 mock 판정입니다.",
      "실제 모델 연결 후에는 정상/비정상 head와 grade head 결과가 함께 반영됩니다.",
      ...(hasConcern
        ? ["메모에 손상·변색·시듦 등 품질 저하 가능성이 포함되어 있습니다."]
        : []),
    ],
    recommendation: abnormal
      ? "개화 정도와 잎 면적이 잘 보이도록 재촬영하고, 자가 함께 포함되었는지 확인해 주세요."
      : "자를 함께 촬영하고 표준규격 기반 RAG 근거를 연결하면 설명 신뢰도가 높아집니다.",
    imageCount,
    perImageFindings: createMockPerImageFindings(request.images),
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
      { label: "꽃대/줄기 길이", value: `${request.stemLengthCm || "-"}cm` },
      { label: "묶음 본수", value: `${request.bundleCount || "-"}본` },
      { label: "개화 정도", value: request.floweringStage },
      { label: "잎 면적", value: request.leafArea || "-" },
    ],
  };
}

function createMockPerImageFindings(images: FlowerAnalysisRequest["images"]) {
  return images.map((image) => ({
    view: image.view,
    label: image.label,
    findings: getMockFindingsByView(image.view),
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

function getDisplayClassName(
  request: Pick<FlowerAnalysisRequest, "item" | "cultivar">,
) {
  if (request.item && request.cultivar) {
    return `${request.item}_${request.cultivar}`;
  }

  return request.item || "화훼류";
}
