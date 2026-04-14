import { Paper, Stack, TextField, Typography, Button } from "@mui/material";

interface DataPanelProps {
  jsonText: string;
  onJsonTextChange: (value: string) => void;
  onApplyJson: () => void;
}

export function DataPanel({ jsonText, onJsonTextChange, onApplyJson }: DataPanelProps) {
  return (
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
          value={jsonText}
          onChange={(event) => onJsonTextChange(event.target.value)}
        />
        <Button variant="contained" onClick={onApplyJson}>JSON Uygula</Button>
      </Stack>
    </Paper>
  );
}
