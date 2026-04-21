import {
  FONT_HEIGHT_MAP,
  BLACK_BOX_FONT_WIDTH_MAP,
  BLACK_BOX_AUTO_HORIZONTAL_PADDING,
  DEFAULT_PRINT_OFFSET_X,
  DEFAULT_PRINT_OFFSET_Y,
} from "./constants";
import type {
  BarcodeElement,
  CanvasElement,
  DataRecord,
  LayoutDraft,
  PreviewCommand,
  TextFont,
} from "./types";
import { uid, toNonNegativeInt, toInt } from "./geometry";
import { toAscii, wrapText, measureTextWidth, clampTextFont } from "./text";
import { resolveBinding, getBlackBoxMetrics } from "./layout";

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

function getTextContainerWidth(wrapWidth: number) {
  return Math.max(56, wrapWidth);
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
  const { dpi, labelWidthMm, labelHeightMm } = layout.metadata;
  const dotsPerMm = dpi / 25.4;
  const widthDots = Math.round(labelWidthMm * dotsPerMm);
  const heightDots = Math.round(labelHeightMm * dotsPerMm);
  const lines = ["ZT", `q${widthDots}`, `Q${heightDots},24`, "R0,0", "N"];
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

        const boldCount = element.bold ? 3 : 1;
        for (let b = 0; b < boldCount; b++) {
          const boldOffsetX = element.bold ? b : 0;
          if (isScalableFont) {
            lines.push(
              `A${commandX + boldOffsetX},${adjustedY + index * lineHeight},${fontSize},${element.font},1,1,${element.reverse ? "R" : "N"},"${lineText}"`,
            );
          } else {
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

export function submitEpl(epl: string) {
  const popup = window.open("", "view", "width=420,height=520");
  if (!popup) {
    window.alert("Popup engellendi. Yazdirma icin popup izni verin.");
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = import.meta.env.VITE_PRINT_SUBMIT_URL;
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

  const BLACK_BOX_FONT_HEIGHT_MAP: Record<TextFont, number> = { 1: 20, 2: 28, 3: 36, 4: 44 };

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
        wrapWidth: Math.max(56, Math.round(parsedText.text.length * fontSize * 0.58)),
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
