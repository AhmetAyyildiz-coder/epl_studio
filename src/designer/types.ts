import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export type Primitive = string | number | boolean | null | undefined;
export type DataRecord = Record<string, Primitive>;

// Bitmap fontlar (EPL Font 1-5)
export type TextFont = 1 | 2 | 3 | 4;

export type ElementType = "text" | "blackBox" | "line" | "box" | "barcode";

export type BaseElement = {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
};

export type TextElement = BaseElement & {
  type: "text";
  binding: string;
  staticText: string;
  font: TextFont;
  reverse: boolean;
  bold: boolean;
  align: "left" | "center" | "right";
  wrapWidth: number;
  maxLines: number;
};

export type BlackBoxElement = BaseElement & {
  type: "blackBox";
  binding: string;
  staticText: string;
  font: TextFont;
  width: number;
  height: number;
};

export type LineElement = BaseElement & {
  type: "line";
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
};

export type BoxElement = BaseElement & {
  type: "box";
  width: number;
  height: number;
  thickness: number;
};

export type BarcodeElement = BaseElement & {
  type: "barcode";
  binding: string;
  staticText: string;
  barcodeType: "1" | "3";
  narrow: number;
  wide: number;
  height: number;
  humanReadable: boolean;
};

export type CanvasElement = TextElement | BlackBoxElement | LineElement | BoxElement | BarcodeElement;

export type LayoutDraft = {
  id: string;
  templateId?: number | null;
  shortCode: string;
  name: string;
  elements: CanvasElement[];
};

export type DataSourceConfig = {
  jsonText: string;
};

export type PreviewCommand =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      lines: string[];
      fontSize: number;
      reverse: boolean;
      bold: boolean;
      width: number;
      height: number;
      align: "left" | "center" | "right";
    }
  | {
      id: string;
      type: "blackBox";
      x: number;
      y: number;
      width: number;
      height: number;
      contentOffsetX: number;
      contentOffsetY: number;
      contentWidth: number;
      contentHeight: number;
      text: string;
      fontSize: number;
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
      barcodeType: BarcodeElement["barcodeType"];
      moduleWidth: number;
      humanReadable: boolean;
    };

export type UpdateElementFn = (id: string, patch: Partial<CanvasElement>) => void;

export type NumberFieldArrowHandler = (
  event: ReactKeyboardEvent<HTMLDivElement>,
  value: number,
  onValueChange: (next: number) => void,
  min?: number,
  step?: number,
) => void;