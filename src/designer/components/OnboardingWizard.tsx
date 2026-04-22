import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { FIELD_LABELS, LABEL_PRESETS, SAMPLE_DATA_JSON } from "../constants";
import { normalizeRecords } from "../layout";
import type { DataRecord, WizardElementChoice, WizardResult } from "../types";

const STEPS = ["Etiket Boyutu", "Veri Kaynagi", "Element Ekleme", "Ozet"];

type Props = {
  open: boolean;
  onComplete: (result: WizardResult) => void;
  onSkip: () => void;
};

export function OnboardingWizard({ open, onComplete, onSkip }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("Yeni Etiket");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customWidthMm, setCustomWidthMm] = useState(60);
  const [customHeightMm, setCustomHeightMm] = useState(35);
  const [jsonText, setJsonText] = useState(SAMPLE_DATA_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<WizardElementChoice[]>([]);

  const parsedRecords = useMemo(() => {
    try {
      const payload = JSON.parse(jsonText) as unknown;
      const records = normalizeRecords(payload);
      setParseError(null);
      return records;
    } catch {
      setParseError("Gecersiz JSON formati");
      return [] as DataRecord[];
    }
  }, [jsonText]);

  const discoveredFields = useMemo(() => {
    if (!parsedRecords.length) return [] as string[];
    return Object.keys(parsedRecords[0]);
  }, [parsedRecords]);

  const isPresetCustom = selectedPresetIndex === LABEL_PRESETS.length - 1;
  const widthMm = isPresetCustom ? customWidthMm : LABEL_PRESETS[selectedPresetIndex].widthMm;
  const heightMm = isPresetCustom ? customHeightMm : LABEL_PRESETS[selectedPresetIndex].heightMm;

  const canAdvance = useMemo(() => {
    if (activeStep === 0) {
      return name.trim().length > 0 && widthMm > 0 && heightMm > 0;
    }
    return true;
  }, [activeStep, name, widthMm, heightMm]);

  function toggleChoice(choice: WizardElementChoice) {
    setSelectedChoices((prev) => {
      const exists = prev.some((c) => c.type === choice.type && c.binding === choice.binding);
      return exists ? prev.filter((c) => !(c.type === choice.type && c.binding === choice.binding)) : [...prev, choice];
    });
  }

  function isChoiceSelected(type: string, binding: string) {
    return selectedChoices.some((c) => c.type === type && c.binding === binding);
  }

  function handleNext() {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  }

  function handleCreate() {
    onComplete({
      name: name.trim(),
      labelWidthMm: widthMm,
      labelHeightMm: heightMm,
      jsonText,
      records: parsedRecords,
      selectedElements: selectedChoices,
    });
  }

  function handleReset() {
    setActiveStep(0);
    setName("Yeni Etiket");
    setSelectedPresetIndex(0);
    setCustomWidthMm(60);
    setCustomHeightMm(35);
    setJsonText(SAMPLE_DATA_JSON);
    setParseError(null);
    setSelectedChoices([]);
  }

  function handleSkip() {
    handleReset();
    onSkip();
  }

  return (
    <Dialog open={open} fullWidth maxWidth="sm" onClose={handleSkip}>
      <DialogTitle sx={{ pb: 1 }}>
        Yeni Etiket Olustur
      </DialogTitle>

      <Stepper activeStep={activeStep} sx={{ px: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <DialogContent sx={{ minHeight: 320 }}>
        {activeStep === 0 && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Etiket Adi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              error={!name.trim()}
              helperText={!name.trim() ? "Etiket adi zorunlu" : ""}
            />

            <Typography variant="subtitle2" color="text.secondary">Boyut Secin</Typography>
            <Grid container spacing={1}>
              {LABEL_PRESETS.map((preset, index) => (
                <Grid size={{ xs: 6, sm: 3 }} key={preset.label}>
                  <Paper
                    onClick={() => setSelectedPresetIndex(index)}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      textAlign: "center",
                      border: 2,
                      borderColor: selectedPresetIndex === index ? "primary.main" : "divider",
                      bgcolor: selectedPresetIndex === index ? "primary.50" : "background.paper",
                      transition: "all 0.15s",
                    }}
                  >
                    <Typography variant="body2" fontWeight={selectedPresetIndex === index ? 700 : 400}>
                      {preset.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {isPresetCustom && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Genislik (mm)"
                  type="number"
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Yukseklik (mm)"
                  type="number"
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Stack>
            )}
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="JSON Verisi"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              multiline
              minRows={6}
              maxRows={12}
              fullWidth
              error={!!parseError}
              helperText={parseError}
            />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => setJsonText(SAMPLE_DATA_JSON)}>Ornek Veri Kullan</Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => setJsonText("")}>Temizle</Button>
            </Stack>

            {parsedRecords.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  {parsedRecords.length} kayit bulundu - Alanlar:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {discoveredFields.map((field) => (
                    <Chip
                      key={field}
                      label={FIELD_LABELS[field as keyof typeof FIELD_LABELS] ?? field}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {discoveredFields.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">Veri Alanlari</Typography>
                <Box sx={{ maxHeight: 180, overflow: "auto" }}>
                  <FormGroup>
                    {discoveredFields.map((field) => {
                      const fieldLabel = FIELD_LABELS[field as keyof typeof FIELD_LABELS] ?? field;
                      return (
                        <FormControlLabel
                          key={field}
                          control={
                            <Checkbox
                              checked={isChoiceSelected("text", field)}
                              onChange={() => toggleChoice({ type: "text", binding: field, label: fieldLabel })}
                            />
                          }
                          label={`Metin: ${fieldLabel}`}
                        />
                      );
                    })}
                  </FormGroup>
                </Box>
                <Divider />
              </>
            )}

            <Typography variant="subtitle2" color="text.secondary">Barkod</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isChoiceSelected("barcode", "refNo")}
                    onChange={() => toggleChoice({ type: "barcode", binding: "refNo", label: "Barkod" })}
                  />
                }
                label="Barkod (refNo)"
              />
            </FormGroup>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Dekorasyon</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isChoiceSelected("line", "")}
                    onChange={() => toggleChoice({ type: "line", binding: "", label: "Ayirici Cizgi" })}
                  />
                }
                label="Ayirici Cizgi"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isChoiceSelected("box", "")}
                    onChange={() => toggleChoice({ type: "box", binding: "", label: "Cerceve Kutu" })}
                  />
                }
                label="Cerceve Kutu"
              />
            </FormGroup>

            <Typography variant="caption" color="text.secondary">
              {selectedChoices.length} element secili
            </Typography>
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Boyut</Typography>
              <Typography>{name} - {widthMm} x {heightMm} mm</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Veri</Typography>
              <Typography>{parsedRecords.length} kayit, {discoveredFields.length} alan</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Elementler ({selectedChoices.length})
              </Typography>
              {selectedChoices.length === 0 ? (
                <Typography color="text.secondary">Hicbir element secilmedi - bos tuval</Typography>
              ) : (
                <Stack spacing={0.5}>
                  {selectedChoices.map((choice, index) => (
                    <Typography key={index} variant="body2">
                      {choice.type === "text" ? "Metin" : choice.type === "barcode" ? "Barkod" : choice.type === "line" ? "Cizgi" : "Kutu"}
                      {choice.binding ? ` → ${choice.label}` : ` → ${choice.label}`}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} color="inherit">Bos Taslak</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleBack} disabled={activeStep === 0}>Geri</Button>
        {activeStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canAdvance} variant="contained">Ileri</Button>
        ) : (
          <Button onClick={handleCreate} variant="contained">Olustur</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
