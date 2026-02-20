import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "select" | "textarea" | "date";
  options?: string[];
  required?: boolean;
}

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, unknown>;
  onSubmit: (fields: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export function RecordDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialValues,
  onSubmit,
  isLoading,
}: RecordDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      fields.forEach((f) => {
        init[f.key] = String(initialValues?.[f.key] ?? "");
      });
      setValues(init);
    }
  }, [open, initialValues, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (values[f.key]) out[f.key] = values[f.key];
    });
    onSubmit(out);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs font-medium">{f.label}</Label>
              {f.type === "select" && f.options ? (
                <Select
                  value={values[f.key] || ""}
                  onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={`Select ${f.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="text-sm min-h-[60px]"
                />
              ) : (
                <Input
                  type={f.type === "date" ? "date" : "text"}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm"
                  required={f.required}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "Saving…" : initialValues ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
