import {
  FONT_HEIGHT_MAP,
  BLACK_BOX_AUTO_HORIZONTAL_PADDING,
  DOTS_PER_MM,
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
} from "./constants";
import type {
  BarcodeElement,
  BlackBoxElement,
  BoxElement,
  DataRecord,
  LayoutDraft,
  LineElement,
  TextElement,
} from "./types";
import { toAscii } from "./text";
import { resolveBinding, getBlackBoxMetrics } from "./layout";
import { barcodePreviewWidth } from "./epl";

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
  const labelWidthDots = Math.round((layout.metadata?.labelWidthMm ?? LABEL_WIDTH_MM) * DOTS_PER_MM);
  const labelHeightDots = Math.round((layout.metadata?.labelHeightMm ?? LABEL_HEIGHT_MM) * DOTS_PER_MM);

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
    width: `${labelWidthDots}px`,
    height: `${labelHeightDots}px`,
    overflow: "hidden",
    background: "#fffdfa",
    boxSizing: "border-box",
  })}">\n${children}\n</div>`;
}
