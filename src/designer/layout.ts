import {
  BLACK_BOX_AUTO_HORIZONTAL_PADDING,
  BLACK_BOX_AUTO_VERTICAL_PADDING,
  BLACK_BOX_FONT_HEIGHT_MAP,
  BLACK_BOX_FONT_WIDTH_MAP,
  DEFAULT_METADATA,
  DOTS_PER_MM,
  FONT_HEIGHT_MAP,
  LABEL_HEIGHT_DOTS,
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
  TextElement,
  TextFont,
  WizardResult,
} from "./types";
import { uid } from "./geometry";
import { toAscii, wrapText } from "./text";

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
  return { id: uid(), templateId: null, shortCode: "", name, elements: defaultElements(), metadata: { ...DEFAULT_METADATA } };
}

export function wizardLayout(result: WizardResult): LayoutDraft {
  const elements: CanvasElement[] = [];
  const labelWidthDots = Math.round(result.labelWidthMm * DOTS_PER_MM);
  const labelHeightDots = Math.round(result.labelHeightMm * DOTS_PER_MM);

  for (const choice of result.selectedElements) {
    const { baseX, baseY } = getNextElementPosition(elements, labelHeightDots);

    if (choice.type === "text") {
      const proportionalWrapWidth = Math.round(labelWidthDots * 0.3);
      const el = textElement(choice.label, choice.binding, baseX, baseY, 2);
      el.wrapWidth = proportionalWrapWidth;
      elements.push(el);
    } else if (choice.type === "barcode") {
      elements.push({
        id: uid(),
        type: "barcode",
        label: choice.label,
        x: baseX,
        y: baseY,
        binding: choice.binding,
        staticText: "",
        barcodeType: "1",
        narrow: 2,
        wide: 4,
        height: 82,
        humanReadable: false,
      } satisfies BarcodeElement);
    } else if (choice.type === "line") {
      elements.push({
        id: uid(),
        type: "line",
        label: choice.label,
        x: baseX,
        y: baseY,
        orientation: "horizontal",
        width: Math.round(labelWidthDots * 0.9),
        height: 3,
      } satisfies LineElement);
    } else if (choice.type === "box") {
      elements.push({
        id: uid(),
        type: "box",
        label: choice.label,
        x: baseX,
        y: baseY,
        width: Math.round(labelWidthDots * 0.4),
        height: 70,
        thickness: 2,
      } satisfies BoxElement);
    }
  }

  return {
    id: uid(),
    templateId: null,
    shortCode: "",
    name: result.name,
    elements,
    metadata: {
      ...DEFAULT_METADATA,
      labelWidthMm: result.labelWidthMm,
      labelHeightMm: result.labelHeightMm,
    },
  };
}

export function seedLayouts(): LayoutDraft[] {
  return [{ id: uid(), templateId: null, shortCode: "", name: "Standart Fis Etiketi", elements: defaultElements(), metadata: { ...DEFAULT_METADATA } }];
}

export function getBlackBoxMetrics(element: BlackBoxElement, record?: DataRecord) {
  const text = toAscii(resolveBinding(record, element.binding, element.staticText)).trim();
  const fontSize = BLACK_BOX_FONT_HEIGHT_MAP[element.font];
  const textWidth = Math.max(BLACK_BOX_FONT_WIDTH_MAP[element.font], text.length * BLACK_BOX_FONT_WIDTH_MAP[element.font]);
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

export function getNextElementPosition(elements: CanvasElement[], labelHeightDots: number = LABEL_HEIGHT_DOTS) {
  const baseX = 30;
  let baseY = 40;

  if (elements.length > 0) {
    const maxBottom = Math.max(...elements.map((element) => getElementBottom(element)));
    baseY = Math.min(labelHeightDots - 40, maxBottom + 12);
  }

  return { baseX, baseY };
}

export function createElementByType(type: ElementType, elements: CanvasElement[], labelHeightDots?: number) {
  const { baseX, baseY } = getNextElementPosition(elements, labelHeightDots);

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
