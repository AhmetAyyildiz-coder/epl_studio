import { useEffect, useState, type ReactNode } from "react";
import { Grid, MenuItem, TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";
import { FIELD_LABELS } from "../../constants";
import type { NumberFieldArrowHandler } from "../../types";

type BufferedTextFieldProps = Omit<TextFieldProps, "value" | "onChange"> & {
  value: string;
  onCommit: (next: string) => void;
  commitDelay?: number;
};

export function BufferedTextField({
  value,
  onCommit,
  commitDelay = 160,
  onBlur,
  ...props
}: BufferedTextFieldProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (localValue === value) {
      return;
    }

    const timer = window.setTimeout(() => {
      onCommit(localValue);
    }, commitDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [commitDelay, localValue, onCommit, value]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={(event) => {
        if (localValue !== value) {
          onCommit(localValue);
        }

        onBlur?.(event);
      }}
    />
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  step?: number;
  commitDelay?: number;
  helperText?: string;
  handleNumberFieldArrow: NumberFieldArrowHandler;
  onChange: (next: number) => void;
};

export function NumberField({
  label,
  value,
  min = 0,
  step = 1,
  commitDelay = 120,
  helperText,
  handleNumberFieldArrow,
  onChange,
}: NumberFieldProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    const trimmedValue = localValue.trim();
    if (!trimmedValue) {
      return;
    }

    const parsedValue = Number(trimmedValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    const nextValue = Math.max(min, Math.round(parsedValue || 0));
    if (nextValue === value) {
      return;
    }

    const timer = window.setTimeout(() => {
      onChange(nextValue);
    }, commitDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [commitDelay, localValue, min, onChange, value]);

  const commitNumberValue = () => {
    const parsedValue = Number(localValue);
    const nextValue = Math.max(min, Math.round(Number.isNaN(parsedValue) ? 0 : parsedValue || 0));
    setLocalValue(String(nextValue));
    onChange(nextValue);
  };

  return (
    <TextField
      label={label}
      type="number"
      value={localValue}
      helperText={helperText}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={() => commitNumberValue()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commitNumberValue();
          (event.target as HTMLInputElement).blur();
          return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const currentValue = Math.max(min, Math.round(Number(localValue) || 0));
          handleNumberFieldArrow(event, currentValue, (next) => {
            setLocalValue(String(next));
            onChange(next);
          }, min, step);
          return;
        }

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