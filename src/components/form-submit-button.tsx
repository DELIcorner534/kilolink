"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleLabel: string;
  loadingLabel?: string;
  className?: string;
};

export function FormSubmitButton({
  idleLabel,
  loadingLabel = "Traitement...",
  className = "",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? loadingLabel : idleLabel}
    </button>
  );
}
