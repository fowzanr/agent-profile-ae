"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const MAX_ZOOM = 4;

type Props = {
  src: string;
  aspect: number; // width / height of the crop frame
  round?: boolean;
  outputWidth: number;
  title: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
};

export function ImageCropper({ src, aspect, round, outputWidth, title, onCancel, onConfirm }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setLoadError(true);
    img.src = src;
  }, [src]);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Scale at zoom 1 makes the image just cover the frame.
  const baseScale = natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1;
  const scale = baseScale * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;

  const clamp = useCallback(
    (o: { x: number; y: number }, z: number) => {
      if (!natural) return o;
      const s = baseScale * z;
      const maxX = Math.max(0, (natural.w * s - frame.w) / 2);
      const maxY = Math.max(0, (natural.h * s - frame.h) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
    },
    [natural, baseScale, frame.w, frame.h],
  );

  function setZoomClamped(z: number) {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, next));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setOffset(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }, zoom));
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    setZoomClamped(zoom - e.deltaY * 0.0015);
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    const sw = frame.w / scale;
    const sh = frame.h / scale;
    const sx = (dispW / 2 - frame.w / 2 - offset.x) / scale;
    const sy = (dispH / 2 - frame.h / 2 - offset.y) / scale;

    const outW = Math.min(outputWidth, Math.round(sw));
    const outH = Math.round(outW / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setBusy(false);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return setBusy(false);
    await onConfirm(blob);
    setBusy(false);
  }

  return (
    <div className="cropper-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="cropper-card" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-head">
          <span className="cropper-title">{title}</span>
          <span className="cropper-sub">Drag to reposition · zoom with the slider</span>
        </div>

        <div
          ref={frameRef}
          className={`cropper-frame${round ? " round" : ""}`}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {natural && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              className="cropper-img"
              style={{
                width: dispW,
                height: dispH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          {!natural && !loadError && <span className="cropper-status">Loading…</span>}
          {loadError && <span className="cropper-status">Couldn&apos;t load this image</span>}
          {round && <div className="cropper-round-mask" />}
        </div>

        <div className="cropper-zoom">
          <span aria-hidden>−</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            aria-label="Zoom"
          />
          <span aria-hidden>+</span>
        </div>

        <div className="cropper-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={confirm} disabled={busy || !natural}>
            {busy ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shrinks a picked file so its longest edge is at most maxEdge, returned as JPEG. */
export async function downscaleImage(file: File, maxEdge = 2400): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const ratio = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    if (ratio === 1 && file.type === "image/jpeg" && file.size < 4 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * ratio);
    canvas.height = Math.round(img.naturalHeight * ratio);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return blob ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads an image blob through /api/upload and returns its public URL. */
export async function uploadImageBlob(blob: Blob): Promise<string> {
  const body = new FormData();
  body.append("file", blob, blob.type === "image/png" ? "image.png" : "image.jpg");
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Couldn't upload image");
  return data.url;
}
