import { FLOWER_ITEM_OPTIONS } from "./flowerClassList";
import type { CategoryType } from "@/types/flower";

export const FLOWER_CATEGORY_OPTIONS = [
  {
    value: "cut_flower",
    label: "절화류",
    description: "잘린 꽃 또는 꽃대 단위로 유통되는 화훼류",
  },
  {
    value: "potted_plant",
    label: "분화류",
    description: "화분에 심긴 상태로 유통되는 화훼류",
  },
] as const;

const CUT_FLOWER_ITEM_IDS = new Set(["01", "02", "03", "04"]);
const POTTED_PLANT_ITEM_IDS = new Set(["06", "07", "08", "09", "10"]);

export function getCategoryLabel(categoryType: CategoryType) {
  return FLOWER_CATEGORY_OPTIONS.find((option) => option.value === categoryType)?.label ?? "";
}

export function getCategoryTypeByItemId(itemId: string): CategoryType {
  if (CUT_FLOWER_ITEM_IDS.has(itemId)) return "cut_flower";
  if (POTTED_PLANT_ITEM_IDS.has(itemId)) return "potted_plant";
  return "cut_flower";
}

export function getItemsByCategory(categoryType: CategoryType) {
  return FLOWER_ITEM_OPTIONS.filter((option) => {
    if (categoryType === "cut_flower") {
      return CUT_FLOWER_ITEM_IDS.has(option.itemId);
    }

    return POTTED_PLANT_ITEM_IDS.has(option.itemId);
  });
}

export function isCutFlower(categoryType: CategoryType) {
  return categoryType === "cut_flower";
}
