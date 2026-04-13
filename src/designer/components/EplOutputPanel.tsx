import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";

type EplOutputPanelProps = {
  sourceEpl: string;
  onApply: (epl: string) => void;
  onCopy: (epl: string) => void;
  onValueChange: (epl: string) => void;
};

export function EplOutputPanel({ sourceEpl, onApply, onCopy, onValueChange }: EplOutputPanelProps) {
  const [localEpl, setLocalEpl] = useState(sourceEpl);

  useEffect(() => {
    onValueChange(localEpl);
  }, [localEpl, onValueChange]);

  const hasValue = localEpl.trim().length > 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <Typography variant="h6">EPL Ciktisi</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => onApply(localEpl)} disabled={!hasValue}>
              EPL Uygula
            </Button>
            <Button variant="outlined" onClick={() => onCopy(localEpl)} disabled={!hasValue}>Kopyala</Button>
          </Stack>
        </Stack>
        <TextField
          multiline
          minRows={10}
          maxRows={18}
          value={localEpl}
          onChange={(event) => setLocalEpl(event.target.value)}
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
          EPL ciktisi taslaktan otomatik uretilir. Elle degisiklik yapabilirsiniz; panel yeni bir kaynaga gecince editor otomatik sifirlanir.
        </Alert>
      </Stack>
    </Paper>
  );
}