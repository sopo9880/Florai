import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import type { ShootingPart } from "@/types/flower";

type BaseProps = {
  label: string;
  required?: boolean;
  helper?: string;
  children?: ReactNode;
};

export function Field({ label, required, helper, children }: BaseProps) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--ink)]">
      <span>
        {label}
        {required && <span className="text-[#c15b5b]"> *</span>}
      </span>
      {children}
      {helper && (
        <span className="text-xs font-semibold leading-5 text-[var(--muted)]">
          {helper}
        </span>
      )}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="min-h-12 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-4 text-base text-[var(--ink)] shadow-sm"
      {...props}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="min-h-12 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-4 text-base text-[var(--ink)] shadow-sm disabled:bg-[#f5f7f3] disabled:text-[var(--muted)]"
      {...props}
    />
  );
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-28 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-base leading-7 text-[var(--ink)] shadow-sm"
      {...props}
    />
  );
}

export const shootingParts: ShootingPart[] = [
  "전체",
  "꽃 중심",
  "줄기 포함",
  "화분 포함 전체",
];
