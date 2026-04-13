import type { TextFont } from "./types";

export const STORAGE_KEY = "epl-studio-layouts-v3";
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
export const FONT_HEIGHT_MAP: Record<TextFont, number> = { 1: 20, 2: 28, 3: 36, 4: 44 };

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