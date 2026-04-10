import type { ReactNode } from "react";
import { Grid, MenuItem, TextField } from "@mui/material";
import { FIELD_LABELS } from "../../constants";
import type { NumberFieldArrowHandler } from "../../types";

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  step?: number;
  helperText?: string;
  handleNumberFieldArrow: NumberFieldArrowHandler;
  onChange: (next: number) => void;
};

export function NumberField({
  label,
  value,
  min = 0,
  step = 1,
  helperText,
  handleNumberFieldArrow,
  onChange,
}: NumberFieldProps) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      helperText={helperText}
      onChange={(event) => onChange(Number((event.target as HTMLInputElement).value) || 0)}
      onBlur={(event) => onChange(Math.max(min, Number((event.target as HTMLInputElement).value) || 0))}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onChange(Math.max(min, Number((event.target as HTMLInputElement).value) || 0));
          (event.target as HTMLInputElement).blur();
          return;
        }

        handleNumberFieldArrow(event, value, onChange, min, step);
      }}
    />
  );
}

type BindingFieldProps = {
  value: string;
  datasetKeys: string[];
  label?: string;
  helperText?: string;
  onChange: (value: string) => void;
};

export function BindingField({
  value,
  datasetKeys,
  label = "Alan Baglantisi",
  helperText,
  onChange,
}: BindingFieldProps) {
  return (
    <TextField
      select
      label={label}
      value={value}
      helperText={helperText}
      onChange={(event) => onChange(event.target.value)}
    >
      <MenuItem value="">Bos</MenuItem>
      {Array.from(new Set([...datasetKeys, value])).filter(Boolean).map((key) => (
        <MenuItem key={key} value={key}>
          {FIELD_LABELS[key as keyof typeof FIELD_LABELS] ?? key}
        </MenuItem>
      ))}
    </TextField>
  );
}

type TwoColumnFieldsProps = {
  left: ReactNode;
  right: ReactNode;
};

export function TwoColumnFields({ left, right }: TwoColumnFieldsProps) {
  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 6 }}>{left}</Grid>
      <Grid size={{ xs: 6 }}>{right}</Grid>
    </Grid>
  );
}