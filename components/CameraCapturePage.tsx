import { useEffect, useMemo, useRef, useState } from "react";
import { buildCaptureGuide } from "@/constants/captureGuides";
import type { CapturedImage, FlowerInfoForm, ImageViewType } from "@/types/flower";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  cameraUnsupported:
    "이 브라우저에서는 카메라를 사용할 수 없어 파일 업로드를 이용해주세요.",
  cameraBlocked:
    "카메라를 사용할 수 없어 파일 업로드를 이용해주세요.",
  eyebrow: "3단계 · 멀티뷰 사진 촬영",
  title: "가이드에 맞춰 필요한 사진을 촬영해주세요",
  previewAlt: "촬영된 화훼 이미지 미리보기",
  cameraReady: "카메라 준비 중",
  wait: "잠시만 기다려주세요.",
  guideLabel: "촬영 기준선",
  rulerGuide: "자 + 줄기 전체",
  potGuide: "화분 모양 기준선",
  back: "가이드로 돌아가기",
  retake: "현재 사진 다시 촬영",
  upload: "현재 뷰 사진 업로드",
  next: "분석 요청하기",
  capture: "현재 뷰 촬영하기",
  requiredBadge: "필수",
  optionalBadge: "선택",
  addPhotoHint: "대표 사진 1장은 필수이고, 상단/근접 사진은 선택으로 추가할 수 있습니다.",
  selectedView: "현재 촬영 뷰",
  capturedCount: "촬영 이미지",
};

type CaptureSlot = {
  view: ImageViewType;
  label: string;
  description: string;
  required?: boolean;
};

type CameraCapturePageProps = {
  form: FlowerInfoForm;
  capturedImages: CapturedImage[];
  onImagesChange: (images: CapturedImage[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export function CameraCapturePage({
  form,
  capturedImages,
  onImagesChange,
  onBack,
  onNext,
}: CameraCapturePageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const guide = buildCaptureGuide(form);
  const slots = useMemo(() => getCaptureSlots(form), [form]);
  const [selectedView, setSelectedView] = useState<ImageViewType>(slots[0]?.view ?? "front_full");
  const selectedSlot = slots.find((slot) => slot.view === selectedView) ?? slots[0];
  const selectedImage = capturedImages.find((image) => image.view === selectedView) ?? null;
  const mainImage = capturedImages.find((image) => image.view === "front_full") ?? null;

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t.cameraUnsupported);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (!active || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      } catch {
        setCameraError(t.cameraBlocked);
      }
    }

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const upsertImage = (image: CapturedImage) => {
    onImagesChange([
      ...capturedImages.filter((item) => item.view !== image.view),
      image,
    ].sort((a, b) => getSlotOrder(slots, a.view) - getSlotOrder(slots, b.view)));
  };

  const removeSelectedImage = () => {
    onImagesChange(capturedImages.filter((image) => image.view !== selectedView));
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !selectedSlot) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    upsertImage({
      id: createCapturedImageId(),
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
      view: selectedSlot.view,
      label: selectedSlot.label,
    });
  };

  const handleFile = (file?: File) => {
    if (!file || !selectedSlot) return;

    const reader = new FileReader();
    reader.onload = () => {
      upsertImage({
        id: createCapturedImageId(),
        dataUrl: String(reader.result),
        file,
        view: selectedSlot.view,
        label: selectedSlot.label,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="florai-shell flex min-h-[calc(100svh-4rem)] flex-col py-5">
      <div className="mb-4">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          {form.cultivarClassName || form.item} · {guide.description}
        </p>
        <p className="mt-2 rounded-lg bg-white px-4 py-3 text-sm font-bold leading-6 text-[var(--muted)] shadow-sm">
          {t.addPhotoHint}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid gap-3">
          <div className="relative aspect-[4/3] max-h-[68svh] min-h-[300px] overflow-hidden rounded-lg bg-[#13251e] shadow-[var(--shadow)] sm:aspect-[16/10] lg:min-h-[420px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                selectedImage ? "hidden" : "block"
              }`}
            />

            {selectedImage && (
              <img
                src={selectedImage.dataUrl}
                alt={t.previewAlt}
                className="h-full w-full object-cover"
              />
            )}

            {!selectedImage && !cameraReady && (
              <div className="absolute inset-0 grid place-items-center bg-[#13251e] px-8 text-center text-white">
                <div>
                  <p className="text-lg font-black">{t.cameraReady}</p>
                  <p className="mt-2 text-sm opacity-80">
                    {cameraError || t.wait}
                  </p>
                </div>
              </div>
            )}

            {!selectedImage && cameraReady && (
              <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-xs font-black text-white shadow-sm">
                {selectedSlot?.label}
              </div>
            )}
          </div>

          <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-white p-3 shadow-sm sm:grid-cols-3">
            {slots.map((slot) => {
              const image = capturedImages.find((item) => item.view === slot.view);
              const selected = selectedView === slot.view;
              return (
                <button
                  key={slot.view}
                  type="button"
                  onClick={() => setSelectedView(slot.view)}
                  className={`overflow-hidden rounded-lg border text-left transition ${
                    selected
                      ? "border-[var(--green)] bg-[var(--green-soft)]"
                      : "border-[var(--line)] bg-white"
                  }`}
                >
                  <div className="aspect-[4/3] bg-[var(--surface)]">
                    {image ? (
                      <img
                        src={image.dataUrl}
                        alt={slot.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-2 text-center text-xs font-black text-[var(--muted)]">
                        미촬영
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black">{slot.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${slot.required ? "bg-[var(--pink-soft)] text-[#9d4949]" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                        {slot.required ? t.requiredBadge : t.optionalBadge}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--muted)]">
                      {slot.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <p className="text-sm font-black text-[var(--green-strong)]">
            {guide.title}
          </p>
          <div className="mt-3 rounded-lg bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-black text-[var(--muted)]">{t.selectedView}</p>
            <p className="mt-1 text-base font-black">{selectedSlot?.label}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
              {selectedSlot?.description}
            </p>
          </div>
          <p className="mt-3 text-sm font-black">
            {t.capturedCount} {capturedImages.length}/{slots.length}
          </p>
          <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-[var(--muted)]">
            {guide.checklist.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[0.58rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-3">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        {selectedImage ? (
          <SecondaryButton onClick={removeSelectedImage}>{t.retake}</SecondaryButton>
        ) : (
          <SecondaryButton onClick={() => fileInputRef.current?.click()}>
            {t.upload}
          </SecondaryButton>
        )}
        {selectedImage ? (
          <PrimaryButton onClick={onNext} disabled={!mainImage}>{t.next}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={captureFrame} disabled={!cameraReady}>
            {t.capture}
          </PrimaryButton>
        )}
      </div>
    </section>
  );
}

function getCaptureSlots(form: FlowerInfoForm): CaptureSlot[] {
  if (form.categoryType === "potted_plant") {
    return [
      {
        view: "front_full",
        label: "정면 전체",
        required: true,
        description: "화분 모양과 식물 전체 높이가 한 화면에 보이게 촬영합니다.",
      },
      {
        view: "top_view",
        label: "상단 뷰",
        description: "식물을 위에서 내려다보며 잎 면적과 화분 윗면을 확인합니다.",
      },
      {
        view: "close_up",
        label: "근접 사진",
        description: "잎, 줄기, 꽃의 이상 부위가 있다면 가까이 촬영합니다.",
      },
    ];
  }

  return [
    {
      view: "front_full",
      label: "정면 전체",
      required: true,
      description: "꽃, 줄기, 자가 함께 보이도록 전체를 촬영합니다.",
    },
    {
      view: "top_view",
      label: "상단 뷰",
      description: "꽃과 잎을 위에서 내려다보며 개화 정도와 잎 면적을 확인합니다.",
    },
    {
      view: "close_up",
      label: "근접 사진",
      description: "꽃잎, 잎, 줄기의 손상 의심 부위를 가까이 촬영합니다.",
    },
  ];
}

function getSlotOrder(slots: CaptureSlot[], view: ImageViewType) {
  const index = slots.findIndex((slot) => slot.view === view);
  return index === -1 ? 999 : index;
}

function createCapturedImageId() {
  const random = Math.random().toString(16).slice(2, 10);
  return `capture_${Date.now()}_${random}`;
}
