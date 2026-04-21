import type { TextFont, LabelMetadata } from "./types";

export const LABEL_WIDTH_MM = 60;
export const LABEL_HEIGHT_MM = 35;
export const DEFAULT_DPI = 300;
export const PREVIEW_DPI = 96;
export const PREVIEW_SCALE = PREVIEW_DPI / DEFAULT_DPI;
export const DEFAULT_PREVIEW_ZOOM = 1.75;
export const DOTS_PER_MM = DEFAULT_DPI / 25.4;
export const LABEL_WIDTH_DOTS = Math.round(LABEL_WIDTH_MM * DOTS_PER_MM);
export const LABEL_HEIGHT_DOTS = Math.round(LABEL_HEIGHT_MM * DOTS_PER_MM);
export const DEFAULT_PRINT_OFFSET_X = 260;
export const DEFAULT_PRINT_OFFSET_Y = 8;

export const DEFAULT_METADATA: LabelMetadata = {
  dpi: DEFAULT_DPI,
  labelWidthMm: LABEL_WIDTH_MM,
  labelHeightMm: LABEL_HEIGHT_MM,
  offsetXDot: DEFAULT_PRINT_OFFSET_X,
  offsetYDot: DEFAULT_PRINT_OFFSET_Y,
};

export const LABEL_PRESETS = [
  { label: "60 x 35 mm (Standart Fis)", widthMm: 60, heightMm: 35 },
  { label: "40 x 25 mm", widthMm: 40, heightMm: 25 },
  { label: "100 x 60 mm", widthMm: 100, heightMm: 60 },
  { label: "Ozel Boyut", widthMm: 0, heightMm: 0 },
];

// Bitmap fontlar için sabit boyutlar
export const FONT_HEIGHT_MAP: Record<TextFont, number> = { 1: 20, 2: 28, 3: 36, 4: 44 };

// Black box font constants
export const BLACK_BOX_FONT_HEIGHT_MAP: Record<TextFont, number> = {
  1: 20,
  2: 28,
  3: 36,
  4: 44,
};

export const BLACK_BOX_FONT_WIDTH_MAP: Record<TextFont, number> = {
  1: 12,
  2: 16,
  3: 20,
  4: 24,
};

export const BLACK_BOX_AUTO_HORIZONTAL_PADDING = 10;
export const BLACK_BOX_AUTO_VERTICAL_PADDING = 4;

export const SAMPLE_DATA_JSON = JSON.stringify(
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

export const FIELD_LABELS = {
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