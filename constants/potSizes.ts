import type { PotSizeInfo } from "@/types/flower";

export const POT_SIZE_OPTIONS = [
  { ho: "7", topDiameterCm: 7, bottomDiameterCm: 4.5, heightCm: 6.4 },
  { ho: "8", topDiameterCm: 8, bottomDiameterCm: 5.5, heightCm: 7 },
  { ho: "9", topDiameterCm: 9, bottomDiameterCm: 6.3, heightCm: 8.3 },
  { ho: "10", topDiameterCm: 10, bottomDiameterCm: 6.9, heightCm: 8.7 },
  { ho: "11", topDiameterCm: 11, bottomDiameterCm: 7.8, heightCm: 10 },
  { ho: "12", topDiameterCm: 12, bottomDiameterCm: 8, heightCm: 10 },
] as const satisfies readonly PotSizeInfo[];

export function findPotSizeByHo(ho: string) {
  return POT_SIZE_OPTIONS.find((entry) => entry.ho === ho);
}

export function formatPotSize(option?: PotSizeInfo) {
  if (!option) return "";

  return `${option.ho}호 · 윗지름 ${option.topDiameterCm}cm · 밑지름 ${option.bottomDiameterCm}cm · 높이 ${option.heightCm}cm`;
}
