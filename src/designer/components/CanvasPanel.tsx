import { useMemo } from "react";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DOTS_PER_MM,
  FIELD_LABELS,
  LABEL_PRESETS,
} from "../constants";
import { ElementPreview } from "./ElementPreview";
import type { CanvasElement, DataRecord, LabelMetadata, NumberFieldArrowHandler, PreviewCommand } from "../types";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

interface CanvasPanelProps {
  draft: { elements: CanvasElement[] };
  metadata: LabelMetadata;
  previewCommands: PreviewCommand[];
  selectedElementId: string | null;
  previewZoom: number;
  printOffsetX: number;
  printOffsetY: number;
  currentEpl: string;
  currentReactTemplate: string;
  editedEpl: string;
  records: DataRecord[];
  overflowWarnings: string[];
  canUndo: boolean;
  canRedo: boolean;
  onSetPreviewZoom: (zoom: number) => void;
  onSetPrintOffsetX: (value: number) => void;
  onSetPrintOffsetY: (value: number) => void;
  onSetEditedEpl: (value: string) => void;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onApplyEpl: () => void;
  onCopyEpl: () => void;
  onCopyReactTemplate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateMetadata: (patch: Partial<LabelMetadata>) => void;
  handleNumberFieldArrow: NumberFieldArrowHandler;
}

export function CanvasPanel({
  draft,
  metadata,
  previewCommands,
  selectedElementId,
  previewZoom,
  printOffsetX,
  printOffsetY,
  currentEpl,
  currentReactTemplate,
  editedEpl,
  records,
  overflowWarnings,
  canUndo,
  canRedo,
  onSetPreviewZoom,
  onSetPrintOffsetX,
  onSetPrintOffsetY,
  onSetEditedEpl,
  onSelectElement,
  onMoveElement,
  onApplyEpl,
  onCopyEpl,
  onCopyReactTemplate,
  onUndo,
  onRedo,
  onUpdateMetadata,
  handleNumberFieldArrow,
}: CanvasPanelProps) {
  const matchedPreset = LABEL_PRESETS.find(
    (p) => p.widthMm === metadata.labelWidthMm && p.heightMm === metadata.labelHeightMm,
  );
  const isCustomSize = !matchedPreset || matchedPreset.widthMm === 0;
  const datasetKeys = useMemo(
    () => Array.from(new Set(records.flatMap((record) => Object.keys(record)))),
    [records],
  );

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} mb={2}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            <TextField
              select
              size="small"
              label="Etiket Boyutu"
              value={isCustomSize ? "custom" : `${metadata.labelWidthMm}x${metadata.labelHeightMm}`}
              onChange={(event) => {
                const val = event.target.value;
                if (val === "custom") return;
                const preset = LABEL_PRESETS.find((p) => `${p.widthMm}x${p.heightMm}` === val);
                if (preset) onUpdateMetadata({ labelWidthMm: preset.widthMm, labelHeightMm: preset.heightMm });
              }}
              sx={{ minWidth: 180 }}
            >
              {LABEL_PRESETS.filter((p) => p.widthMm > 0).map((p) => (
                <MenuItem key={`${p.widthMm}x${p.heightMm}`} value={`${p.widthMm}x${p.heightMm}`}>{p.label}</MenuItem>
              ))}
              <MenuItem value="custom">Ozel Boyut</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="Genislik (mm)"
              type="number"
              value={metadata.labelWidthMm}
              onChange={(event) => onUpdateMetadata({ labelWidthMm: Math.max(1, Number(event.target.value) || 1) })}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              label="Yukseklik (mm)"
              type="number"
              value={metadata.labelHeightMm}
              onChange={(event) => onUpdateMetadata({ labelHeightMm: Math.max(1, Number(event.target.value) || 1) })}
              sx={{ width: 110 }}
            />
            <Chip label={`${metadata.dpi} DPI`} size="small" />
            <Chip label={`${Math.round(metadata.labelWidthMm * DOTS_PER_MM)} x ${Math.round(metadata.labelHeightMm * DOTS_PER_MM)} dot`} size="small" />
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" size="small" onClick={onUndo} disabled={!canUndo}>
              Geri Al
            </Button>
            <Button variant="outlined" size="small" onClick={onRedo} disabled={!canRedo}>
              Ileri Al
            </Button>
            <TextField
              select
              size="small"
              label="Onizleme Zoom"
              value={String(previewZoom)}
              onChange={(event) => onSetPreviewZoom(Number(event.target.value) || 1)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="1">100%</MenuItem>
              <MenuItem value="1.25">125%</MenuItem>
              <MenuItem value="1.5">150%</MenuItem>
              <MenuItem value="1.75">175%</MenuItem>
              <MenuItem value="2">200%</MenuItem>
              <MenuItem value="2.25">225%</MenuItem>
              <MenuItem value="2.5">250%</MenuItem>
              <MenuItem value="3">300%</MenuItem>
              <MenuItem value="3.5">350%</MenuItem>
              <MenuItem value="4">400%</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="X Ofset"
              type="number"
              value={printOffsetX}
              onChange={(event) => {
                const nextValue = Math.max(0, Math.round(Number((event.target as HTMLInputElement).value) || 0));
                onSetPrintOffsetX(nextValue);
              }}
              onBlur={() => onSetPrintOffsetX(Math.max(0, Math.round(printOffsetX || 0)))}
              onKeyDown={(event) => handleNumberFieldArrow(event as ReactKeyboardEvent<HTMLDivElement>, printOffsetX, onSetPrintOffsetX, 0)}
            />
            <TextField
              size="small"
              label="Y Ofset"
              type="number"
              value={printOffsetY}
              onChange={(event) => {
                const nextValue = Math.max(0, Math.round(Number((event.target as HTMLInputElement).value) || 0));
                onSetPrintOffsetY(nextValue);
              }}
              onBlur={() => onSetPrintOffsetY(Math.max(0, Math.round(printOffsetY || 0)))}
              onKeyDown={(event) => handleNumberFieldArrow(event as ReactKeyboardEvent<HTMLDivElement>, printOffsetY, onSetPrintOffsetY, 0)}
            />
          </Stack>
        </Stack>

        <ElementPreview
          key={draft.elements.length}
          commands={previewCommands}
          metadata={metadata}
          selectedId={selectedElementId}
          zoom={previewZoom}
          onSelect={onSelectElement}
          onMove={onMoveElement}
        />
        {overflowWarnings.length ? (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 0 }}>
            {overflowWarnings.slice(0, 4).join(" | ")}
          </Alert>
        ) : null}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
            <Typography variant="h6">EPL Ciktisi</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={onApplyEpl} disabled={!currentEpl.trim()}>
                EPL Uygula
              </Button>
              <Button variant="outlined" onClick={onCopyEpl} disabled={!currentEpl}>Kopyala</Button>
            </Stack>
          </Stack>
          <TextField
            key={currentEpl.slice(0, 50)}
            multiline
            minRows={10}
            maxRows={18}
            value={editedEpl || currentEpl}
            onChange={(event) => onSetEditedEpl(event.target.value)}
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

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
            <Typography variant="h6">React / HTML Sablonu</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onCopyReactTemplate} disabled={!currentReactTemplate.trim()}>
                Kopyala
              </Button>
            </Stack>
          </Stack>
          <TextField
            multiline
            minRows={10}
            maxRows={18}
            value={currentReactTemplate}
            slotProps={{
              htmlInput: { readOnly: true },
            }}
            placeholder="React / HTML sablonu burada gosterilecek..."
            sx={{
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
                fontSize: 13,
                whiteSpace: "pre",
              },
            }}
          />
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            Veritabanina gidecek sade sablon budur. Dinamik alanlar gorunur metin yerine data-binding ve data-placeholder alanlarinda tutulur; barkod degeri ise data-value uzerinden saklanir.
          </Alert>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={1.5}>Baglanabilir Alanlar</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {datasetKeys.map((key) => (
            <Chip key={key} label={FIELD_LABELS[key as keyof typeof FIELD_LABELS] ?? key} size="small" />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
