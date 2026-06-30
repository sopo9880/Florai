export type CategoryType = "cut_flower" | "potted_plant";

export type ShootingPart =
  | "전체"
  | "꽃 중심"
  | "줄기 포함"
  | "화분 포함 전체";

export type ImageViewType = "front_full" | "top_view" | "close_up" | "additional";

export type CapturedImage = {
  id: string;
  dataUrl: string;
  file?: File;
  view: ImageViewType;
  label: string;
};

export type FlowerClassInfo = {
  cultivarClassId: string;
  itemId: string;
  item: string;
  cultivarId: string;
  cultivar: string;
  cultivarClassName: string;
  normalClassFolder?: string | null;
  defectClassFolder?: string | null;
  hasNormalClass?: boolean;
  hasDefectClass?: boolean;
};

export type PotSizeInfo = {
  ho: string;
  topDiameterCm: number;
  bottomDiameterCm: number;
  heightCm: number;
};

export type FlowerInfoForm = FlowerClassInfo & {
  categoryType: CategoryType;
  stemLengthCm: string;
  bundleCount: string;
  floweringStage: string;
  leafArea: string;
  potSizeHo: string;
  potTopDiameterCm: string;
  potBottomDiameterCm: string;
  potHeightCm: string;
  pottedStemLengthCm: string;
  floweringStatus: string;
  growthCondition: string;
  shootingPart: ShootingPart;
  shippedAt: string;
  memo: string;
};

export type CaptureGuide = {
  mode: "cut_flower_full" | "potted_full_body";
  referenceObject: "ruler" | "pot";
  title: string;
  description: string;
  checklist: string[];
};

export type FlowerAnalysisRequest = FlowerInfoForm & {
  images: CapturedImage[];
  captureGuide: CaptureGuide;
};

export type AnalysisCondition = "normal" | "abnormal";
export type AnalysisGrade = "특" | "상" | "보통" | "비정상" | "판정 보류";

export type AnalysisImageFinding = {
  view: ImageViewType | string;
  label: string;
  findings: string[];
};

export type AnalysisResult = {
  condition: AnalysisCondition;
  grade: AnalysisGrade;
  originalLabel?: string;
  confidence: number;
  summary: string;
  reasons: string[];
  warnings: string[];
  recommendation: string;
  imageCount?: number;
  perImageFindings?: AnalysisImageFinding[];
  evidence?: Array<{
    title: string;
    body: string;
  }>;
  measurements?: Array<{
    label: string;
    value: string;
  }>;
};
