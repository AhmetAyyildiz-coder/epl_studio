import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_PREVIEW_ZOOM,
  DEFAULT_PRINT_OFFSET_X,
  DEFAULT_PRINT_OFFSET_Y,
  SAMPLE_DATA_JSON,
  STORAGE_KEY,
} from "./designer/constants";
import { ElementPropertiesPanel } from "./designer/components/ElementPropertiesPanel";
import { ToolboxPanel } from "./designer/components/ToolboxPanel";
import { CanvasPanel } from "./designer/components/CanvasPanel";
import { DataPanel } from "./designer/components/DataPanel";
import { LayoutPanel } from "./designer/components/LayoutPanel";
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
import type { CanvasElement, DataSourceConfig, ElementType, LayoutDraft, NumberFieldArrowHandler } from "./designer/types";

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
  // Records ve seçili index'leri tek state'de yönet - birden fazla setState çağrısını önler
  const [recordsState, setRecordsState] = useState(() => ({
    records: normalizeRecords(JSON.parse(SAMPLE_DATA_JSON)),
    selectedRecordIndex: 0,
    selectedRecordIndexes: [0] as number[],
  }));
  const records = recordsState.records;
  const selectedRecordIndex = recordsState.selectedRecordIndex;
  const selectedRecordIndexes = recordsState.selectedRecordIndexes;
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

  // selectedElementId'i doğrula - draft'ta yoksa ilk elementi seç (derived state, useEffect yok)
  const validSelectedElementId = useMemo(() => {
    if (!selectedElementId) return draft.elements[0]?.id ?? null;
    const exists = draft.elements.some((element) => element.id === selectedElementId);
    return exists ? selectedElementId : draft.elements[0]?.id ?? null;
  }, [selectedElementId, draft.elements]);

  const previewCommands = useMemo(() => buildPreviewCommands(renderDraft, deferredActiveRecord), [renderDraft, deferredActiveRecord]);
  const selectedElement = useMemo(
    () => draft.elements.find((element) => element.id === validSelectedElementId) ?? null,
    [draft.elements, validSelectedElementId],
  );
  const datasetKeys = useMemo(() => Array.from(new Set(records.flatMap((record) => Object.keys(record)))), [records]);
  const selectedEpl = useMemo(() => {
    if (!deferredSelectedRecordIndexes.length) {
      return "";
    }

    return deferredSelectedRecordIndexes.map((index) => buildEpl(deferredEplDraft, records[index], 0, 0)).join("");
  }, [deferredEplDraft, records, deferredSelectedRecordIndexes]);

  // Edited EPL state - kullanıcı manuel düzenleme yaptığında kullanılır
  const [editedEpl, setEditedEpl] = useState<string>("");

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

  // EPL sync - editedEpl boşsa selectedEpl'i kullan, yoksa editedEpl'i kullan
  const currentEpl = editedEpl.trim() || selectedEpl;

  // Taslak değiştiğinde EPL düzenlemesini sıfırla
  useEffect(() => {
    setEditedEpl("");
  }, [draft.id]);

  // Seçili kayıtlar değiştiğinde EPL'yi güncelle
  useEffect(() => {
    if (debouncedJsonText === dataSource.jsonText) {
      return;
    }

    try {
      const payload = JSON.parse(debouncedJsonText) as unknown;
      const nextRecords = normalizeRecords(payload);
      if (nextRecords.length) {
        // Tek setState çağrısı - performans için optimize edildi
        setRecordsState({
          records: nextRecords,
          selectedRecordIndex: 0,
          selectedRecordIndexes: [0],
        });
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
    setEditedEpl(""); // EPL çıktısını sıfırla - yeni taslak için yeniden hesaplansın
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

      setRecordsState({
        records: nextRecords,
        selectedRecordIndex: 0,
        selectedRecordIndexes: [0],
      });
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

    const shiftedEpl = applyEplOffset(currentEpl, printOffsetX, printOffsetY);
    submitEpl(shiftedEpl);
    console.log("Yazdirilan EPL:", shiftedEpl);
    setMessageOptimized(`${selectedRecordIndexes.length} kayit yazdirma servisine gonderildi.`);
  }, [currentEpl, printOffsetX, printOffsetY, selectedRecordIndexes, setMessageOptimized]);

  const copyEplToClipboard = useCallback(async () => {
    if (!currentEpl) {
      setMessageOptimized("Kopyalanacak EPL cikti yok.");
      return;
    }

    try {
      await navigator.clipboard.writeText(currentEpl);
      setMessageOptimized("EPL cikti panoya kopyalandi.");
    } catch (error) {
      setMessageOptimized(`EPL kopyalanamadi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }, [currentEpl, setMessageOptimized]);

  const applyEditedEplToPreview = useCallback(() => {
    const parsed = parseEplToElements(currentEpl, printOffsetX, printOffsetY);
    if (!parsed.length) {
      setMessageOptimized("EPL parse edilemedi. A/LE/LO/X/B komutlarini kontrol edin.");
      return;
    }

    setDraft((prev) => ({ ...prev, elements: parsed }));
    setSelectedElementId(parsed[0]?.id ?? null);
    setMessageOptimized(`${parsed.length} eleman EPL'den parse edilip preview'e uygulandi.`);
  }, [currentEpl, printOffsetX, printOffsetY, setMessageOptimized]);

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
        {/* Durum Bar - Kompakt ve Modern */}
        <Paper
          sx={{
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
          }}
        >
          {/* Sol taraf - İstatistikler */}
          <Stack
            direction="row"
            spacing={3}
            sx={{
              px: 2,
              py: 1.5,
              flex: 1,
              borderBottom: { xs: 1, md: 0 },
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Taslak</Typography>
              <Chip label={String(layouts.length)} size="small" sx={{ fontWeight: 600, minWidth: 32, height: 24 }} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Veri</Typography>
              <Chip label={String(records.length)} size="small" sx={{ fontWeight: 600, minWidth: 32, height: 24 }} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Eleman</Typography>
              <Chip label={String(draft.elements.length)} size="small" sx={{ fontWeight: 600, minWidth: 32, height: 24 }} />
            </Stack>
          </Stack>

          {/* Sağ taraf - Mesaj ve Loading */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              px: 2,
              py: 1,
              alignItems: "center",
              flex: 2,
              bgcolor: { xs: "action.hover", md: "transparent" },
            }}
          >
            {isLoadingRemoteLayouts && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "primary.main" }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: 2,
                    borderColor: "currentColor",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>Yükleniyor...</Typography>
              </Stack>
            )}
            <Typography
              variant="body2"
              sx={{
                color: message.toLowerCase().includes("hata") ? "error.main" : "text.primary",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {message}
            </Typography>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, xl: 3 }}>
            <Stack spacing={2}>
              <LayoutPanel
                layouts={layouts}
                selectedLayoutId={selectedLayoutId}
                isLoadingRemoteLayouts={isLoadingRemoteLayouts}
                remoteLayoutFilters={remoteLayoutFilters}
                onSelectLayout={selectLayout}
                onCreateNew={() => {
                  const nextDraft = emptyLayout();
                  setDraft(nextDraft);
                  setSelectedLayoutId(nextDraft.id);
                  setSelectedElementId(nextDraft.elements[0]?.id ?? null);
                }}
                onUpdateFilter={updateRemoteFilter}
                onSearchRemote={searchRemoteLayouts}
                onResetRemoteSearch={resetRemoteLayoutSearch}
              />

              <DataPanel
                jsonText={dataSource.jsonText}
                onJsonTextChange={(value) => setDataSource((prev) => ({ ...prev, jsonText: value }))}
                onApplyJson={applyJsonData}
              />
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

              <CanvasPanel
                draft={draft}
                previewCommands={previewCommands}
                selectedElementId={validSelectedElementId}
                previewZoom={previewZoom}
                printOffsetX={printOffsetX}
                printOffsetY={printOffsetY}
                currentEpl={currentEpl}
                editedEpl={editedEpl}
                records={records}
                onSetPreviewZoom={(zoom) => setPreviewZoom(zoom)}
                onSetPrintOffsetX={(value) => setPrintOffsetX(value)}
                onSetPrintOffsetY={(value) => setPrintOffsetY(value)}
                onSetEditedEpl={(value) => setEditedEpl(value)}
                onSelectElement={setSelectedElementId}
                onMoveElement={moveElement}
                onApplyEpl={applyEditedEplToPreview}
                onCopyEpl={copyEplToClipboard}
                handleNumberFieldArrow={handleNumberFieldArrow}
              />
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
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
