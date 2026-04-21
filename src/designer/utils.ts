import {
  DEFAULT_PRINT_OFFSET_X,
  DEFAULT_PRINT_OFFSET_Y,
  FONT_HEIGHT_MAP,
  LABEL_HEIGHT_DOTS,
  LABEL_WIDTH_DOTS,
  STORAGE_KEY,
} from "./constants";
import type {
  BarcodeElement,
  BlackBoxElement,
  BoxElement,
  CanvasElement,
  DataRecord,
  ElementType,
  LayoutDraft,
  LineElement,
  PreviewCommand,
  TextElement,
  TextFont,
} from "./types";

const trMap: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

const trRegex = new RegExp(`[${Object.keys(trMap).join("")}]`, "g");

// Black box fontları
const BLACK_BOX_FONT_HEIGHT_MAP: Record<TextFont, number> = {
  1: 20,
  2: 28,
  3: 36,
  4: 44,
};

const BLACK_BOX_FONT_WIDTH_MAP: Record<TextFont, number> = {
  1: 12,
  2: 16,
  3: 20,
  4: 24,
};

const BLACK_BOX_AUTO_HORIZONTAL_PADDING = 10;
const BLACK_BOX_AUTO_VERTICAL_PADDING = 4;

function toNonNegativeInt(value: unknown, fallback = 0) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.round(numericValue));
}

function toInt(value: unknown, fallback = 0) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.round(numericValue);
}

const CODE39_PATTERNS: Record<string, number[]> = {
  "0": [1,1,2,1,2,2,1,1,1], "1": [2,1,1,1,2,1,1,2,1], "2": [1,2,1,1,2,1,1,2,1],
  "3": [2,2,1,1,2,1,1,1,1], "4": [1,1,2,1,2,1,2,1,1], "5": [2,1,2,1,2,1,2,1,1],
  "6": [1,2,2,1,2,1,2,1,1], "7": [1,1,1,2,2,1,2,1,1], "8": [2,1,1,2,2,1,2,1,1],
  "9": [1,2,1,2,2,1,2,1,1], "A": [2,1,1,1,1,2,1,2,1], "B": [1,2,1,1,1,2,1,2,1],
  "C": [2,2,1,1,1,2,1,1,1], "D": [1,1,2,1,1,2,1,2,1], "E": [2,1,2,1,1,2,1,2,1],
  "F": [1,2,2,1,1,2,1,2,1], "G": [1,1,1,2,1,2,1,2,1], "H": [2,1,1,2,1,2,1,2,1],
  "I": [1,2,1,2,1,2,1,2,1], "J": [1,1,2,2,1,2,1,2,1], "K": [2,1,1,1,1,1,2,2,1],
  "L": [1,2,1,1,1,1,2,2,1], "M": [2,2,1,1,1,1,2,1,1], "N": [1,1,2,1,1,1,2,2,1],
  "O": [2,1,2,1,1,1,2,2,1], "P": [1,2,2,1,1,1,2,2,1], "Q": [1,1,1,2,1,1,2,2,1],
  "R": [2,1,1,2,1,1,2,2,1], "S": [1,2,1,2,1,1,2,2,1], "T": [1,1,2,2,1,1,2,2,1],
  "U": [2,1,1,1,1,2,2,1,1], "V": [1,2,1,1,1,2,2,1,1], "W": [2,2,1,1,1,2,2,1,1],
  "X": [1,1,2,1,1,2,2,1,1], "Y": [2,1,2,1,1,2,2,1,1], "Z": [1,2,2,1,1,2,2,1,1],
  "-": [1,1,1,2,2,2,1,1,1], ".": [2,1,1,2,2,2,1,1,1], " ": [1,2,1,2,2,2,1,1,1],
  "$": [1,1,2,2,1,2,1,2,1], "/": [1,1,2,2,1,1,2,1,2], "+": [1,1,2,2,1,1,2,2,1],
  "%": [1,1,2,1,2,1,2,1,2], "*": [1,1,2,1,2,2,1,1,2],
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function toAscii(value: string) {
  return value.replace(trRegex, (char) => trMap[char] ?? char);
}

export function formatElementOptionLabel(element: CanvasElement, index: number) {
  return `${index + 1}. ${element.label || "Adsiz"} [${element.type}] (${element.x}, ${element.y})`;
}

export function textElement(
  label: string,
  binding: string,
  x: number,
  y: number,
  font: TextFont = 2,
  align: TextElement["align"] = "left",
  bold = false,
): TextElement {
  return {
    id: uid(),
    type: "text",
    label,
    x,
    y,
    binding,
    staticText: "",
    font,
    reverse: false,
    bold,
    align,
    wrapWidth: 260,
    maxLines: 1,
  };
}

export function blackBoxElement(x: number, y: number): BlackBoxElement {
  return {
    id: uid(),
    type: "blackBox",
    label: "Siyah Kutu",
    x,
    y,
    binding: "",
    staticText: "",
    font: 2,
    width: 0,
    height: 0,
  };
}

export function defaultElements(): CanvasElement[] {
  return [
    textElement("Musteri", "musteri", 10, 24, 2),
    textElement("Hammadde", "hammadde", 10, 66, 2),
    textElement("Renk", "renk", 245, 66, 2),
    textElement("Ref No", "refNo", 10, 108, 2),
    textElement("Karakter Adet", "karakterAdet", 245, 108, 2),
    textElement("Ana Atelye", "anaAtelye", 10, 150, 2),
    textElement("Montaj", "montajBirimAdi", 10, 192, 2),
    textElement("Karakter Kod", "karakterKod", 10, 234, 1),
    textElement("Konsolide", "konsolideAdlari", 10, 270, 1),
    textElement("Fiyat", "fiyat", 700, 312, 2, "right"),
    {
      id: uid(),
      type: "barcode",
      label: "Barcode",
      x: 420,
      y: 108,
      binding: "refNo",
      staticText: "",
      barcodeType: "1",
      narrow: 2,
      wide: 4,
      height: 82,
      humanReadable: false,
    },
    {
      id: uid(),
      type: "line",
      label: "Cizgi",
      x: 10,
      y: 214,
      orientation: "horizontal",
      width: 780,
      height: 3,
    },
    {
      id: uid(),
      type: "box",
      label: "Kutu",
      x: 404,
      y: 92,
      width: 330,
      height: 116,
      thickness: 2,
    },
  ];
}

export function emptyLayout(name = "Yeni Taslak"): LayoutDraft {
  return { id: uid(), templateId: null, shortCode: "", name, elements: defaultElements() };
}

export function seedLayouts(): LayoutDraft[] {
  return [{ id: uid(), templateId: null, shortCode: "", name: "Standart Fis Etiketi", elements: defaultElements() }];
}

function migrateLegacyBlackBox(element: TextElement): CanvasElement {
  if (element.label !== "Siyah Kutu" || !element.reverse) {
    return {
      ...element,
      bold: element.bold ?? false,
    };
  }

  return {
    id: element.id,
    type: "blackBox",
    label: "Siyah Kutu",
    x: element.x,
    y: element.y,
    binding: element.binding,
    staticText: element.staticText ?? "Siyah Kutu",
    font: element.font,
    width: 0,
    height: 0,
  };
}

function normalizeElement(rawElement: CanvasElement): CanvasElement {
  if (rawElement.type === "text") {
    const migrated = migrateLegacyBlackBox({
      ...rawElement,
      align: rawElement.align ?? "left",
      wrapWidth: rawElement.wrapWidth ?? 260,
      maxLines: rawElement.maxLines ?? 1,
      bold: rawElement.bold ?? false,
      reverse: rawElement.reverse ?? false,
    });

    if (migrated.type === "blackBox") {
      return migrated;
    }

    if (migrated.type === "text" && migrated.binding === "fiyat" && rawElement.align === undefined) {
      return { ...migrated, align: "right", x: Math.max(700, migrated.x) };
    }

    return migrated;
  }

  if (rawElement.type === "blackBox") {
    const legacyElement = rawElement as BlackBoxElement & { paddingX?: unknown; paddingY?: unknown };
    const hasExplicitWidth = legacyElement.width !== undefined;
    const hasExplicitHeight = legacyElement.height !== undefined;
    const legacyPaddingX = toNonNegativeInt(legacyElement.paddingX, 0);
    const legacyPaddingY = toNonNegativeInt(legacyElement.paddingY, 0);

    return {
      ...rawElement,
      x: rawElement.x + (!hasExplicitWidth && legacyPaddingX > 0 ? legacyPaddingX : 0),
      y: rawElement.y + (!hasExplicitHeight && legacyPaddingY > 0 ? legacyPaddingY : 0),
      staticText: rawElement.staticText ?? "Siyah Kutu",
      font: rawElement.font ?? 2,
      width: toNonNegativeInt(legacyElement.width, 0),
      height: toNonNegativeInt(legacyElement.height, 0),
    };
  }

  if (rawElement.type === "line") {
    return { ...rawElement, orientation: rawElement.orientation ?? "horizontal" };
  }

  return { ...rawElement };
}

export function readLayouts() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedLayouts();
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<LayoutDraft>>;
    if (!parsed.length) {
      return seedLayouts();
    }

    return parsed.map((layout) => ({
      id: layout.id ?? uid(),
      templateId: layout.templateId ?? null,
      shortCode: layout.shortCode ?? "",
      name: layout.name ?? "Adsiz Taslak",
      elements: layout.elements?.length ? layout.elements.map((element) => normalizeElement(element as CanvasElement)) : defaultElements(),
    }));
  } catch {
    return seedLayouts();
  }
}

export function normalizeRecords(payload: unknown): DataRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is DataRecord => typeof item === "object" && item !== null);
  }

  if (payload && typeof payload === "object") {
    const container = payload as Record<string, unknown>;
    const nested = container.items ?? container.data ?? container.records ?? container.result;
    if (Array.isArray(nested)) {
      return nested.filter((item): item is DataRecord => typeof item === "object" && item !== null);
    }
    return [container as DataRecord];
  }

  return [];
}

export function resolveBinding(record: DataRecord | undefined, binding: string, fallback: string) {
  if (!binding.trim()) {
    return fallback;
  }

  const value = record?.[binding];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function addPatternBars(
  bars: Array<{ x: number; width: number }>,
  pattern: number[],
  xPos: number,
  narrow: number,
  wide: number,
) {
  for (let index = 0; index < pattern.length; index += 1) {
    if (index % 2 === 0) {
      bars.push({
        x: xPos,
        width: pattern[index] === 1 ? narrow * 2 : wide * 2,
      });
    }

    xPos += (pattern[index] === 1 ? narrow : wide) * 2;
  }

  return xPos;
}

export function generateCode39Bars(text: string, narrow: number, wide: number) {
  const bars: Array<{ x: number; width: number }> = [];
  let xPos = 8;
  const startPattern = CODE39_PATTERNS["*"] ?? [1,1,2,1,2,2,1,1,2];

  xPos = addPatternBars(bars, startPattern, xPos, narrow, wide);
  xPos += narrow;

  for (const char of text.toUpperCase()) {
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) {
      continue;
    }
    xPos = addPatternBars(bars, pattern, xPos, narrow, wide);
    xPos += narrow;
  }

  addPatternBars(bars, startPattern, xPos, narrow, wide);
  return bars;
}

export function barcodePreviewWidth(value: string, narrow: number, wide: number) {
  const barCount = value.length * 5 + 10;
  const avgBarWidth = (narrow + wide) / 2;
  return Math.min(340, Math.max(120, barCount * avgBarWidth * 2.5));
}

export function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(56, Math.round(text.length * fontSize * 0.58));
}

export function estimateWrappedTextWidth(lines: string[], fontSize: number, wrapWidth: number, bold: boolean = false) {
  const widestLine = Math.max(...lines.map((line) => estimateTextWidth(line, fontSize)), 0);
  const baseWidth = Math.max(56, Math.min(wrapWidth, widestLine));
  // Bold durumunda Zebra EPL horizontal multiplier 2 kullanır, genişlik ~1.5-2 kat olur
  return bold ? Math.round(baseWidth * 1.6) : baseWidth;
}

let textMeasurementContext: CanvasRenderingContext2D | null | undefined;

function getTextMeasurementContext() {
  if (textMeasurementContext !== undefined) {
    return textMeasurementContext;
  }

  if (typeof document === "undefined") {
    textMeasurementContext = null;
    return textMeasurementContext;
  }

  textMeasurementContext = document.createElement("canvas").getContext("2d");
  return textMeasurementContext;
}

function measureTextWidth(text: string, fontSize: number, bold = false) {
  const normalized = text.replace(/\r?\n/g, " ");
  if (!normalized) {
    return 0;
  }

  const context = getTextMeasurementContext();
  if (context) {
    context.font = `${bold ? "700" : "400"} ${fontSize}px monospace`;
    return Math.round(context.measureText(normalized).width);
  }

  return Math.round(normalized.length * fontSize * (bold ? 0.64 : 0.58));
}

function getTextContainerWidth(wrapWidth: number) {
  return Math.max(56, wrapWidth);
}

function breakLongWord(word: string, fontSize: number, wrapWidth: number, bold = false) {
  if (!word) {
    return [""];
  }

  const segments: string[] = [];
  let current = "";

  for (const character of Array.from(word)) {
    const next = current + character;
    if (!current || measureTextWidth(next, fontSize, bold) <= wrapWidth) {
      current = next;
      continue;
    }

    segments.push(current);
    current = character;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function fitTextToWidth(text: string, fontSize: number, wrapWidth: number, bold = false) {
  const normalized = text.trim();
  if (!normalized) {
    return "";
  }

  if (measureTextWidth(normalized, fontSize, bold) <= wrapWidth) {
    return normalized;
  }

  const characters = Array.from(normalized);
  let result = "";
  for (const character of characters) {
    const next = result + character;
    if (measureTextWidth(`${next}...`, fontSize, bold) > wrapWidth) {
      break;
    }
    result = next;
  }

  return result ? `${result}...` : characters[0] ?? "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleToString(style: Record<string, string | number | boolean | undefined>) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
      return `${cssKey}:${String(value)}`;
    })
    .join(";");
}

function getTemplatePlaceholder(binding: string) {
  const normalized = binding.trim();
  return normalized ? `{{${normalized}}}` : "";
}

function getTextTemplateContent(element: TextElement) {
  return element.staticText || element.label;
}

function getBlackBoxTemplateContent(element: BlackBoxElement) {
  return element.staticText;
}

function getBarcodeTemplateContent(element: BarcodeElement) {
  return element.staticText || "BARCODE";
}

function getTemplateVisibleContent(binding: string, fallback: string) {
  return binding.trim() ? "" : fallback;
}

function getTextTemplateLeft(element: TextElement) {
  if (element.align === "right") {
    return Math.max(0, element.x - element.wrapWidth);
  }

  if (element.align === "center") {
    return Math.max(0, element.x - Math.round(element.wrapWidth / 2));
  }

  return element.x;
}

function renderTemplateTextElement(element: TextElement) {
  const fontSize = FONT_HEIGHT_MAP[element.font];
  const lineHeight = fontSize + 4;
  const minHeight = Math.max(lineHeight, element.maxLines * lineHeight);
  const placeholder = getTemplatePlaceholder(element.binding);
  const content = escapeHtml(getTemplateVisibleContent(element.binding, getTextTemplateContent(element)));

  return `<div data-epl-type="text"${element.binding.trim() ? ` data-binding="${escapeHtml(element.binding.trim())}" data-placeholder="${escapeHtml(placeholder)}"` : ""} style="${styleToString({
    position: "absolute",
    left: `${getTextTemplateLeft(element)}px`,
    top: `${element.y}px`,
    width: `${element.wrapWidth}px`,
    minHeight: `${minHeight}px`,
    color: element.reverse ? "#ffffff" : "#111111",
    background: element.reverse ? "#111111" : "transparent",
    fontFamily: "monospace",
    fontSize: `${fontSize}px`,
    fontWeight: element.bold ? 700 : 400,
    lineHeight: `${lineHeight}px`,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    textAlign: element.align,
    overflow: "hidden",
    boxSizing: "border-box",
  })}">${content}</div>`;
}

function renderTemplateBlackBoxElement(element: BlackBoxElement, record?: DataRecord) {
  const { fontSize } = getBlackBoxMetrics(element);
  const placeholder = getTemplatePlaceholder(element.binding);
  const { width: resolvedWidth, height: resolvedHeight } = getBlackBoxMetrics(element, record);
  const content = escapeHtml(getTemplateVisibleContent(element.binding, getBlackBoxTemplateContent(element)));

  return `<div data-epl-type="blackBox"${element.binding.trim() ? ` data-binding="${escapeHtml(element.binding.trim())}" data-placeholder="${escapeHtml(placeholder)}"` : ""} style="${styleToString({
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${resolvedWidth}px`,
    height: `${resolvedHeight}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `0 ${BLACK_BOX_AUTO_HORIZONTAL_PADDING}px`,
    background: "#111111",
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: `${fontSize}px`,
    lineHeight: 1,
    textAlign: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  })}">${content}</div>`;
}

function renderTemplateLineElement(element: LineElement) {
  return `<div data-epl-type="line" style="${styleToString({
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    background: "#111111",
  })}"></div>`;
}

function renderTemplateBoxElement(element: BoxElement) {
  return `<div data-epl-type="box" style="${styleToString({
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    border: `${element.thickness}px solid #111111`,
    boxSizing: "border-box",
  })}"></div>`;
}

function renderTemplateBarcodeElement(element: BarcodeElement, record?: DataRecord) {
  const placeholder = getTemplatePlaceholder(element.binding);
  const content = escapeHtml(getTemplateVisibleContent(element.binding, getBarcodeTemplateContent(element)));
  const format = element.barcodeType === "1" ? "CODE128" : "CODE39";
  const measuredValue = toAscii(resolveBinding(record, element.binding, element.staticText || "BARCODE"));
  const previewWidth = barcodePreviewWidth(measuredValue, element.narrow, element.wide);

  return `<epl-barcode data-epl-type="barcode"${element.binding.trim() ? ` data-binding="${escapeHtml(element.binding.trim())}" data-placeholder="${escapeHtml(placeholder)}"` : ""} data-value="${escapeHtml(placeholder || getBarcodeTemplateContent(element))}" data-format="${format}" data-module-width="${element.narrow}" data-wide-width="${element.wide}" data-height="${element.height}" data-display-value="${element.humanReadable ? "true" : "false"}" style="${styleToString({
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${previewWidth}px`,
    height: `${element.height}px`,
    display: "block",
    overflow: "hidden",
  })}">${content}</epl-barcode>`;
}

export function buildReactTemplate(layout: LayoutDraft, record?: DataRecord) {
  const children = layout.elements.map((element) => {
    switch (element.type) {
      case "text":
        return renderTemplateTextElement(element);
      case "blackBox":
        return renderTemplateBlackBoxElement(element, record);
      case "line":
        return renderTemplateLineElement(element);
      case "box":
        return renderTemplateBoxElement(element);
      case "barcode":
        return renderTemplateBarcodeElement(element, record);
    }
  }).join("\n");

  return `<div data-epl-template="true" data-template-name="${escapeHtml(layout.name)}" data-template-short-code="${escapeHtml(layout.shortCode)}" style="${styleToString({
    position: "relative",
    width: `${LABEL_WIDTH_DOTS}px`,
    height: `${LABEL_HEIGHT_DOTS}px`,
    overflow: "hidden",
    background: "#fffdfa",
    boxSizing: "border-box",
  })}">\n${children}\n</div>`;
}

function getBlackBoxTextMetrics(text: string, font: TextFont) {
  const fontSize = BLACK_BOX_FONT_HEIGHT_MAP[font];
  const textWidth = Math.max(BLACK_BOX_FONT_WIDTH_MAP[font], text.length * BLACK_BOX_FONT_WIDTH_MAP[font]);
  return { fontSize, textWidth };
}

export function wrapText(value: string, fontSize: number, wrapWidth: number, maxLines: number, bold = false) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const safeWrapWidth = Math.max(24, wrapWidth);
  const words = normalized
    .split(" ")
    .flatMap((word) => breakLongWord(word, fontSize, safeWrapWidth, bold));
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (measureTextWidth(next, fontSize, bold) <= safeWrapWidth || !current) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  const safeLines = Math.max(1, maxLines);
  if (lines.length <= safeLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, safeLines);
  const overflowText = `${visibleLines[safeLines - 1]} ${lines.slice(safeLines).join(" ")}`.trim();
  visibleLines[safeLines - 1] = fitTextToWidth(overflowText, fontSize, safeWrapWidth, bold);
  return visibleLines;
}

export function getBlackBoxMetrics(element: BlackBoxElement, record?: DataRecord) {
  const text = toAscii(resolveBinding(record, element.binding, element.staticText)).trim();
  const { fontSize, textWidth } = getBlackBoxTextMetrics(text, element.font);
  const autoWidth = textWidth + BLACK_BOX_AUTO_HORIZONTAL_PADDING * 2;
  const autoHeight = fontSize + BLACK_BOX_AUTO_VERTICAL_PADDING * 2;
  const width = element.width > 0 ? element.width : autoWidth;
  const height = element.height > 0 ? element.height : autoHeight;

  return {
    text,
    fontSize,
    width,
    height,
    contentOffsetX: 0,
    contentOffsetY: 0,
    contentWidth: width,
    contentHeight: height,
  };
}

export function getElementBottom(element: CanvasElement) {
  switch (element.type) {
    case "text": {
      const fontSize = FONT_HEIGHT_MAP[element.font];
      const text = element.staticText || element.label;
      const lines = wrapText(text, fontSize, element.wrapWidth, element.maxLines, element.bold ?? false);
      const lineHeight = fontSize + 4;
      return element.y + lines.length * lineHeight;
    }
    case "blackBox": {
      const { height } = getBlackBoxMetrics(element);
      return element.y + height;
    }
    case "line":
      return element.y + Math.max(8, element.height);
    case "box":
    case "barcode":
      return element.y + element.height;
  }
}

export function buildPreviewCommands(layout: LayoutDraft, record: DataRecord | undefined): PreviewCommand[] {
  return layout.elements.map((element) => {
    if (element.type === "text") {
      const text = toAscii(resolveBinding(record, element.binding, element.staticText || element.label));
      const fontSize = FONT_HEIGHT_MAP[element.font];
      const isBold = element.bold ?? false;
      const lines = wrapText(text, fontSize, element.wrapWidth, element.maxLines, isBold);
      const lineHeight = fontSize + 4;
      return {
        id: element.id,
        type: "text",
        x: element.x,
        y: element.y,
        text,
        lines,
        fontSize,
        reverse: element.reverse,
        bold: isBold,
        width: getTextContainerWidth(element.wrapWidth),
        height: Math.max(lineHeight, lines.length * lineHeight),
        align: element.align,
      };
    }

    if (element.type === "blackBox") {
      const { text, fontSize, width, height, contentOffsetX, contentOffsetY, contentWidth, contentHeight } = getBlackBoxMetrics(element, record);
      return {
        id: element.id,
        type: "blackBox",
        x: element.x,
        y: element.y,
        width,
        height,
        contentOffsetX,
        contentOffsetY,
        contentWidth,
        contentHeight,
        text,
        fontSize,
      };
    }

    if (element.type === "line") {
      return { id: element.id, type: "line", x: element.x, y: element.y, width: element.width, height: element.height };
    }

    if (element.type === "box") {
      return {
        id: element.id,
        type: "box",
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        thickness: element.thickness,
      };
    }

    const text = toAscii(resolveBinding(record, element.binding, element.staticText || "BARCODE"));
    return {
      id: element.id,
      type: "barcode",
      x: element.x,
      y: element.y,
      width: barcodePreviewWidth(text, element.narrow, element.wide),
      height: element.height,
      text,
      barcodeType: element.barcodeType,
      moduleWidth: element.narrow,
      humanReadable: element.humanReadable,
    };
  });
}

export function buildEpl(layout: LayoutDraft, record: DataRecord | undefined, offsetX: number, offsetY: number) {
  const lines = ["ZT", `q${LABEL_WIDTH_DOTS}`, `Q${LABEL_HEIGHT_DOTS},24`, "R0,0", "N"];
  const verticalShifts: Array<{ startY: number; endY: number; shift: number }> = [];

  layout.elements.forEach((element) => {
    const dynamicYOffset = verticalShifts.reduce(
      (total, item) => total + (element.y >= item.endY ? item.shift : 0),
      0,
    );
    const adjustedY = toInt(offsetY + element.y + dynamicYOffset);

    if (element.type === "text") {
      const value = toAscii(resolveBinding(record, element.binding, element.staticText || element.label)).replace(/"/g, "'");
      const fontSize = FONT_HEIGHT_MAP[element.font];
      const wrappedLines = wrapText(value, fontSize, element.wrapWidth, element.maxLines, element.bold ?? false);
      const lineHeight = fontSize + 4;
      const isScalableFont = typeof element.font === "string";

      wrappedLines.forEach((lineText, index) => {
        const textWidth = measureTextWidth(lineText, fontSize, element.bold ?? false);
        const commandX =
          element.align === "right"
            ? toInt(offsetX + element.x - textWidth)
            : element.align === "center"
              ? toInt(offsetX + element.x - Math.round(textWidth / 2))
              : toInt(offsetX + element.x);

        // Bold için: aynı metni 3 kez yaz (x, x+1, x+2 koordinatlarında)
        const boldCount = element.bold ? 3 : 1;
        for (let b = 0; b < boldCount; b++) {
          const boldOffsetX = element.bold ? b : 0;
          if (isScalableFont) {
            // Scalable font format: A{x},{y},{fontSize},{fontName},{hMult},{vMult},{alignment},"{text}"
            lines.push(
              `A${commandX + boldOffsetX},${adjustedY + index * lineHeight},${fontSize},${element.font},1,1,${element.reverse ? "R" : "N"},"${lineText}"`,
            );
          } else {
            // Bitmap font format: A{x},{y},0,{font},{hMult},{vMult},{alignment},"{text}"
            lines.push(
              `A${commandX + boldOffsetX},${adjustedY + index * lineHeight},0,${element.font},1,1,${element.reverse ? "R" : "N"},"${lineText}"`,
            );
          }
        }
      });

      if (wrappedLines.length > 1) {
        const textBlockHeight = wrappedLines.length * lineHeight;
        verticalShifts.push({
          startY: element.y,
          endY: element.y + textBlockHeight,
          shift: textBlockHeight - lineHeight,
        });
      }
      return;
    }

    if (element.type === "blackBox") {
      const { text, fontSize, width, height } = getBlackBoxMetrics(element, record);
      const value = text.replace(/"/g, "'");
      const renderWidth = Math.max(1, toNonNegativeInt(width, 1));
      const renderHeight = Math.max(1, toNonNegativeInt(height, 1));
      const usableTextWidth = Math.max(0, renderWidth - BLACK_BOX_AUTO_HORIZONTAL_PADDING * 2);
      const maxChars = Math.max(1, Math.floor(Math.max(usableTextWidth, BLACK_BOX_FONT_WIDTH_MAP[element.font]) / BLACK_BOX_FONT_WIDTH_MAP[element.font]));
      const outputText = value.length > maxChars ? value.slice(0, maxChars) : value;
      const boxX = toInt(offsetX + element.x);
      const boxY = adjustedY;

      if (outputText.trim()) {
        const outputTextWidth = Math.max(BLACK_BOX_FONT_WIDTH_MAP[element.font], outputText.length * BLACK_BOX_FONT_WIDTH_MAP[element.font]);
        const textX = toInt(boxX + Math.max(0, Math.floor((renderWidth - outputTextWidth) / 2)));
        const textY = toInt(boxY + Math.max(0, Math.floor((renderHeight - fontSize) / 2)));
        lines.push(`A${textX},${textY},0,${element.font},1,1,N,"${outputText}"`);
      }

      lines.push(`LE${boxX},${boxY},${renderWidth},${renderHeight}`);
      return;
    }

    if (element.type === "line") {
      lines.push(`LO${toInt(offsetX + element.x)},${adjustedY},${Math.max(1, toNonNegativeInt(element.width, 1))},${Math.max(1, toNonNegativeInt(element.height, 1))}`);
      return;
    }

    if (element.type === "box") {
      const x = toInt(offsetX + element.x);
      const y = adjustedY;
      const width = Math.max(4, toNonNegativeInt(element.width, 4));
      const height = Math.max(4, toNonNegativeInt(element.height, 4));
      lines.push(
        `X${x},${y},${Math.max(1, toNonNegativeInt(element.thickness, 1))},${x + width},${y + height}`,
      );
      return;
    }

    const value = toAscii(resolveBinding(record, element.binding, element.staticText || "BARCODE")).replace(/"/g, "'");
    lines.push(
      `B${toInt(offsetX + element.x)},${adjustedY},0,${element.barcodeType},${Math.max(1, toNonNegativeInt(element.narrow, 1))},${Math.max(2, toNonNegativeInt(element.wide, 2))},${Math.max(1, toNonNegativeInt(element.height, 1))},${element.humanReadable ? "B" : "N"},"${value}"`,
    );
  });

  lines.push("P1");
  return lines.map((line) => `${line}\n`).join("");
}

export function clampTextFont(value: number): TextFont {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return 2;
}

export function parseEplToElements(epl: string, offsetX = DEFAULT_PRINT_OFFSET_X, offsetY = DEFAULT_PRINT_OFFSET_Y) {
  const result: CanvasElement[] = [];
  const rows = epl.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const parseTextCommand = (row: string) => {
    const match = row.match(/^A(\d+),(\d+),\d,(\d),\d,\d,([RN]),"(.*)"$/);
    if (!match) {
      return null;
    }

    return {
      rawX: Number(match[1]),
      rawY: Number(match[2]),
      font: clampTextFont(Number(match[3])),
      reverse: match[4] === "R",
      text: match[5],
    };
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.startsWith("A")) {
      const parsedText = parseTextCommand(row);
      if (!parsedText) {
        continue;
      }

      const nextLeMatch = rows[index + 1]?.match(/^LE(\d+),(\d+),(\d+),(\d+)$/);
      if (nextLeMatch) {
        const rawX = Number(nextLeMatch[1]);
        const rawY = Number(nextLeMatch[2]);
        const width = Math.max(1, Number(nextLeMatch[3]));
        const height = Math.max(1, Number(nextLeMatch[4]));

        if (
          parsedText.rawX >= rawX &&
          parsedText.rawX <= rawX + width &&
          parsedText.rawY >= rawY &&
          parsedText.rawY <= rawY + height
        ) {
          result.push({
            id: uid(),
            type: "blackBox",
            label: "Siyah Kutu",
            x: Math.max(0, rawX - offsetX),
            y: Math.max(0, rawY - offsetY),
            binding: "",
            staticText: parsedText.text.trim(),
            font: parsedText.font,
            width,
            height,
          });
          index += 1;
          continue;
        }
      }

      const nextLoMatch = rows[index + 1]?.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
      const hasHorizontalPadding = parsedText.text !== parsedText.text.trim();
      if (parsedText.reverse && hasHorizontalPadding && nextLoMatch) {
        const rawX = parsedText.rawX;
        const rawY = parsedText.rawY;
        const fontHeight = BLACK_BOX_FONT_HEIGHT_MAP[parsedText.font];
        const bottomRawX = Number(nextLoMatch[1]);
        const bottomRawY = Number(nextLoMatch[2]);
        const bottomWidth = Math.max(1, Number(nextLoMatch[3]));
        const bottomHeight = Math.max(1, Number(nextLoMatch[4]));

        if (bottomRawX === rawX && bottomRawY >= rawY + fontHeight) {
          result.push({
            id: uid(),
            type: "blackBox",
            label: "Siyah Kutu",
            x: Math.max(0, rawX - offsetX),
            y: Math.max(0, rawY - offsetY),
            binding: "",
            staticText: parsedText.text.trim(),
            font: parsedText.font,
            width: bottomWidth,
            height: bottomRawY - rawY + bottomHeight,
          });
          index += 1;
          continue;
        }
      }

      const x = Math.max(0, parsedText.rawX - offsetX);
      const y = Math.max(0, parsedText.rawY - offsetY);
      const fontSize = FONT_HEIGHT_MAP[parsedText.font];

      result.push({
        id: uid(),
        type: "text",
        label: "Text",
        x,
        y,
        binding: "",
        staticText: parsedText.text,
        font: parsedText.font,
        reverse: parsedText.reverse,
        bold: false,
        align: "left",
        wrapWidth: Math.max(56, estimateTextWidth(parsedText.text, fontSize)),
        maxLines: 1,
      });
      continue;
    }

    if (row.startsWith("LE")) {
      const match = row.match(/^LE(\d+),(\d+),(\d+),(\d+)$/);
      if (!match) {
        continue;
      }

      result.push({
        id: uid(),
        type: "blackBox",
        label: "Siyah Kutu",
        x: Math.max(0, Number(match[1]) - offsetX),
        y: Math.max(0, Number(match[2]) - offsetY),
        binding: "",
        staticText: "",
        font: 2,
        width: Math.max(1, Number(match[3])),
        height: Math.max(1, Number(match[4])),
      });
      continue;
    }

    if (row.startsWith("LO")) {
      const match = row.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
      if (!match) {
        continue;
      }

      const rawX = Number(match[1]);
      const rawY = Number(match[2]);
      const width = Math.max(1, Number(match[3]));
      const height = Math.max(1, Number(match[4]));
      const parsedText = rows[index + 1] ? parseTextCommand(rows[index + 1]) : null;

      if (
        parsedText?.reverse &&
        parsedText.rawX >= rawX &&
        parsedText.rawX <= rawX + width &&
        parsedText.rawY >= rawY &&
        parsedText.rawY <= rawY + height
      ) {
        const bottomLoMatch = rows[index + 2]?.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
        const hasBottomFill = Boolean(
          bottomLoMatch &&
          Number(bottomLoMatch[1]) === rawX &&
          Math.max(1, Number(bottomLoMatch[3])) === width &&
          Number(bottomLoMatch[2]) >= parsedText.rawY + BLACK_BOX_FONT_HEIGHT_MAP[parsedText.font],
        );
        const bottomHeight = hasBottomFill ? Math.max(1, Number(bottomLoMatch![4])) : 0;
        const bottomRawY = hasBottomFill ? Number(bottomLoMatch![2]) : rawY;

        result.push({
          id: uid(),
          type: "blackBox",
          label: "Siyah Kutu",
          x: Math.max(0, rawX - offsetX),
          y: Math.max(0, rawY - offsetY),
          binding: "",
          staticText: parsedText.text.trim(),
          font: parsedText.font,
          width,
          height: hasBottomFill ? Math.max(height, bottomRawY - rawY + bottomHeight) : height,
        });
        index += hasBottomFill ? 2 : 1;
        continue;
      }

      result.push({
        id: uid(),
        type: "line",
        label: "Cizgi",
        x: Math.max(0, rawX - offsetX),
        y: Math.max(0, rawY - offsetY),
        orientation: width >= height ? "horizontal" : "vertical",
        width,
        height,
      });
      continue;
    }

    if (row.startsWith("X")) {
      const match = row.match(/^X(\d+),(\d+),(\d+),(\d+),(\d+)$/);
      if (!match) {
        continue;
      }

      const x1 = Number(match[1]);
      const y1 = Number(match[2]);
      const thickness = Math.max(1, Number(match[3]));
      const x2 = Number(match[4]);
      const y2 = Number(match[5]);

      result.push({
        id: uid(),
        type: "box",
        label: "Kutu",
        x: Math.max(0, x1 - offsetX),
        y: Math.max(0, y1 - offsetY),
        width: Math.max(4, x2 - x1),
        height: Math.max(4, y2 - y1),
        thickness,
      });
      continue;
    }

    if (row.startsWith("B")) {
      const match = row.match(/^B(\d+),(\d+),\d,([13]),(\d+),(\d+),(\d+),([BN]),"(.*)"$/);
      if (!match) {
        continue;
      }

      result.push({
        id: uid(),
        type: "barcode",
        label: "Barcode",
        x: Math.max(0, Number(match[1]) - offsetX),
        y: Math.max(0, Number(match[2]) - offsetY),
        binding: "",
        staticText: match[8],
        barcodeType: match[3] as BarcodeElement["barcodeType"],
        narrow: Math.max(1, Number(match[4])),
        wide: Math.max(2, Number(match[5])),
        height: Math.max(40, Number(match[6])),
        humanReadable: match[7] === "B",
      });
    }
  }

  return result;
}

export function applyEplOffset(epl: string, offsetX: number, offsetY: number) {
  const rows = epl.split(/\r?\n/);
  const shifted = rows.map((raw) => {
    const row = raw.trim();
    if (!row) {
      return raw;
    }

    let match = row.match(/^A(\d+),(\d+),(.*)$/);
    if (match) {
      return `A${Number(match[1]) + offsetX},${Number(match[2]) + offsetY},${match[3]}`;
    }

    match = row.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
      return `LO${Number(match[1]) + offsetX},${Number(match[2]) + offsetY},${match[3]},${match[4]}`;
    }

    match = row.match(/^LE(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
      return `LE${Number(match[1]) + offsetX},${Number(match[2]) + offsetY},${match[3]},${match[4]}`;
    }

    match = row.match(/^X(\d+),(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
      return `X${Number(match[1]) + offsetX},${Number(match[2]) + offsetY},${match[3]},${Number(match[4]) + offsetX},${Number(match[5]) + offsetY}`;
    }

    match = row.match(/^B(\d+),(\d+),(.*)$/);
    if (match) {
      return `B${Number(match[1]) + offsetX},${Number(match[2]) + offsetY},${match[3]}`;
    }

    return raw;
  });

  return shifted.join("\n");
}

export function submitEpl(epl: string) {
  const popup = window.open("", "view", "width=420,height=520");
  if (!popup) {
    window.alert("Popup engellendi. Yazdirma icin popup izni verin.");
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://intranet.arpas.com/EPL_v3/DemoPrintCommands.aspx";
  form.target = "view";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "epl";
  input.value = encodeURIComponent(epl);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export function getNextElementPosition(elements: CanvasElement[]) {
  const baseX = 30;
  let baseY = 40;

  if (elements.length > 0) {
    const maxBottom = Math.max(...elements.map((element) => getElementBottom(element)));
    baseY = Math.min(LABEL_HEIGHT_DOTS - 40, maxBottom + 12);
  }

  return { baseX, baseY };
}

export function createElementByType(type: ElementType, elements: CanvasElement[]) {
  const { baseX, baseY } = getNextElementPosition(elements);

  if (type === "text") {
    return textElement("Yeni Metin", "", baseX, baseY, 2);
  }

  if (type === "blackBox") {
    return blackBoxElement(baseX, baseY);
  }

  if (type === "line") {
    return {
      id: uid(),
      type: "line",
      label: "Cizgi",
      x: baseX,
      y: baseY,
      orientation: "horizontal",
      width: 220,
      height: 3,
    } satisfies LineElement;
  }

  if (type === "box") {
    return {
      id: uid(),
      type: "box",
      label: "Kutu",
      x: baseX,
      y: baseY,
      width: 180,
      height: 70,
      thickness: 2,
    } satisfies BoxElement;
  }

  return {
    id: uid(),
    type: "barcode",
    label: "Barcode",
    x: baseX,
    y: baseY,
    binding: "barkod",
    staticText: "BARCODE123",
    barcodeType: "1",
    narrow: 2,
    wide: 4,
    height: 82,
    humanReadable: false,
  } satisfies BarcodeElement;
}
