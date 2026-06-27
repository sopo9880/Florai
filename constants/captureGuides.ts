import type { CaptureGuide, FlowerInfoForm } from "@/types/flower";
import { formatPotSize, findPotSizeByHo } from "./potSizes";

export function buildCaptureGuide(form: FlowerInfoForm): CaptureGuide {
  if (form.categoryType === "potted_plant") {
    const potSize = findPotSizeByHo(form.potSizeHo);
    const potLabel = formatPotSize(potSize);

    return {
      mode: "potted_full_body",
      referenceObject: "pot",
      title: `${form.cultivarClassName || form.item} 촬영 가이드`,
      description:
        potLabel ||
        "화분 모양이 기준 물체가 되도록 화분 윗면, 옆면, 식물 끝부분이 함께 보이게 촬영해 주세요.",
      checklist: [
        "화분 윗면의 타원형 모양과 옆면 윤곽이 모두 보이도록 촬영해 주세요.",
        "화분 아래쪽이 화면에서 잘리지 않게 하고, 식물의 가장 높은 지점까지 한 화면에 넣어 주세요.",
        "화분이 기울어져 보이지 않도록 가능한 정면에서 촬영해 주세요.",
        "잎 면적과 줄기 길이가 보이도록 잎이 심하게 겹치지 않는 방향에서 촬영해 주세요.",
        "선택한 화분 호수와 실제 화분 규격이 맞는지 촬영 전에 확인해 주세요.",
      ],
    };
  }

  return {
    mode: "cut_flower_full",
    referenceObject: "ruler",
    title: `${form.cultivarClassName || form.item} 촬영 가이드`,
    description:
      "절화류는 줄기 신장 추정을 위해 자를 반드시 함께 놓고, 꽃송이와 줄기 전체가 보이도록 촬영해 주세요.",
    checklist: [
      "자를 반드시 함께 촬영해 주세요. 자의 눈금이 보이면 길이 추정 정확도가 올라갑니다.",
      "꽃송이와 줄기 전체가 한 화면에 들어오도록 촬영해 주세요.",
      "여러 송이를 묶음으로 판별하는 경우 한 묶음 전체가 보이게 촬영해 주세요.",
      "개화 정도와 잎 면적이 보이도록 꽃송이와 잎이 겹치지 않게 배치해 주세요.",
      "가능하면 흰색 또는 단색 배경에서 촬영해 주세요.",
    ],
  };
}
