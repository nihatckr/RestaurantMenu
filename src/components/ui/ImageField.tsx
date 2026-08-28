"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Hand-rolled image picker (no dependency): tap/click to choose from the camera
// or gallery, live preview, replace/remove. Posts the file as `name` in the form
// FormData; when an existing image is removed it also posts `removeImage=on`.
export function ImageField({
  name,
  initial,
  label = "Görsel",
}: {
  name: string;
  initial?: string | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initial ?? null);
  const [removed, setRemoved] = useState(false);

  const pick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
  };

  const clear = () => {
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-xs text-muted">{label}</span>
      <div className="flex items-center gap-3">
        {preview ? (
          <div className="relative h-20 w-20 overflow-hidden rounded border border-muted/30">
            {/* Plain img: previews object URLs / uploaded paths without needing
                next/image host config for a transient preview. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={`${label} kaldır`}
              onClick={clear}
              className="absolute right-0 top-0 bg-background/80 p-0.5 text-muted transition-colors hover:text-mono-red"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            aria-label={`${label} seç`}
            className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-muted/40 text-muted transition-colors hover:border-foreground hover:text-foreground"
          >
            <ImagePlus size={20} aria-hidden />
          </button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={pick}
        >
          {preview ? "Değiştir" : "Görsel seç"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      {removed && <input type="hidden" name="removeImage" value="on" />}
    </div>
  );
}
