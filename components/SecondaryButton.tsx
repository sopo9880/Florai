import type { ButtonHTMLAttributes, ReactNode } from "react";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function SecondaryButton({
  children,
  className = "",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={`min-h-14 rounded-full border border-[var(--line)] bg-white px-6 py-4 text-base font-bold text-[var(--ink)] transition hover:border-[var(--green)] hover:bg-[#f7fbf5] disabled:cursor-not-allowed disabled:text-[var(--muted)] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
