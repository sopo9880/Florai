const t = {
  title: "Florai가 품질 판정 근거를 구성하고 있어요.",
  body:
    "이미지와 입력 정보를 Render API로 전달하고, 정상/비정상 판별 및 등급 설명 결과를 기다리는 중입니다.",
};

export function LoadingPage() {
  return (
    <section className="florai-shell grid min-h-[calc(100svh-4rem)] place-items-center py-8 text-center">
      <div className="grid max-w-md justify-items-center gap-6 rounded-lg border border-[var(--line)] bg-white px-7 py-12 shadow-[var(--shadow)]">
        <div className="petal-spinner" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div>
          <h1 className="text-2xl font-black">{t.title}</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">{t.body}</p>
        </div>
      </div>
    </section>
  );
}
