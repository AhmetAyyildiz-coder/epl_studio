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
    staticText: "Siyah Kutu",
    font: 2,
    paddingX: 16,
    paddingY: 8,
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
    return element;
  }

  return {
    id: element.id,
    type: "blackBox",
    label: "Siyah Kutu",
    x: element.x,
    y: element.y,
    binding: element.binding,
    staticText: element.staticText || "Siyah Kutu",
    font: element.font,
    paddingX: 16,
    paddingY: 8,
  };
}

function normalizeElement(rawElement: CanvasElement): CanvasElement {
  if (rawElement.type === "text") {
    const migrated = migrateLegacyBlackBox({
      ...rawElement,
      align: rawElement.align ?? "left",
      wrapWidth: rawElement.wrapWidth ?? 260,
      maxLines: rawElement.maxLines ?? 1,
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
    return {
      ...rawElement,
      staticText: rawElement.staticText || "Siyah Kutu",
      font: rawElement.font ?? 2,
      paddingX: rawElement.paddingX ?? 16,
      paddingY: rawElement.paddingY ?? 8,
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

export function estimateWrappedTextWidth(lines: string[], fontSize: number, wrapWidth: number) {
  const widestLine = Math.max(...lines.map((line) => estimateTextWidth(line, fontSize)), 0);
  return Math.max(56, Math.min(wrapWidth, widestLine));
}

export function wrapText(value: string, fontSize: number, wrapWidth: number, maxLines: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (estimateTextWidth(next, fontSize) <= wrapWidth || !current) {
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
  visibleLines[safeLines - 1] = `${visibleLines[safeLines - 1]} ${lines.slice(safeLines).join(" ")}`.trim();
  return visibleLines;
}

export function getBlackBoxMetrics(element: BlackBoxElement, record?: DataRecord) {
  const text = toAscii(resolveBinding(record, element.binding, element.staticText || element.label)).trim() || element.label;
  const fontSize = FONT_HEIGHT_MAP[element.font];
  const width = estimateTextWidth(text, fontSize) + element.paddingX * 2;
  const height = fontSize + element.paddingY * 2;

  return { text, fontSize, width, height };
}

export function getElementBottom(element: CanvasElement) {
  switch (element.type) {
    case "text": {
      const fontSize = FONT_HEIGHT_MAP[element.font];
      const text = element.staticText || element.label;
      const lines = wrapText(text, fontSize, element.wrapWidth, element.maxLines);
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
      const lines = wrapText(text, fontSize, element.wrapWidth, element.maxLines);
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
        width: estimateWrappedTextWidth(lines, fontSize, element.wrapWidth),
        height: Math.max(lineHeight, lines.length * lineHeight),
        align: element.align,
      };
    }

    if (element.type === "blackBox") {
      const { text, fontSize, width, height } = getBlackBoxMetrics(element, record);
      return {
        id: element.id,
        type: "blackBox",
        x: element.x,
        y: element.y,
        width,
        height,
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
    const adjustedY = offsetY + element.y + dynamicYOffset;

    if (element.type === "text") {
      const value = toAscii(resolveBinding(record, element.binding, element.staticText || element.label)).replace(/"/g, "'");
      const fontSize = FONT_HEIGHT_MAP[element.font];
      const wrappedLines = wrapText(value, fontSize, element.wrapWidth, element.maxLines);
      const lineHeight = fontSize + 4;

      wrappedLines.forEach((lineText, index) => {
        const textWidth = estimateTextWidth(lineText, fontSize);
        const commandX =
          element.align === "right"
            ? offsetX + element.x - textWidth
            : element.align === "center"
              ? offsetX + element.x - Math.round(textWidth / 2)
              : offsetX + element.x;

        lines.push(
          `A${commandX},${adjustedY + index * lineHeight},0,${element.font},1,1,${element.reverse ? "R" : "N"},"${lineText}"`,
        );
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
      const value = toAscii(resolveBinding(record, element.binding, element.staticText || element.label)).replace(/"/g, "'");
      lines.push(
        `A${offsetX + element.x + element.paddingX},${adjustedY + element.paddingY},0,${element.font},1,1,R,"${value}"`,
      );
      return;
    }

    if (element.type === "line") {
      lines.push(`LO${offsetX + element.x},${adjustedY},${element.width},${element.height}`);
      return;
    }

    if (element.type === "box") {
      lines.push(
        `X${offsetX + element.x},${adjustedY},${element.thickness},${offsetX + element.x + element.width},${adjustedY + element.height}`,
      );
      return;
    }

    const value = toAscii(resolveBinding(record, element.binding, element.staticText || "BARCODE")).replace(/"/g, "'");
    lines.push(
      `B${offsetX + element.x},${adjustedY},0,${element.barcodeType},${element.narrow},${element.wide},${element.height},${element.humanReadable ? "B" : "N"},"${value}"`,
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

  rows.forEach((row) => {
    if (row.startsWith("A")) {
      const match = row.match(/^A(\d+),(\d+),\d,(\d),\d,\d,([RN]),"(.*)"$/);
      if (!match) {
        return;
      }

      const x = Math.max(0, Number(match[1]) - offsetX);
      const y = Math.max(0, Number(match[2]) - offsetY);
      const font = clampTextFont(Number(match[3]));
      const reverse = match[4] === "R";
      const text = match[5];
      const fontSize = FONT_HEIGHT_MAP[font];

      result.push({
        id: uid(),
        type: "text",
        label: "Text",
        x,
        y,
        binding: "",
        staticText: text,
        font,
        reverse,
        align: "left",
        wrapWidth: Math.max(56, estimateTextWidth(text, fontSize)),
        maxLines: 1,
      });
      return;
    }

    if (row.startsWith("LO")) {
      const match = row.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
      if (!match) {
        return;
      }

      const width = Math.max(1, Number(match[3]));
      const height = Math.max(1, Number(match[4]));

      result.push({
        id: uid(),
        type: "line",
        label: "Cizgi",
        x: Math.max(0, Number(match[1]) - offsetX),
        y: Math.max(0, Number(match[2]) - offsetY),
        orientation: width >= height ? "horizontal" : "vertical",
        width,
        height,
      });
      return;
    }

    if (row.startsWith("X")) {
      const match = row.match(/^X(\d+),(\d+),(\d+),(\d+),(\d+)$/);
      if (!match) {
        return;
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
      return;
    }

    if (row.startsWith("B")) {
      const match = row.match(/^B(\d+),(\d+),\d,([13]),(\d+),(\d+),(\d+),([BN]),"(.*)"$/);
      if (!match) {
        return;
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
  });

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
  input.value = encodeURI(epl);

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