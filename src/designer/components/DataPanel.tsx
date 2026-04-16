import { Paper, Stack, TextField, Typography, Button, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState } from "react";

interface DataPanelProps {
  jsonText: string;
  onJsonTextChange: (value: string) => void;
  onApplyJson: () => void;
}

export function DataPanel({ jsonText, onJsonTextChange, onApplyJson }: DataPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
            JSON Veri
          </Typography>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>
        <Collapse in={expanded}>
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
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
        </Collapse>
      </Stack>
    </Paper>
  );
}
