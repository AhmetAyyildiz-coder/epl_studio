import type { CanvasElement, LayoutDraft } from "../designer/types";
import { buildReactTemplate } from "../designer/utils";

const ETIKET_SABLONU_API_BASE_URL = "http://localhost:5105/api/common/etiket-sablonu";

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

type CreateEtiketSablonuRequest = {
  logId?: string | null;
  kisaKod: string;
  sablonAdi: string;
  sablonIcerik: string;
  sablonReactIcerik: string;
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

type StoredSablonIcerik = {
  version: 1;
  elements: CanvasElement[];
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
  const payload: StoredSablonIcerik = {
    version: 1,
    elements: layout.elements,
  };

  return JSON.stringify(payload);
}

function deserializeLayoutElements(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredSablonIcerik | CanvasElement[];
    if (Array.isArray(parsed)) {
      return parsed;
    }

    return parsed.elements ?? [];
  } catch {
    return [];
  }
}

export function toLayoutDraft(dto: EtiketSablonuDTO): LayoutDraft {
  return {
    id: `remote-${dto.id}`,
    templateId: dto.id,
    shortCode: dto.kisaKod ?? "",
    name: dto.sablonAdi ?? "Adsiz Taslak",
    reactContent: dto.sablonReactIcerik ?? null,
    elements: deserializeLayoutElements(dto.sablonIcerik),
  };
}

export function buildCreateEtiketSablonuRequest(layout: LayoutDraft): CreateEtiketSablonuRequest {
  return {
    kisaKod: layout.shortCode.trim(),
    sablonAdi: layout.name.trim(),
    sablonIcerik: serializeLayout(layout),
    sablonReactIcerik: buildReactTemplate(layout),
  };
}

export function buildUpdateEtiketSablonuRequest(layout: LayoutDraft): UpdateEtiketSablonuRequest {
  if (!layout.templateId) {
    throw new Error("Guncelleme icin templateId gerekli.");
  }

  return {
    id: layout.templateId,
    kisaKod: layout.shortCode.trim(),
    sablonAdi: layout.name.trim(),
    sablonIcerik: serializeLayout(layout),
    sablonReactIcerik: buildReactTemplate(layout),
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

export async function createEtiketSablonu(layout: LayoutDraft) {
  const response = await request<GeneralResponseDTO<CreateEtiketSablonuResponse>>(
    buildUrl("/ekle"),
    {
      method: "POST",
      body: JSON.stringify(buildCreateEtiketSablonuRequest(layout)),
    },
  );

  return response;
}

export async function updateEtiketSablonu(layout: LayoutDraft) {
  const response = await request<GeneralResponseDTO<UpdateEtiketSablonuResponse>>(
    buildUrl("/guncelle"),
    {
      method: "PUT",
      body: JSON.stringify(buildUpdateEtiketSablonuRequest(layout)),
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
