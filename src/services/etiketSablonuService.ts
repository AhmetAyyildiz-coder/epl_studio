import type { CanvasElement, DataRecord, LabelMetadata, LayoutDraft } from "../designer/types";
import { DEFAULT_METADATA } from "../designer/constants";
import { buildReactTemplate } from "../designer/utils";

const ETIKET_SABLONU_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type GeneralResponseDTO<T> = {
  resultCode: number;
  done: boolean;
  message: string | null;
  jobId: string;
  result: T;
};

type EtiketSablonuDTO = {
  id: number;
  kisaKod: string | null;
  sablonAdi: string | null;
  sablonIcerik: string | null;
  sablonReactIcerik?: string | null;
  kayitTarihi: string;
  kaydedenKullaniciId: number;
  guncellemeTarihi: string | null;
  guncelleyenKullaniciId: number | null;
};

type GetEtiketSablonuResponse = {
  data: EtiketSablonuDTO[] | null;
  count: number;
};

export type EtiketSablonuMetadata = LabelMetadata;

type CreateEtiketSablonuRequest = {
  logId?: string | null;
  kisaKod: string;
  sablonAdi: string;
  sablonIcerik: string;
  sablonReactIcerik: string;
  dpi: number;
  labelWidthMm: number;
  labelHeightMm: number;
  offsetXDot: number;
  offsetYDot: number;
};

type CreateEtiketSablonuResponse = {
  id: number;
  kisaKod: string | null;
  sablonAdi: string | null;
};

type UpdateEtiketSablonuRequest = {
  logId?: string | null;
  id: number;
  kisaKod: string;
  sablonAdi: string;
  sablonIcerik: string;
  sablonReactIcerik: string;
  dpi: number;
  labelWidthMm: number;
  labelHeightMm: number;
  offsetXDot: number;
  offsetYDot: number;
};

type UpdateEtiketSablonuResponse = {
  id: number;
  kisaKod: string | null;
  sablonAdi: string | null;
};

type DeleteEtiketSablonuRequest = {
  logId?: string | null;
  id: number;
};

type DeleteEtiketSablonuResponse = {
  basarili: boolean;
};

type ProblemDetails = {
  title?: string | null;
  detail?: string | null;
  status?: number | null;
};

type StoredSablonIcerikV1 = {
  version: 1;
  elements: CanvasElement[];
};

type StoredSablonIcerikV2 = {
  version: 2;
  elements: CanvasElement[];
  metadata: LabelMetadata;
};

type StoredSablonIcerik = StoredSablonIcerikV1 | StoredSablonIcerikV2;

type ParsedSablonIcerik = {
  elements: CanvasElement[];
  metadata: LabelMetadata | null;
};

export type EtiketSablonuListQuery = {
  id?: number;
  kisaKod?: string;
  sablonAdi?: string;
  logId?: string;
};

function buildUrl(path: string, query?: Record<string, string>) {
  const url = new URL(`${ETIKET_SABLONU_API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return {} as T;
  }
  return JSON.parse(rawText) as T;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `API istegi basarisiz oldu (${response.status})`;
    try {
      const problem = await parseResponse<ProblemDetails>(response);
      errorMessage = problem.detail || problem.title || errorMessage;
    } catch {
      // response JSON degilse varsayilan mesajla devam et
    }
    throw new Error(errorMessage);
  }

  return parseResponse<T>(response);
}

function serializeLayout(layout: LayoutDraft) {
  const payload: StoredSablonIcerikV2 = {
    version: 2,
    elements: layout.elements,
    metadata: layout.metadata,
  };

  return JSON.stringify(payload);
}

function deserializeSablonIcerik(rawValue: string | null): ParsedSablonIcerik {
  if (!rawValue) {
    return { elements: [], metadata: null };
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredSablonIcerik | CanvasElement[];
    if (Array.isArray(parsed)) {
      return { elements: parsed, metadata: null };
    }

    if (parsed.version === 2) {
      return { elements: parsed.elements ?? [], metadata: parsed.metadata };
    }

    // version 1: metadata was not stored, fall back to DEFAULT_METADATA at call site
    return { elements: parsed.elements ?? [], metadata: null };
  } catch {
    return { elements: [], metadata: null };
  }
}

export function toLayoutDraft(dto: EtiketSablonuDTO): LayoutDraft {
  const { elements, metadata } = deserializeSablonIcerik(dto.sablonIcerik);
  return {
    id: `remote-${dto.id}`,
    templateId: dto.id,
    shortCode: dto.kisaKod ?? "",
    name: dto.sablonAdi ?? "Adsiz Taslak",
    reactContent: dto.sablonReactIcerik ?? null,
    elements,
    metadata: metadata ?? { ...DEFAULT_METADATA },
  };
}

export function buildCreateEtiketSablonuRequest(layout: LayoutDraft, metadata: EtiketSablonuMetadata, previewRecord?: DataRecord): CreateEtiketSablonuRequest {
  return {
    kisaKod: layout.shortCode.trim(),
    sablonAdi: layout.name.trim(),
    sablonIcerik: serializeLayout(layout),
    sablonReactIcerik: buildReactTemplate(layout, previewRecord),
    dpi: metadata.dpi,
    labelWidthMm: metadata.labelWidthMm,
    labelHeightMm: metadata.labelHeightMm,
    offsetXDot: metadata.offsetXDot,
    offsetYDot: metadata.offsetYDot,
  };
}

export function buildUpdateEtiketSablonuRequest(layout: LayoutDraft, metadata: EtiketSablonuMetadata, previewRecord?: DataRecord): UpdateEtiketSablonuRequest {
  if (!layout.templateId) {
    throw new Error("Guncelleme icin templateId gerekli.");
  }

  return {
    id: layout.templateId,
    kisaKod: layout.shortCode.trim(),
    sablonAdi: layout.name.trim(),
    sablonIcerik: serializeLayout(layout),
    sablonReactIcerik: buildReactTemplate(layout, previewRecord),
    dpi: metadata.dpi,
    labelWidthMm: metadata.labelWidthMm,
    labelHeightMm: metadata.labelHeightMm,
    offsetXDot: metadata.offsetXDot,
    offsetYDot: metadata.offsetYDot,
  };
}

export async function listEtiketSablonlari(query?: EtiketSablonuListQuery) {
  const response = await request<GeneralResponseDTO<GetEtiketSablonuResponse>>(
    buildUrl("/list", {
      Id: query?.id ? String(query.id) : "",
      KisaKod: query?.kisaKod ?? "",
      SablonAdi: query?.sablonAdi ?? "",
      LogId: query?.logId ?? "",
    }),
    { method: "GET" },
  );

  return {
    ...response,
    result: {
      ...response.result,
      data: (response.result.data ?? []).map(toLayoutDraft),
    },
  };
}

export async function createEtiketSablonu(layout: LayoutDraft, metadata: EtiketSablonuMetadata, previewRecord?: DataRecord) {
  const response = await request<GeneralResponseDTO<CreateEtiketSablonuResponse>>(
    buildUrl("/ekle"),
    {
      method: "POST",
      body: JSON.stringify(buildCreateEtiketSablonuRequest(layout, metadata, previewRecord)),
    },
  );

  return response;
}

export async function updateEtiketSablonu(layout: LayoutDraft, metadata: EtiketSablonuMetadata, previewRecord?: DataRecord) {
  const response = await request<GeneralResponseDTO<UpdateEtiketSablonuResponse>>(
    buildUrl("/guncelle"),
    {
      method: "PUT",
      body: JSON.stringify(buildUpdateEtiketSablonuRequest(layout, metadata, previewRecord)),
    },
  );

  return response;
}

export async function deleteEtiketSablonu(requestBody: DeleteEtiketSablonuRequest) {
  const response = await request<GeneralResponseDTO<DeleteEtiketSablonuResponse>>(
    buildUrl("/sil"),
    {
      method: "DELETE",
      body: JSON.stringify(requestBody),
    },
  );

  return response;
}
