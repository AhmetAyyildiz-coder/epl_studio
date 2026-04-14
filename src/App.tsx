import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_DPI,
  DEFAULT_PREVIEW_ZOOM,
  DEFAULT_PRINT_OFFSET_X,
  DEFAULT_PRINT_OFFSET_Y,
  FIELD_LABELS,
  LABEL_HEIGHT_DOTS,
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_DOTS,
  LABEL_WIDTH_MM,
  SAMPLE_DATA_JSON,
  STORAGE_KEY,
} from "./designer/constants";
import { ElementPreview } from "./designer/components/ElementPreview";
import { ElementPropertiesPanel } from "./designer/components/ElementPropertiesPanel";
import { ToolboxPanel } from "./designer/components/ToolboxPanel";
import { useDebounce } from "./designer/useDebounce";
import {
  applyEplOffset,
  buildEpl,
  buildPreviewCommands,
  createElementByType,
  emptyLayout,
  normalizeRecords,
  parseEplToElements,
  readLayouts,
  submitEpl,
  uid,
} from "./designer/utils";
import { createEtiketSablonu, listEtiketSablonlari, updateEtiketSablonu } from "./services/etiketSablonuService";
import type { CanvasElement, DataRecord, DataSourceConfig, ElementType, LayoutDraft, NumberFieldArrowHandler } from "./designer/types";

type RemoteLayoutFilters = {
  shortCode: string;
  name: string;
};

function cloneLayout(layout: LayoutDraft): LayoutDraft {
  return {
    ...layout,
    elements: layout.elements.map((element) => ({ ...element })),
  };
}

function getInitialDesignerState() {
  const layouts = readLayouts();
  const firstLayout = layouts[0] ?? emptyLayout();

  return {
    layouts,
    selectedLayoutId: firstLayout.id,
    draft: cloneLayout(firstLayout),
  };
}

export default function App() {
  const [initialDesignerState] = useState(getInitialDesignerState);
  const [layouts, setLayouts] = useState<LayoutDraft[]>(initialDesignerState.layouts);
  const [selectedLayoutId, setSelectedLayoutId] = useState(initialDesignerState.selectedLayoutId);
  const [draft, setDraft] = useState<LayoutDraft>(initialDesignerState.draft);
  const [dataSource, setDataSource] = useState<DataSourceConfig>({ jsonText: SAMPLE_DATA_JSON });
  const [records, setRecords] = useState<DataRecord[]>(() => normalizeRecords(JSON.parse(SAMPLE_DATA_JSON)));
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [selectedRecordIndexes, setSelectedRecordIndexes] = useState<number[]>([0]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(() => initialDesignerState.draft.elements[0]?.id ?? null);
  const [printOffsetX, setPrintOffsetX] = useState(DEFAULT_PRINT_OFFSET_X);
  const [printOffsetY, setPrintOffsetY] = useState(DEFAULT_PRINT_OFFSET_Y);
  const [previewZoom, setPreviewZoom] = useState(DEFAULT_PREVIEW_ZOOM);
  const [message, setMessage] = useState("Veri kaynagi yukleyin, canvas ustunde elemanlari tasiyin ve secili kayitlari yazdirin.");
  const [isLoadingRemoteLayouts, setIsLoadingRemoteLayouts] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [remoteLayoutFilters, setRemoteLayoutFilters] = useState<RemoteLayoutFilters>({ shortCode: "", name: "" });
  const debouncedJsonText = useDebounce(dataSource.jsonText, 500);
  const renderDraft = useMemo(() => ({ ...draft, elements: draft.elements }), [draft.elements]);
  const deferredEplDraft = useDeferredValue(renderDraft);
  const deferredSelectedRecordIndexes = useDeferredValue(selectedRecordIndexes);

  const setMessageOptimized = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  const applyLayoutCollection = useCallback((nextLayouts: LayoutDraft[], preferredLayoutId?: string) => {
    if (!nextLayouts.length) {
      return;
    }

    const nextActiveLayout = nextLayouts.find((layout) => layout.id === preferredLayoutId) ?? nextLayouts[0];
    const nextDraft = cloneLayout(nextActiveLayout);

    setLayouts(nextLayouts);
    setSelectedLayoutId(nextActiveLayout.id);
    setDraft(nextDraft);
    setSelectedElementId(nextDraft.elements[0]?.id ?? null);
  }, []);

  const loadRemoteLayouts = useCallback(
    async (
      filters?: Partial<RemoteLayoutFilters>,
      options?: { preferredLayoutId?: string; emptyMessage?: string; successMessage?: (count: number) => string },
    ) => {
      setIsLoadingRemoteLayouts(true);
      try {
        const response = await listEtiketSablonlari({
          kisaKod: filters?.shortCode?.trim() || undefined,
          sablonAdi: filters?.name?.trim() || undefined,
        });

        const remoteLayouts = response.result.data ?? [];
        if (!remoteLayouts.length) {
          setMessageOptimized(options?.emptyMessage ?? "API'de kayitli sablon bulunamadi.");
          return;
        }

        applyLayoutCollection(remoteLayouts, options?.preferredLayoutId);
        setMessageOptimized(options?.successMessage?.(remoteLayouts.length) ?? `${remoteLayouts.length} sablon API'den yuklendi.`);
      } catch (error) {
        setMessageOptimized(`Sablonlar API'den yuklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      } finally {
        setIsLoadingRemoteLayouts(false);
      }
    },
    [applyLayoutCollection, setMessageOptimized],
  );

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.map((element) => (element.id === id ? ({ ...element, ...patch } as CanvasElement) : element)),
    }));
  }, []);

  const activeRecord = records[selectedRecordIndex];
  const deferredActiveRecord = useDeferredValue(activeRecord);
  const previewCommands = useMemo(() => buildPreviewCommands(renderDraft, deferredActiveRecord), [renderDraft, deferredActiveRecord]);
  const selectedElement = useMemo(
    () => draft.elements.find((element) => element.id === selectedElementId) ?? null,
    [draft.elements, selectedElementId],
  );
  const datasetKeys = useMemo(() => Array.from(new Set(records.flatMap((record) => Object.keys(record)))), [records]);
  const selectedEpl = useMemo(() => {
    if (!deferredSelectedRecordIndexes.length) {
      return "";
    }

    return deferredSelectedRecordIndexes.map((index) => buildEpl(deferredEplDraft, records[index], 0, 0)).join("");
  }, [deferredEplDraft, records, deferredSelectedRecordIndexes]);
  const [editedEpl, setEditedEpl] = useState(selectedEpl);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  }, [layouts]);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteLayouts() {
      try {
        const response = await listEtiketSablonlari();
        if (cancelled) {
          return;
        }

        const remoteLayouts = response.result.data ?? [];
        if (!remoteLayouts.length) {
          setMessageOptimized("API'de kayitli sablon bulunamadi. Yerel taslaklar kullaniliyor.");
          return;
        }

        applyLayoutCollection(remoteLayouts, selectedLayoutId);
        setMessageOptimized(`${remoteLayouts.length} sablon API'den yuklendi.`);
      } catch (error) {
        if (!cancelled) {
          setMessageOptimized(`Sablonlar API'den yuklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRemoteLayouts(false);
        }
      }
    }

    setIsLoadingRemoteLayouts(true);
    void loadRemoteLayouts();

    return () => {
      cancelled = true;
    };
  }, [applyLayoutCollection, setMessageOptimized]);

  useEffect(() => {
    setEditedEpl(selectedEpl);
  }, [selectedEpl]);

  useEffect(() => {
    if (selectedElementId && !draft.elements.find((element) => element.id === selectedElementId)) {
      setSelectedElementId(draft.elements[0]?.id ?? null);
    }
  }, [selectedElementId, draft.elements]);

  useEffect(() => {
    if (debouncedJsonText === dataSource.jsonText) {
      return;
    }

    try {
      const payload = JSON.parse(debouncedJsonText) as unknown;
      const nextRecords = normalizeRecords(payload);
      if (nextRecords.length) {
        setRecords(nextRecords);
        setSelectedRecordIndex(0);
        setSelectedRecordIndexes([0]);
      }
    } catch {
      // typing sirasinda sessiz kal
    }
  }, [debouncedJsonText, dataSource.jsonText]);

  const selectLayout = useCallback((layoutId: string) => {
    const layout = layouts.find((item) => item.id === layoutId);
    if (!layout) {
      return;
    }

    const nextDraft = cloneLayout(layout);
    setSelectedLayoutId(layout.id);
    setDraft(nextDraft);
    setSelectedElementId(nextDraft.elements[0]?.id ?? null);
    setMessageOptimized(`"${layout.name}" acildi.`);
  }, [layouts, setMessageOptimized]);

  const saveLayout = useCallback(() => {
    if (!draft.name.trim()) {
      setMessageOptimized("Taslak adi zorunlu.");
      return;
    }

    if (!draft.shortCode.trim()) {
      setMessageOptimized("Kisa kod zorunlu.");
      return;
    }

    void (async () => {
      setIsSavingLayout(true);
      try {
        const response = draft.templateId
          ? await updateEtiketSablonu(draft)
          : await createEtiketSablonu(draft);

        const persistedLayout: LayoutDraft = {
          ...draft,
          id: `remote-${response.result.id}`,
          templateId: response.result.id,
          shortCode: response.result.kisaKod ?? draft.shortCode.trim(),
          name: response.result.sablonAdi ?? draft.name.trim(),
        };

        setDraft(persistedLayout);
        setSelectedLayoutId(persistedLayout.id);
        setLayouts((prev) => {
          const exists = prev.some((layout) => layout.id === draft.id || (layout.templateId !== null && layout.templateId === persistedLayout.templateId));
          if (exists) {
            return prev.map((layout) =>
              layout.id === draft.id || (layout.templateId !== null && layout.templateId === persistedLayout.templateId)
                ? persistedLayout
                : layout,
            );
          }
          return [persistedLayout, ...prev];
        });
        setMessageOptimized(`"${persistedLayout.name}" database'e kaydedildi.`);
      } catch (error) {
        setMessageOptimized(`Taslak kaydedilemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      } finally {
        setIsSavingLayout(false);
      }
    })();
  }, [draft, setMessageOptimized]);

  const duplicateLayout = useCallback(() => {
    setDraft((prev) => {
      const nextDraft = {
        ...cloneLayout(prev),
        id: uid(),
        templateId: null,
        shortCode: prev.shortCode ? `${prev.shortCode}_KOPYA` : "",
        name: `${prev.name} Kopya`,
      };
      setSelectedLayoutId(nextDraft.id);
      setSelectedElementId(nextDraft.elements[0]?.id ?? null);
      setMessageOptimized("Taslak kopyalandi.");
      return nextDraft;
    });
  }, [setMessageOptimized]);

  const resetLayout = useCallback(() => {
    setDraft(() => {
      const nextDraft = emptyLayout(draft.name);
      setSelectedElementId(nextDraft.elements[0]?.id ?? null);
      setMessageOptimized("Canvas sifirlandi.");
      return nextDraft;
    });
  }, [draft.name, setMessageOptimized]);

  const updateDraftName = useCallback((name: string) => {
    setDraft((prev) => ({ ...prev, name }));
  }, []);

  const updateDraftShortCode = useCallback((shortCode: string) => {
    setDraft((prev) => ({ ...prev, shortCode }));
  }, []);

  const updateRemoteFilter = useCallback((field: keyof RemoteLayoutFilters, value: string) => {
    setRemoteLayoutFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const searchRemoteLayouts = useCallback(() => {
    void loadRemoteLayouts(remoteLayoutFilters, {
      preferredLayoutId: selectedLayoutId,
      emptyMessage: "Veritabaninda filtreye uygun taslak bulunamadi.",
      successMessage: (count) => `${count} taslak veritabanindan getirildi.`,
    });
  }, [loadRemoteLayouts, remoteLayoutFilters, selectedLayoutId]);

  const resetRemoteLayoutSearch = useCallback(() => {
    setRemoteLayoutFilters({ shortCode: "", name: "" });
    void loadRemoteLayouts(undefined, {
      preferredLayoutId: selectedLayoutId,
      emptyMessage: "API'de kayitli sablon bulunamadi.",
      successMessage: (count) => `${count} taslak veritabanindan yenilendi.`,
    });
  }, [loadRemoteLayouts, selectedLayoutId]);

  const addElement = useCallback((type: ElementType) => {
    startTransition(() => {
      setDraft((prev) => {
        const element = createElementByType(type, prev.elements);
        setSelectedElementId(element.id);
        setMessageOptimized(`${type} elemani eklendi.`);
        return { ...prev, elements: [...prev.elements, element] };
      });
    });
  }, [setMessageOptimized]);

  const removeSelectedElement = useCallback(() => {
    if (!selectedElementId) {
      return;
    }

    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.filter((element) => element.id !== selectedElementId),
    }));
    setSelectedElementId(null);
    setMessageOptimized("Eleman silindi.");
  }, [selectedElementId, setMessageOptimized]);

  const duplicateSelectedElement = useCallback(() => {
    if (!selectedElementId) {
      setMessageOptimized("Kopyalamak icin bir eleman secin.");
      return;
    }

    const elementToClone = draft.elements.find((element) => element.id === selectedElementId);
    if (!elementToClone) {
      return;
    }

    setDraft((prev) => {
      const clonedElement: CanvasElement = {
        ...elementToClone,
        id: uid(),
        label: `${elementToClone.label} Kopya`,
        x: elementToClone.x + 10,
        y: elementToClone.y + 10,
      };
      const insertIndex = prev.elements.findIndex((element) => element.id === selectedElementId) + 1;
      const newElements = [...prev.elements];
      newElements.splice(insertIndex, 0, clonedElement);
      setSelectedElementId(clonedElement.id);
      setMessageOptimized(`"${clonedElement.label}" olusturuldu.`);
      return { ...prev, elements: newElements };
    });
  }, [selectedElementId, draft.elements, setMessageOptimized]);

  const clearAllElements = useCallback(() => {
    setDraft((prev) => ({ ...prev, elements: [] }));
    setSelectedElementId(null);
    setMessageOptimized("Tum elemanlar temizlendi.");
  }, [setMessageOptimized]);

  // Keyboard shortcuts - Delete ve Ctrl+D
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isInputFocused =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest('[role="textbox"]') ||
          target.closest('[role="combobox"]'));

      if (isInputFocused) {
        return;
      }

      // Delete - Eleman sil
      if (event.key === "Delete" && selectedElementId) {
        event.preventDefault();
        setDraft((prev) => ({
          ...prev,
          elements: prev.elements.filter((element) => element.id !== selectedElementId),
        }));
        setSelectedElementId(null);
        setMessageOptimized("Eleman silindi.");
        return;
      }

      // Ctrl+D - Eleman kopyala
      if (event.key === "d" && (event.ctrlKey || event.metaKey) && selectedElementId) {
        event.preventDefault();
        duplicateSelectedElement();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, setMessageOptimized, duplicateSelectedElement]);

  const applyJsonData = useCallback(() => {
    try {
      const payload = JSON.parse(dataSource.jsonText) as unknown;
      const nextRecords = normalizeRecords(payload);
      if (!nextRecords.length) {
        throw new Error("Kayit bulunamadi");
      }

      setRecords(nextRecords);
      setSelectedRecordIndex(0);
      setSelectedRecordIndexes([0]);
      setMessageOptimized(`${nextRecords.length} kayit JSON'dan yuklendi.`);
    } catch (error) {
      setMessageOptimized(`JSON gecersiz: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }, [dataSource.jsonText, setMessageOptimized]);

  const printSelectedRecords = useCallback(() => {
    if (!selectedRecordIndexes.length) {
      setMessageOptimized("Yazdirma icin secili kayit yok.");
      return;
    }

    const shiftedEpl = applyEplOffset(editedEpl || selectedEpl, printOffsetX, printOffsetY);
    submitEpl(shiftedEpl);
    setMessageOptimized(`${selectedRecordIndexes.length} kayit yazdirma servisine gonderildi.`);
  }, [editedEpl, printOffsetX, printOffsetY, selectedEpl, selectedRecordIndexes, setMessageOptimized]);

  const copyEplToClipboard = useCallback(async () => {
    if (!editedEpl) {
      setMessageOptimized("Kopyalanacak EPL cikti yok.");
      return;
    }

    try {
      await navigator.clipboard.writeText(editedEpl);
      setMessageOptimized("EPL cikti panoya kopyalandi.");
    } catch (error) {
      setMessageOptimized(`EPL kopyalanamadi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }, [editedEpl, setMessageOptimized]);

  const applyEditedEplToPreview = useCallback(() => {
    const parsed = parseEplToElements(editedEpl, printOffsetX, printOffsetY);
    if (!parsed.length) {
      setMessageOptimized("EPL parse edilemedi. A/LE/LO/X/B komutlarini kontrol edin.");
      return;
    }

    setDraft((prev) => ({ ...prev, elements: parsed }));
    setSelectedElementId(parsed[0]?.id ?? null);
    setMessageOptimized(`${parsed.length} eleman EPL'den parse edilip preview'e uygulandi.`);
  }, [editedEpl, printOffsetX, printOffsetY, setMessageOptimized]);

  const handleNumberFieldArrow = useCallback<NumberFieldArrowHandler>((event, value, onValueChange, min = 0, step = 1) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const direction = event.key === "ArrowUp" ? 1 : -1;
    onValueChange(Math.max(min, (Number(value) || 0) + direction * step));
  }, []);

  const moveElement = useCallback((id: string, x: number, y: number) => {
    updateElement(id, { x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)) });
  }, [updateElement]);

  return (
    <Box sx={{
      px: { xs: 2, md: 3 },
      py: { xs: 2, md: 3 },
      "& .MuiOutlinedInput-root": { borderRadius: 0 },
      "& .MuiFormControl-root .MuiOutlinedInput-root": { borderRadius: 0 },
      "& .MuiSelect-root": { borderRadius: 0 },
      "& .MuiButtonBase-root": { borderRadius: 0 },
      "& .MuiPaper-root": { borderRadius: 0 },
      "& .MuiChip-root": { borderRadius: 0 },
    }}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="overline">Durum</Typography>
            <Typography variant="body1">{layouts.length} taslak, {records.length} veri kaydi</Typography>
            <Alert severity="info" sx={{ borderRadius: 0 }}>{message}</Alert>
            {isLoadingRemoteLayouts ? <Typography variant="caption">API sablonlari yukleniyor...</Typography> : null}
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
                      const nextDraft = emptyLayout();
                      setDraft(nextDraft);
                      setSelectedLayoutId(nextDraft.id);
                      setSelectedElementId(nextDraft.elements[0]?.id ?? null);
                    }}
                  >
                    +
                  </IconButton>
                </Stack>
                <Stack spacing={1.25} mb={1.5}>
                  <TextField
                    size="small"
                    label="DB Kisa Kod"
                    value={remoteLayoutFilters.shortCode}
                    onChange={(event) => updateRemoteFilter("shortCode", event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        searchRemoteLayouts();
                      }
                    }}
                  />
                  <TextField
                    size="small"
                    label="DB Taslak Adi"
                    value={remoteLayoutFilters.name}
                    onChange={(event) => updateRemoteFilter("name", event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        searchRemoteLayouts();
                      }
                    }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={searchRemoteLayouts} disabled={isLoadingRemoteLayouts} sx={{ flex: 1 }}>
                      {isLoadingRemoteLayouts ? "Araniyor..." : "DB'de Ara"}
                    </Button>
                    <Button variant="outlined" onClick={resetRemoteLayoutSearch} disabled={isLoadingRemoteLayouts}>
                      Tumunu Getir
                    </Button>
                  </Stack>
                </Stack>
                <List sx={{ p: 0 }}>
                  {layouts.map((layout) => (
                    <ListItemButton
                      key={layout.id}
                      selected={layout.id === selectedLayoutId}
                      onClick={() => selectLayout(layout.id)}
                      sx={{ mb: 1, borderRadius: 0 }}
                    >
                      <ListItemText primary={layout.name} secondary={`${layout.shortCode || "KOD-YOK"} • ${layout.elements.length} eleman`} />
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
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDataSource((prev) => ({ ...prev, jsonText: nextValue }));
                    }}
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
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ minWidth: 360, flex: 1 }}>
                    <TextField
                      label="Taslak Adi"
                      value={draft.name}
                      onChange={(event) => {
                        const nextName = event.target.value;
                        updateDraftName(nextName);
                      }}
                      sx={{ minWidth: 240, flex: 1 }}
                    />
                    <TextField
                      label="Kisa Kod"
                      value={draft.shortCode}
                      onChange={(event) => {
                        const nextShortCode = event.target.value.toUpperCase();
                        updateDraftShortCode(nextShortCode);
                      }}
                      sx={{ minWidth: 180 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button variant="outlined" onClick={duplicateLayout}>Kopyala</Button>
                    <Button variant="outlined" color="warning" onClick={resetLayout}>Sifirla</Button>
                    <Button variant="contained" onClick={saveLayout} disabled={isSavingLayout}>{isSavingLayout ? "Kaydediliyor..." : "Kaydet"}</Button>
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
                      select
                      size="small"
                      label="Onizleme Zoom"
                      value={String(previewZoom)}
                      onChange={(event) => setPreviewZoom(Number(event.target.value) || DEFAULT_PREVIEW_ZOOM)}
                      sx={{ minWidth: 140 }}
                    >
                      <MenuItem value="1">100%</MenuItem>
                      <MenuItem value="1.25">125%</MenuItem>
                      <MenuItem value="1.5">150%</MenuItem>
                      <MenuItem value="1.75">175%</MenuItem>
                      <MenuItem value="2">200%</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      label="X Ofset"
                      type="number"
                      value={printOffsetX}
                      onChange={(event) => {
                        const nextValue = Math.max(0, Math.round(Number((event.target as HTMLInputElement).value) || 0));
                        setPrintOffsetX(nextValue);
                      }}
                      onBlur={() => setPrintOffsetX((prev) => Math.max(0, Math.round(prev || 0)))}
                      onKeyDown={(event) => handleNumberFieldArrow(event as ReactKeyboardEvent<HTMLDivElement>, printOffsetX, setPrintOffsetX, 0)}
                    />
                    <TextField
                      size="small"
                      label="Y Ofset"
                      type="number"
                      value={printOffsetY}
                      onChange={(event) => {
                        const nextValue = Math.max(0, Math.round(Number((event.target as HTMLInputElement).value) || 0));
                        setPrintOffsetY(nextValue);
                      }}
                      onBlur={() => setPrintOffsetY((prev) => Math.max(0, Math.round(prev || 0)))}
                      onKeyDown={(event) => handleNumberFieldArrow(event as ReactKeyboardEvent<HTMLDivElement>, printOffsetY, setPrintOffsetY, 0)}
                    />
                  </Stack>
                </Stack>

                <ElementPreview
                  commands={previewCommands}
                  selectedId={selectedElementId}
                  zoom={previewZoom}
                  onSelect={setSelectedElementId}
                  onMove={moveElement}
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
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setEditedEpl(nextValue);
                    }}
                    placeholder="EPL ciktisi buraya gelecek..."
                    sx={{
                      "& .MuiInputBase-input": {
                        fontFamily: "monospace",
                        fontSize: 13,
                        whiteSpace: "pre",
                      },
                    }}
                  />
                  <Alert severity="info" sx={{ borderRadius: 0 }}>
                    EPL ciktisi taslaktan otomatik uretilir. Elle degisiklik yapabilirsiniz; taslak/veri degistiginde otomatik guncellenir.
                  </Alert>
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, xl: 3 }}>
            <Stack spacing={2}>
              <ToolboxPanel
                onAddText={() => addElement("text")}
                onAddBlackBox={() => addElement("blackBox")}
                onAddLine={() => addElement("line")}
                onAddBox={() => addElement("box")}
                onAddBarcode={() => addElement("barcode")}
                onDuplicateSelected={duplicateSelectedElement}
                onRemoveSelected={removeSelectedElement}
                onClearAll={clearAllElements}
              />

              <ElementPropertiesPanel
                elements={draft.elements}
                selectedElement={selectedElement}
                selectedElementId={selectedElementId}
                datasetKeys={datasetKeys}
                setSelectedElementId={setSelectedElementId}
                updateElement={updateElement}
                handleNumberFieldArrow={handleNumberFieldArrow}
              />

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={1.5}>Baglanabilir Alanlar</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {datasetKeys.map((key) => (
                    <Chip key={key} label={FIELD_LABELS[key as keyof typeof FIELD_LABELS] ?? key} size="small" />
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
