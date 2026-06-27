import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`min-h-14 rounded-full bg-[var(--green-strong)] px-6 py-4 text-base font-bold text-white shadow-[var(--shadow)] transition hover:translate-y-[-1px] hover:bg-[#2b6847] disabled:cursor-not-allowed disabled:bg-[#b9c9bf] disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
