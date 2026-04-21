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

export function toAscii(value: string) {
  return value.replace(trRegex, (char) => trMap[char] ?? char);
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

export function measureTextWidth(text: string, fontSize: number, bold = false) {
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

export function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(56, Math.round(text.length * fontSize * 0.58));
}

export function estimateWrappedTextWidth(lines: string[], fontSize: number, wrapWidth: number, bold: boolean = false) {
  const widestLine = Math.max(...lines.map((line) => estimateTextWidth(line, fontSize)), 0);
  const baseWidth = Math.max(56, Math.min(wrapWidth, widestLine));
  return bold ? Math.round(baseWidth * 1.6) : baseWidth;
}

export function clampTextFont(value: number) {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value as 1 | 2 | 3 | 4;
  }
  return 2 as const;
}
