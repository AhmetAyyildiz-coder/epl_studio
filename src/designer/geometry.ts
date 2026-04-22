import type { CanvasElement } from "./types";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function toNonNegativeInt(value: unknown, fallback = 0) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.round(numericValue));
}

export function toInt(value: unknown, fallback = 0) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.round(numericValue);
}

export function formatElementOptionLabel(element: CanvasElement, index: number) {
  return `${index + 1}. ${element.label || "Adsiz"} [${element.type}] (${element.x}, ${element.y})`;
}
