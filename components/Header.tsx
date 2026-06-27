export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(221,232,223,0.8)] bg-[rgba(255,253,248,0.86)] backdrop-blur">
      <div className="florai-shell flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--green)] text-lg font-black text-[var(--green-strong)]">
            F
          </div>
          <div>
            <p className="text-lg font-black leading-none">
              Florai
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              {"AI \ud654\ud6fc \ud488\uc9c8 \uad00\ub9ac"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--pink-soft)] px-3 py-1 text-xs font-bold text-[#a44e4e]">
          MVP
        </span>
      </div>
    </header>
  );
}
