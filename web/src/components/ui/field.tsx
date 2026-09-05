import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Consolidates the `<div className="grid gap-2"><Label/><Input/>{error}
// </div>` pattern repeated 113 times across every form dialog. Adopted
// progressively as each form is touched in later phases — existing forms
// keep working unchanged until then, this doesn't replace them by itself.
interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  hint?: React.ReactNode;
}

function Field({ label, htmlFor, error, hint, className, children, ...props }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)} {...props}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-3">{hint}</p>
      ) : null}
    </div>
  );
}

export { Field };
