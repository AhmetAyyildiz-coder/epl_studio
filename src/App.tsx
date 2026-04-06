import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Rnd } from "react-rnd";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type Primitive = string | number | boolean | null | undefined;
type DataRecord = Record<string, Primitive>;
type ElementType = "text" | "line" | "box" | "barcode";

type BaseElement = {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
};

type TextElement = BaseElement & {
  type: "text";
  binding: string;
  staticText: string;
  font: 1 | 2 | 3 | 4;
  reverse: boolean;
  align: "left" | "center" | "right";
  wrapWidth: number;
  maxLines: number;
};

type LineElement = BaseElement & {
  type: "line";
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
};

type BoxElement = BaseElement & {
  type: "box";
  width: number;
  height: number;
  thickness: number;
};

type BarcodeElement = BaseElement & {
  type: "barcode";
  binding: string;
  staticText: string;
  barcodeType: "1" | "3";
  narrow: number;
  wide: number;
  height: number;
  humanReadable: boolean;
};

type CanvasElement = TextElement | LineElement | BoxElement | BarcodeElement;

type LayoutDraft = {
  id: string;
  name: string;
  elements: CanvasElement[];
};

type DataSourceConfig = {
  jsonText: string;
};

type PreviewCommand =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      lines: string[];
      fontSize: number;
      reverse: boolean;
      width: number;
      height: number;
      align: "left" | "center" | "right";
    }
  | {
      id: string;
      type: "line";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      id: string;
      type: "box";
      x: number;
      y: number;
      width: number;
      height: number;
      thickness: number;
    }
  | {
      id: string;
      type: "barcode";
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      humanReadable: boolean;
    };

const STORAGE_KEY = "epl-studio-layouts-v3";
const LABEL_WIDTH_MM = 60;
const LABEL_HEIGHT_MM = 35;
const DEFAULT_DPI = 300;
const DOTS_PER_MM = DEFAULT_DPI / 25.4;
const LABEL_WIDTH_DOTS = Math.round(LABEL_WIDTH_MM * DOTS_PER_MM);
const LABEL_HEIGHT_DOTS = Math.round(LABEL_HEIGHT_MM * DOTS_PER_MM);
const DEFAULT_PRINT_OFFSET_X = 260;
const DEFAULT_PRINT_OFFSET_Y = 8;
const FONT_HEIGHT_MAP: Record<TextElement["font"], number> = { 1: 20, 2: 28, 3: 36, 4: 44 };

const SAMPLE_DATA_JSON = JSON.stringify(
  [
    {
      musteri: "RESIMLIK-Tup",
      pazar: "",
      hammadde: "14 K",
      karakterKod: "50M CATAL TAVSIZ TEL OV.BIL-58mm(UZUN KEN TEK KES)",
      skkhId: 33173465,
      karakterId: 249682,
      fiyat: 0.0,
      karakterAdet: 6.0,
      refNo: 888327,
      atelye: 947,
      att: "2026-04-24T15:36:58.477",
      renk: "W",
      milyem: 585.0,
      astarKalinlik: null,
      modelKodu: "",
      modelId: 0,
      anaAtelye: "Omega",
      konsolideAdlari: "2026[ OMG-14 ]",
      sirttanKaynak: 0.0,
      montajBirimAdi: "VG Montaj",
      tip: 1,
      isEmriId: 2989031,
      listeGram: 0.0,
      damga: "",
    },
  ],
  null,
  2,
);

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

const fieldLabels = {
  musteri: "Musteri",
  pazar: "Pazar",
  hammadde: "Hammadde",
  karakterKod: "Karakter Kod",
  skkhId: "SKKH ID",
  karakterId: "Karakter ID",
  adet: "Adet",
  fiyat: "Fiyat",
  karakterAdet: "Karakter Adet",
  refNo: "Ref No",
  atelye: "Atelye",
  att: "ATT",
  renk: "Renk",
  milyem: "Milyem",
  astarKalinlik: "Astar Kalinlik",
  modelKodu: "Model Kodu",
  modelId: "Model ID",
  anaAtelye: "Ana Atelye",
  konsolideAdlari: "Konsolide Adlari",
  sirttanKaynak: "Sirttan Kaynak",
  montajBirimAdi: "Montaj Birim",
  tip: "Tip",
  isEmriId: "Is Emri ID",
  listeGram: "Liste Gram",
  damga: "Damga",
} as const;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toAscii(value: string) {
  return value.replace(trRegex, (char) => trMap[char] ?? char);
}

function formatElementOptionLabel(element: CanvasElement, index: number) {
  return `${index + 1}. ${element.label || "Adsiz"} [${element.type}] (${element.x}, ${element.y})`;
}

function textElement(
  label: string,
  binding: string,
  x: number,
  y: number,
  font: 1 | 2 | 3 | 4 = 2,
  align: "left" | "center" | "right" = "left",
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

function defaultElements(): CanvasElement[] {
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

function emptyLayout(name = "Yeni Taslak"): LayoutDraft {
  return { id: uid(), name, elements: defaultElements() };
}

function seedLayouts(): LayoutDraft[] {
  return [{ id: uid(), name: "Standart Fis Etiketi", elements: defaultElements() }];
}

function readLayouts() {
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
      name: layout.name ?? "Adsiz Taslak",
      elements:
        layout.elements?.length
          ? (layout.elements as CanvasElement[]).map((element) => {
              if (element.type === "text") {
                const next = {
                  ...element,
                  align: element.align ?? "left" as const,
                  wrapWidth: element.wrapWidth ?? 260,
                  maxLines: element.maxLines ?? 1,
                };
                if (next.binding === "fiyat" && !("align" in element)) {
                  return { ...next, align: "right" as const, x: Math.max(700, next.x) };
                }
                return next;
              }
              if (element.type === "line") {
                return { ...element, orientation: element.orientation ?? "horizontal" };
              }
              return { ...element };
            })
          : defaultElements(),
    }));
  } catch {
    return seedLayouts();
  }
}

function normalizeRecords(payload: unknown): DataRecord[] {
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

function resolveBinding(record: DataRecord | undefined, binding: string, fallback: string) {
  if (!binding.trim()) {
    return fallback;
  }
  const value = record?.[binding];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

// Code 39 character patterns: each pattern represents 5 bars and 4 spaces (9 elements total)
// 1 = narrow, 2 = wide. Pattern order: bar, space, bar, space, bar, space, bar, space, bar
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
  "%": [1,1,2,1,2,1,2,1,2], "*": [1,1,2,1,2,2,1,1,2], // Start/Stop character
};

function generateCode39Bars(text: string, narrow: number, wide: number): Array<{x: number; width: number}> {
  const bars: Array<{x: number; width: number}> = [];
  const charWidth = (narrow * 3 + wide * 6) * 2; // Approximate width per character
  let xPos = 8; // Start padding

  // Add start character
  const startPattern = CODE39_PATTERNS["*"] || [1,1,2,1,2,2,1,1,2];
  xPos = addPatternBars(bars, startPattern, xPos, narrow, wide);
  xPos += narrow; // Inter-character gap

  // Add each character
  for (const char of text.toUpperCase()) {
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) continue;
    xPos = addPatternBars(bars, pattern, xPos, narrow, wide);
    xPos += narrow; // Inter-character gap
  }

  // Add stop character
  xPos = addPatternBars(bars, startPattern, xPos, narrow, wide);

  return bars;
}

function addPatternBars(
  bars: Array<{x: number; width: number}>,
  pattern: number[],
  xPos: number,
  narrow: number,
  wide: number
): number {
  for (let i = 0; i < pattern.length; i++) {
    if (i % 2 === 0) {
      // Bar (odd indices are bars)
      bars.push({
        x: xPos,
        width: pattern[i] === 1 ? narrow * 2 : wide * 2, // Scale for visibility
      });
    }
    xPos += (pattern[i] === 1 ? narrow : wide) * 2; // Scale both bars and spaces
  }
  return xPos;
}

function barcodePreviewWidth(value: string, narrow: number, wide: number) {
  // More accurate width calculation based on Code 39 specification
  const barCount = value.length * 5 + 10; // 5 bars per char + start/stop
  const avgBarWidth = (narrow + wide) / 2;
  return Math.min(340, Math.max(120, barCount * avgBarWidth * 2.5));
}

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(56, Math.round(text.length * fontSize * 0.58));
}

function estimateWrappedTextWidth(lines: string[], fontSize: number, wrapWidth: number) {
  const widestLine = Math.max(...lines.map((line) => estimateTextWidth(line, fontSize)), 0);
  return Math.max(56, Math.min(wrapWidth, widestLine));
}

function wrapText(value: string, fontSize: number, wrapWidth: number, maxLines: number) {
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

function buildPreviewCommands(layout: LayoutDraft, record: DataRecord | undefined): PreviewCommand[] {
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

function buildEpl(layout: LayoutDraft, record: DataRecord | undefined, offsetX: number, offsetY: number) {
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
        const defaultTextHeight = lineHeight;
        verticalShifts.push({
          startY: element.y,
          endY: element.y + textBlockHeight,
          shift: textBlockHeight - defaultTextHeight,
        });
      }
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

function clampTextFont(value: number): TextElement["font"] {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return 2;
}

function parseEplToElements(epl: string, offsetX: number, offsetY: number): CanvasElement[] {
  const result: CanvasElement[] = [];
  const rows = epl
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

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

function applyEplOffset(epl: string, offsetX: number, offsetY: number) {
  const rows = epl.split(/\r?\n/);
  const shifted = rows.map((raw) => {
    const row = raw.trim();
    if (!row) {
      return raw;
    }

    let match = row.match(/^A(\d+),(\d+),(.*)$/);
    if (match) {
      const x = Number(match[1]) + offsetX;
      const y = Number(match[2]) + offsetY;
      return `A${x},${y},${match[3]}`;
    }

    match = row.match(/^LO(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
      const x = Number(match[1]) + offsetX;
      const y = Number(match[2]) + offsetY;
      return `LO${x},${y},${match[3]},${match[4]}`;
    }

    match = row.match(/^X(\d+),(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
      const x1 = Number(match[1]) + offsetX;
      const y1 = Number(match[2]) + offsetY;
      const x2 = Number(match[4]) + offsetX;
      const y2 = Number(match[5]) + offsetY;
      return `X${x1},${y1},${match[3]},${x2},${y2}`;
    }

    match = row.match(/^B(\d+),(\d+),(.*)$/);
    if (match) {
      const x = Number(match[1]) + offsetX;
      const y = Number(match[2]) + offsetY;
      return `B${x},${y},${match[3]}`;
    }

    return raw;
  });

  return shifted.join("\n");
}

function submitEpl(epl: string) {
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

function ElementPreview({
  commands,
  selectedId,
  onSelect,
  onMove,
}: {
  commands: PreviewCommand[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        borderRadius: 0,
        border: "1px solid rgba(0,0,0,0.14)",
        bgcolor: "#fffdfa",
        p: 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: `${LABEL_WIDTH_DOTS}px`,
          height: `${LABEL_HEIGHT_DOTS}px`,
          borderRadius: 0,
          overflow: "hidden",
          bgcolor: "#fffdfa",
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: `${5 * DOTS_PER_MM}px ${5 * DOTS_PER_MM}px`,
          border: "2px solid #1f2522",
        }}
      >
        {commands.map((command) => {
          const selected = selectedId === command.id;
          const stroke = selected ? "#bf360c" : "rgba(0,77,64,0.22)";
          const fill = selected ? "rgba(191,54,12,0.08)" : "rgba(0,77,64,0.04)";

          if (command.type === "text") {
            const anchorLeft =
              command.align === "right"
                ? command.x - command.width
                : command.align === "center"
                  ? command.x - Math.round(command.width / 2)
                  : command.x;

            return (
              <Rnd
                key={command.id}
                size={{ width: command.width + 8, height: command.height + 8 }}
                position={{ x: Math.max(0, anchorLeft - 4), y: Math.max(0, command.y) }}
                bounds="parent"
                enableResizing={false}
                dragGrid={[1, 1]}
                onDragStart={() => onSelect(command.id)}
                onDragStop={(_, data) => {
                  const nextX =
                    command.align === "right"
                      ? data.x + command.width + 4
                      : command.align === "center"
                        ? data.x + Math.round(command.width / 2) + 4
                        : data.x + 4;
                  onMove(command.id, nextX, data.y);
                }}
                style={{ zIndex: selected ? 4 : 2 }}
              >
                <Box
                  onClick={() => onSelect(command.id)}
                  sx={{
                    width: "100%",
                    height: "100%",
                    px: 0.5,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent:
                      command.align === "right"
                        ? "flex-end"
                        : command.align === "center"
                          ? "center"
                          : "flex-start",
                    border: `1px dashed ${stroke}`,
                    bgcolor: fill,
                    borderRadius: 1,
                    cursor: "grab",
                    userSelect: "none",
                    fontFamily: "monospace",
                    fontSize: `${command.fontSize}px`,
                    lineHeight: 1,
                    whiteSpace: "pre-wrap",
                    color: command.reverse ? "#fff" : "#111",
                  }}
                >
                  {command.lines.join("\n")}
                </Box>
              </Rnd>
            );
          }

          if (command.type === "line") {
            return (
              <Rnd
                key={command.id}
                size={{ width: command.width, height: Math.max(8, command.height) }}
                position={{ x: command.x, y: command.y }}
                bounds="parent"
                enableResizing={false}
                dragGrid={[1, 1]}
                onDragStart={() => onSelect(command.id)}
                onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
                style={{ zIndex: selected ? 4 : 2 }}
              >
                <Box
                  onClick={() => onSelect(command.id)}
                  sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: "#111",
                    outline: selected ? "2px solid #bf360c" : "none",
                    cursor: "grab",
                  }}
                />
              </Rnd>
            );
          }

          if (command.type === "box") {
            return (
              <Rnd
                key={command.id}
                size={{ width: command.width, height: command.height }}
                position={{ x: command.x, y: command.y }}
                bounds="parent"
                enableResizing={false}
                dragGrid={[1, 1]}
                onDragStart={() => onSelect(command.id)}
                onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
                style={{ zIndex: selected ? 4 : 2 }}
              >
                <Box
                  onClick={() => onSelect(command.id)}
                  sx={{
                    width: "100%",
                    height: "100%",
                    border: `${command.thickness}px ${selected ? "dashed" : "solid"} ${selected ? "#bf360c" : "#111"}`,
                    cursor: "grab",
                    boxSizing: "border-box",
                  }}
                />
              </Rnd>
            );
          }

          const bars = generateCode39Bars(command.text, 2, 4);
          return (
            <Rnd
              key={command.id}
              size={{ width: command.width, height: command.height }}
              position={{ x: command.x, y: command.y }}
              bounds="parent"
              enableResizing={false}
              dragGrid={[1, 1]}
              onDragStart={() => onSelect(command.id)}
              onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
              style={{ zIndex: selected ? 4 : 2 }}
            >
              <Box
                onClick={() => onSelect(command.id)}
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  bgcolor: "#fff",
                  border: `1px dashed ${stroke}`,
                  cursor: "grab",
                  overflow: "hidden",
                }}
              >
                {bars.map((bar, index) => (
                  <Box
                    key={`${command.id}-${index}`}
                    sx={{
                      position: "absolute",
                      left: bar.x,
                      top: 8,
                      width: bar.width,
                      height: command.height - (command.humanReadable ? 28 : 16),
                      bgcolor: "#111",
                    }}
                  />
                ))}
                {command.humanReadable ? (
                  <Typography
                    sx={{
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 4,
                      fontFamily: "monospace",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    {command.text}
                  </Typography>
                ) : null}
              </Box>
            </Rnd>
          );
        })}
      </Box>
    </Box>
  );
}

export default function App() {
  const [layouts, setLayouts] = useState<LayoutDraft[]>(() => readLayouts());
  const [selectedLayoutId, setSelectedLayoutId] = useState(() => readLayouts()[0]?.id ?? "");
  const [draft, setDraft] = useState<LayoutDraft>(() => readLayouts()[0] ?? emptyLayout());
  const [dataSource, setDataSource] = useState<DataSourceConfig>({
    jsonText: SAMPLE_DATA_JSON,
  });
  const [records, setRecords] = useState<DataRecord[]>(() => normalizeRecords(JSON.parse(SAMPLE_DATA_JSON)));
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [selectedRecordIndexes, setSelectedRecordIndexes] = useState<number[]>([0]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(() => draft.elements[0]?.id ?? null);
  const [printOffsetX, setPrintOffsetX] = useState(DEFAULT_PRINT_OFFSET_X);
  const [printOffsetY, setPrintOffsetY] = useState(DEFAULT_PRINT_OFFSET_Y);
  const [message, setMessage] = useState("Veri kaynagi yukleyin, canvas ustunde elemanlari tasiyin ve secili kayitlari yazdirin.");
  const [editedEpl, setEditedEpl] = useState(() => {
    // Başlangıç EPL'sini hesapla
    if (!selectedRecordIndexes.length) return "";
    return selectedRecordIndexes
      .map((index) => buildEpl(draft, records[index], 0, 0))
      .join("");
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  }, [layouts]);

  const activeRecord = records[selectedRecordIndex];
  const previewCommands = useMemo(() => buildPreviewCommands(draft, activeRecord), [draft, activeRecord]);
  const selectedElement = draft.elements.find((element) => element.id === selectedElementId) ?? null;
  const datasetKeys = useMemo(() => Array.from(new Set(records.flatMap((record) => Object.keys(record)))), [records]);
  // TODO: API sozlesmesi netlesince { name: draft.name, eplDesign: selectedEpl } payload'i buradan gonderilecek.
  const selectedEpl = useMemo(() => {
    if (!selectedRecordIndexes.length) {
      return "";
    }

    return selectedRecordIndexes
      .map((index) => buildEpl(draft, records[index], 0, 0))
      .join("");
  }, [draft, records, selectedRecordIndexes]);

  // EPL değiştiğinde otomatik güncelle
  useEffect(() => {
    setEditedEpl(selectedEpl);
  }, [selectedEpl]);

  function selectLayout(layoutId: string) {
    const layout = layouts.find((item) => item.id === layoutId);
    if (!layout) {
      return;
    }
    setSelectedLayoutId(layout.id);
    setDraft({
      ...layout,
      elements: layout.elements.map((element) => ({ ...element })),
    });
    setSelectedElementId(layout.elements[0]?.id ?? null);
    setMessage(`"${layout.name}" acildi.`);
  }

  function saveLayout() {
    if (!draft.name.trim()) {
      setMessage("Taslak adi zorunlu.");
      return;
    }
    setLayouts((prev) => {
      const exists = prev.some((layout) => layout.id === draft.id);
      if (exists) {
        return prev.map((layout) => (layout.id === draft.id ? draft : layout));
      }
      return [draft, ...prev];
    });
    setSelectedLayoutId(draft.id);
    setMessage(`"${draft.name}" kaydedildi.`);
  }

  function duplicateLayout() {
    const next = {
      ...draft,
      id: uid(),
      name: `${draft.name} Kopya`,
      elements: draft.elements.map((element) => ({ ...element })),
    };
    setDraft(next);
    setSelectedLayoutId(next.id);
    setSelectedElementId(next.elements[0]?.id ?? null);
    setMessage("Taslak kopyalandi.");
  }

  function resetLayout() {
    const next = emptyLayout(draft.name);
    setDraft(next);
    setSelectedElementId(next.elements[0]?.id ?? null);
    setMessage("Canvas sifirlandi.");
  }

  function updateDraftName(name: string) {
    setDraft((prev) => ({ ...prev, name }));
  }

  function updateElement(id: string, patch: Partial<CanvasElement>) {
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as CanvasElement) : element,
      ),
    }));
  }

  function addElement(type: ElementType) {
    const baseX = 30;
    const baseY = 40 + draft.elements.length * 12;

    let element: CanvasElement;
    if (type === "text") {
      element = textElement("Yeni Metin", "", baseX, baseY, 2);
    } else if (type === "line") {
      element = {
        id: uid(),
        type: "line",
        label: "Cizgi",
        x: baseX,
        y: baseY,
        orientation: "horizontal",
        width: 220,
        height: 3,
      };
    } else if (type === "box") {
      element = { id: uid(), type: "box", label: "Kutu", x: baseX, y: baseY, width: 180, height: 70, thickness: 2 };
    } else {
      element = {
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
      };
    }

    setDraft((prev) => ({ ...prev, elements: [...prev.elements, element] }));
    setSelectedElementId(element.id);
    setMessage(`${type} elemani eklendi.`);
  }

  function removeSelectedElement() {
    if (!selectedElementId) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.filter((element) => element.id !== selectedElementId),
    }));
    setSelectedElementId(null);
    setMessage("Eleman silindi.");
  }

  function clearAllElements() {
    setDraft((prev) => ({
      ...prev,
      elements: [],
    }));
    setSelectedElementId(null);
    setMessage("Tum elemanlar temizlendi.");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" || !selectedElementId) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest('[role="textbox"]') ||
          target.closest('[role="combobox"]'))
      ) {
        return;
      }

      event.preventDefault();
      removeSelectedElement();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId]);

  function applyJsonData() {
    try {
      const payload = JSON.parse(dataSource.jsonText) as unknown;
      const nextRecords = normalizeRecords(payload);
      if (!nextRecords.length) {
        throw new Error("Kayit bulunamadi");
      }
      setRecords(nextRecords);
      setSelectedRecordIndex(0);
      setSelectedRecordIndexes([0]);
      setMessage(`${nextRecords.length} kayit JSON'dan yuklendi.`);
    } catch (error) {
      setMessage(`JSON gecersiz: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }

  function printSelectedRecords() {
    if (!selectedRecordIndexes.length) {
      setMessage("Yazdirma icin secili kayit yok.");
      return;
    }

    const rawEpl = editedEpl || selectedEpl;
    const shiftedEpl = applyEplOffset(rawEpl, printOffsetX, printOffsetY);
    submitEpl(shiftedEpl);
    setMessage(`${selectedRecordIndexes.length} kayit yazdirma servisine gonderildi.`);
  }

  async function copyEplToClipboard() {
    if (!editedEpl) {
      setMessage("Kopyalanacak EPL cikti yok.");
      return;
    }

    try {
      await navigator.clipboard.writeText(editedEpl);
      setMessage("EPL cikti panoya kopyalandi.");
    } catch (error) {
      setMessage(`EPL kopyalanamadi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }

  function applyEditedEplToPreview() {
    const parsed = parseEplToElements(editedEpl, printOffsetX, printOffsetY);
    if (!parsed.length) {
      setMessage("EPL parse edilemedi. A/LO/X/B komutlarini kontrol edin.");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      elements: parsed,
    }));
    setSelectedElementId(parsed[0]?.id ?? null);
    setMessage(`${parsed.length} eleman EPL'den parse edilip preview'e uygulandi.`);
  }

  function handleNumberFieldWheel(event: ReactWheelEvent<HTMLDivElement>) {
    // Prevent wheel scroll on number fields by blurring the input
    // This avoids the passive event listener issue
    (event.target as HTMLInputElement).blur();
  }

  function handleNumberFieldArrow(
    event: ReactKeyboardEvent<HTMLDivElement>,
    value: number,
    onValueChange: (next: number) => void,
    min = 0,
    step = 1,
  ) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowUp" ? 1 : -1;
    onValueChange(Math.max(min, (Number(value) || 0) + direction * step));
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="overline">Durum</Typography>
            <Typography variant="body1">{layouts.length} taslak, {records.length} veri kaydi</Typography>
            <Alert severity="info" sx={{ borderRadius: 3 }}>{message}</Alert>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, xl: 3 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Taslaklar</Typography>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const next = emptyLayout();
                      setDraft(next);
                      setSelectedLayoutId(next.id);
                      setSelectedElementId(next.elements[0]?.id ?? null);
                    }}
                  >
                    +
                  </IconButton>
                </Stack>
                <List sx={{ p: 0 }}>
                  {layouts.map((layout) => (
                    <ListItemButton
                      key={layout.id}
                      selected={layout.id === selectedLayoutId}
                      onClick={() => selectLayout(layout.id)}
                      sx={{ mb: 1, borderRadius: 3 }}
                    >
                      <ListItemText primary={layout.name} secondary={`${layout.elements.length} eleman`} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="h6">JSON Veri</Typography>
                  <Typography color="text.secondary">
                    Developer dogrudan JSON nesnesi veya JSON array yapistirir. Sistem array ya da tek obje formatini okur.
                  </Typography>
                  <TextField
                    label="JSON"
                    multiline
                    minRows={10}
                    value={dataSource.jsonText}
                    onChange={(event) => setDataSource((prev) => ({ ...prev, jsonText: event.target.value }))}
                  />
                  <Button variant="contained" onClick={applyJsonData}>JSON Uygula</Button>
                </Stack>
              </Paper>

            </Stack>
          </Grid>

          <Grid size={{ xs: 12, xl: 6 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                  <TextField label="Taslak Adi" value={draft.name} onChange={(event) => updateDraftName(event.target.value)} sx={{ minWidth: 240 }} />
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button variant="outlined" onClick={duplicateLayout}>Kopyala</Button>
                    <Button variant="outlined" color="warning" onClick={resetLayout}>Sifirla</Button>
                    <Button variant="contained" onClick={saveLayout}>Kaydet</Button>
                    <Button variant="contained" color="secondary" onClick={printSelectedRecords}>Secilileri Yazdir</Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} mb={2}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`${DEFAULT_DPI} DPI`} size="small" />
                    <Chip label={`${LABEL_WIDTH_MM}mm x ${LABEL_HEIGHT_MM}mm`} size="small" />
                    <Chip label={`${LABEL_WIDTH_DOTS} x ${LABEL_HEIGHT_DOTS} dot`} size="small" />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="X Ofset"
                      type="number"
                      value={printOffsetX}
                      onChange={(event) => setPrintOffsetX(Number(event.target.value) || 0)}
                      onBlur={() => setPrintOffsetX((prev) => Math.max(0, prev || 0))}
                      onWheel={handleNumberFieldWheel}
                      onKeyDown={(event) => handleNumberFieldArrow(event, printOffsetX, setPrintOffsetX, 0)}
                    />
                    <TextField
                      size="small"
                      label="Y Ofset"
                      type="number"
                      value={printOffsetY}
                      onChange={(event) => setPrintOffsetY(Number(event.target.value) || 0)}
                      onBlur={() => setPrintOffsetY((prev) => Math.max(0, prev || 0))}
                      onWheel={handleNumberFieldWheel}
                      onKeyDown={(event) => handleNumberFieldArrow(event, printOffsetY, setPrintOffsetY, 0)}
                    />
                  </Stack>
                </Stack>

                <ElementPreview
                  commands={previewCommands}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onMove={(id, x, y) => updateElement(id, { x, y })}
                />
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                    <Typography variant="h6">EPL Ciktisi</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={applyEditedEplToPreview} disabled={!editedEpl.trim()}>
                        EPL Uygula
                      </Button>
                      <Button variant="outlined" onClick={copyEplToClipboard} disabled={!editedEpl}>Kopyala</Button>
                    </Stack>
                  </Stack>
                  <TextField
                    multiline
                    minRows={10}
                    maxRows={18}
                    value={editedEpl}
                    onChange={(e) => setEditedEpl(e.target.value)}
                    placeholder="EPL ciktisi buraya gelecek..."
                    sx={{
                      "& .MuiInputBase-input": {
                        fontFamily: "monospace",
                        fontSize: 13,
                        whiteSpace: "pre",
                      },
                    }}
                  />
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    EPL ciktisi taslaktan otomatik uretilir. Elle degisiklik yapabilirsiniz; taslak/veri degistiginde otomatik guncellenir.
                  </Alert>
                </Stack>
              </Paper>

            </Stack>
          </Grid>

          <Grid size={{ xs: 12, xl: 3 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={1.5}>Toolbox</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button variant="outlined" onClick={() => addElement("text")}>Text</Button>
                  <Button variant="outlined" onClick={() => addElement("line")}>Cizgi</Button>
                  <Button variant="outlined" onClick={() => addElement("box")}>Kutu</Button>
                  <Button variant="outlined" onClick={() => addElement("barcode")}>Barcode</Button>
                  <Button variant="outlined" color="error" onClick={removeSelectedElement}>Sil</Button>
                  <Button variant="outlined" color="error" onClick={clearAllElements}>Tum Elemanlari Temizle</Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={1.5}>Eleman Ozellikleri</Typography>
                {draft.elements.length ? (
                  <Stack spacing={1.5}>
                    <TextField
                      select
                      label="Eleman Sec"
                      value={selectedElementId ?? ""}
                      onChange={(event) => setSelectedElementId(event.target.value)}
                    >
                      {draft.elements.map((element, index) => (
                        <MenuItem key={element.id} value={element.id}>
                          {formatElementOptionLabel(element, index)}
                        </MenuItem>
                      ))}
                    </TextField>
                    {selectedElement ? (
                      <>
                    <TextField
                      label="Eleman Adi"
                      value={selectedElement.label}
                      helperText="Bu ad sadece editor icinde gorunur."
                      onChange={(event) => updateElement(selectedElement.id, { label: event.target.value })}
                    />
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="X"
                          type="number"
                          value={selectedElement.x}
                          onChange={(event) => updateElement(selectedElement.id, { x: Number(event.target.value) || 0 })}
                          onBlur={() => updateElement(selectedElement.id, { x: Math.max(0, selectedElement.x || 0) })}
                          onWheel={handleNumberFieldWheel}
                          onKeyDown={(event) =>
                            handleNumberFieldArrow(event, selectedElement.x, (next) => updateElement(selectedElement.id, { x: next }), 0)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Y"
                          type="number"
                          value={selectedElement.y}
                          onChange={(event) => updateElement(selectedElement.id, { y: Number(event.target.value) || 0 })}
                          onBlur={() => updateElement(selectedElement.id, { y: Math.max(0, selectedElement.y || 0) })}
                          onWheel={handleNumberFieldWheel}
                          onKeyDown={(event) =>
                            handleNumberFieldArrow(event, selectedElement.y, (next) => updateElement(selectedElement.id, { y: next }), 0)
                          }
                        />
                      </Grid>
                    </Grid>

                    {selectedElement.type === "text" ? (
                      <>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Binding secilirse veri alanindan okur. Veri bos gelirse alttaki varsayilan metni kullanir.
                        </Alert>
                        <TextField
                          select
                          label="Alan Baglantisi"
                          value={selectedElement.binding}
                          onChange={(event) => updateElement(selectedElement.id, { binding: event.target.value })}
                          helperText="JSON icindeki alanlardan birini sec."
                        >
                          <MenuItem value="">Bos</MenuItem>
                          {Array.from(new Set([...datasetKeys, selectedElement.binding])).filter(Boolean).map((key) => (
                            <MenuItem key={key} value={key}>
                              {fieldLabels[key as keyof typeof fieldLabels] ?? key}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Varsayilan Metin"
                          value={selectedElement.staticText}
                          helperText={selectedElement.binding ? "Secilen binding bos donerse bu metin basilir." : "Binding yoksa dogrudan bu metin basilir."}
                          onChange={(event) => updateElement(selectedElement.id, { staticText: event.target.value })}
                        />
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="Wrap Width"
                              type="number"
                              value={selectedElement.wrapWidth}
                              onChange={(event) => updateElement(selectedElement.id, { wrapWidth: Number(event.target.value) || 0 })}
                              onBlur={() =>
                                updateElement(selectedElement.id, {
                                  wrapWidth: Math.max(56, selectedElement.wrapWidth || 0),
                                })
                              }
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.wrapWidth, (next) => updateElement(selectedElement.id, { wrapWidth: next }), 56)
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="Max Lines"
                              type="number"
                              value={selectedElement.maxLines}
                              onChange={(event) => updateElement(selectedElement.id, { maxLines: Number(event.target.value) || 0 })}
                              onBlur={() =>
                                updateElement(selectedElement.id, {
                                  maxLines: Math.max(1, selectedElement.maxLines || 0),
                                })
                              }
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.maxLines, (next) => updateElement(selectedElement.id, { maxLines: next }), 1)
                              }
                            />
                          </Grid>
                        </Grid>
                        <TextField select label="Font" value={selectedElement.font} onChange={(event) => updateElement(selectedElement.id, { font: Number(event.target.value) as TextElement["font"] })}>
                          <MenuItem value={1}>Font 1</MenuItem>
                          <MenuItem value={2}>Font 2</MenuItem>
                          <MenuItem value={3}>Font 3</MenuItem>
                          <MenuItem value={4}>Font 4</MenuItem>
                        </TextField>
                        <TextField select label="Hiza" value={selectedElement.align} onChange={(event) => updateElement(selectedElement.id, { align: event.target.value as TextElement["align"] })}>
                          <MenuItem value="left">Sol</MenuItem>
                          <MenuItem value="center">Orta</MenuItem>
                          <MenuItem value="right">Sag</MenuItem>
                        </TextField>
                        <FormControlLabel control={<Switch checked={selectedElement.reverse} onChange={(event) => updateElement(selectedElement.id, { reverse: event.target.checked })} />} label="Ters Baski" />
                      </>
                    ) : null}

                    {selectedElement.type === "line" ? (
                      <>
                        <TextField
                          select
                          label="Yon"
                          value={selectedElement.orientation}
                          onChange={(event) => {
                            const nextOrientation = event.target.value as LineElement["orientation"];
                            updateElement(selectedElement.id, {
                              orientation: nextOrientation,
                              width:
                                nextOrientation === "horizontal"
                                  ? Math.max(selectedElement.width, 120)
                                  : Math.min(selectedElement.width, 3),
                              height:
                                nextOrientation === "vertical"
                                  ? Math.max(selectedElement.height, 120)
                                  : Math.min(selectedElement.height, 3),
                            });
                          }}
                        >
                          <MenuItem value="horizontal">Yatay</MenuItem>
                          <MenuItem value="vertical">Dikey</MenuItem>
                        </TextField>
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label={selectedElement.orientation === "horizontal" ? "Uzunluk" : "Kalınlık"}
                              type="number"
                              value={selectedElement.width}
                              onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { width: Math.max(1, selectedElement.width || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.width, (next) => updateElement(selectedElement.id, { width: next }), 1)
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label={selectedElement.orientation === "vertical" ? "Uzunluk" : "Kalınlık"}
                              type="number"
                              value={selectedElement.height}
                              onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { height: Math.max(1, selectedElement.height || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.height, (next) => updateElement(selectedElement.id, { height: next }), 1)
                              }
                            />
                          </Grid>
                        </Grid>
                      </>
                    ) : null}

                    {selectedElement.type === "box" ? (
                      <>
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="Genislik"
                              type="number"
                              value={selectedElement.width}
                              onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { width: Math.max(4, selectedElement.width || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.width, (next) => updateElement(selectedElement.id, { width: next }), 4)
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="Yukseklik"
                              type="number"
                              value={selectedElement.height}
                              onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { height: Math.max(4, selectedElement.height || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.height, (next) => updateElement(selectedElement.id, { height: next }), 4)
                              }
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          label="Cizgi Kalinligi"
                          type="number"
                          value={selectedElement.thickness}
                          onChange={(event) => updateElement(selectedElement.id, { thickness: Number(event.target.value) || 0 })}
                          onBlur={() => updateElement(selectedElement.id, { thickness: Math.max(1, selectedElement.thickness || 0) })}
                          onWheel={handleNumberFieldWheel}
                          onKeyDown={(event) =>
                            handleNumberFieldArrow(event, selectedElement.thickness, (next) => updateElement(selectedElement.id, { thickness: next }), 1)
                          }
                        />
                      </>
                    ) : null}

                    {selectedElement.type === "barcode" ? (
                      <>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Binding secilirse barkod verisi JSON'dan gelir. Veri bossa varsayilan barkod metni kullanilir.
                        </Alert>
                        <TextField
                          select
                          label="Alan Baglantisi"
                          value={selectedElement.binding}
                          onChange={(event) => updateElement(selectedElement.id, { binding: event.target.value })}
                          helperText="Barkod icerigini hangi alandan alacagini sec."
                        >
                          <MenuItem value="">Bos</MenuItem>
                          {Array.from(new Set([...datasetKeys, selectedElement.binding])).filter(Boolean).map((key) => (
                            <MenuItem key={key} value={key}>
                              {fieldLabels[key as keyof typeof fieldLabels] ?? key}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Varsayilan Barkod Metni"
                          value={selectedElement.staticText}
                          helperText={selectedElement.binding ? "Secilen binding bos donerse bu deger kullanilir." : "Binding yoksa dogrudan bu deger kullanilir."}
                          onChange={(event) => updateElement(selectedElement.id, { staticText: event.target.value })}
                        />
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 4 }}>
                            <TextField select label="Tip" value={selectedElement.barcodeType} onChange={(event) => updateElement(selectedElement.id, { barcodeType: event.target.value as BarcodeElement["barcodeType"] })}>
                              <MenuItem value="1">Code128</MenuItem>
                              <MenuItem value="3">Code39</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <TextField
                              label="Narrow"
                              type="number"
                              value={selectedElement.narrow}
                              onChange={(event) => updateElement(selectedElement.id, { narrow: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { narrow: Math.max(1, selectedElement.narrow || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.narrow, (next) => updateElement(selectedElement.id, { narrow: next }), 1)
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <TextField
                              label="Wide"
                              type="number"
                              value={selectedElement.wide}
                              onChange={(event) => updateElement(selectedElement.id, { wide: Number(event.target.value) || 0 })}
                              onBlur={() => updateElement(selectedElement.id, { wide: Math.max(2, selectedElement.wide || 0) })}
                              onWheel={handleNumberFieldWheel}
                              onKeyDown={(event) =>
                                handleNumberFieldArrow(event, selectedElement.wide, (next) => updateElement(selectedElement.id, { wide: next }), 2)
                              }
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          label="Yukseklik"
                          type="number"
                          value={selectedElement.height}
                          onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) || 0 })}
                          onBlur={() => updateElement(selectedElement.id, { height: Math.max(40, selectedElement.height || 0) })}
                          onWheel={handleNumberFieldWheel}
                          onKeyDown={(event) =>
                            handleNumberFieldArrow(event, selectedElement.height, (next) => updateElement(selectedElement.id, { height: next }), 40)
                          }
                        />
                        <FormControlLabel control={<Switch checked={selectedElement.humanReadable} onChange={(event) => updateElement(selectedElement.id, { humanReadable: event.target.checked })} />} label="Alt Metni Goster" />
                      </>
                    ) : null}
                      </>
                    ) : (
                      <Typography color="text.secondary">Listeden bir eleman secin.</Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Canvas uzerinden bir eleman secin.</Typography>
                )}
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={1.5}>Baglanabilir Alanlar</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {datasetKeys.map((key) => (
                    <Chip key={key} label={fieldLabels[key as keyof typeof fieldLabels] ?? key} size="small" />
                  ))}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography color="text.secondary">
                  JSON olarak tek obje ya da obje array yapistirilabilir. Ekran ikisini de okuyup alan listesini binding dropdown'larina yansitir.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
