import { memo } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";

type ToolboxPanelProps = {
  onAddText: () => void;
  onAddBlackBox: () => void;
  onAddLine: () => void;
  onAddBox: () => void;
  onAddBarcode: () => void;
  onRemoveSelected: () => void;
  onClearAll: () => void;
};

export const ToolboxPanel = memo(function ToolboxPanel({
  onAddText,
  onAddBlackBox,
  onAddLine,
  onAddBox,
  onAddBarcode,
  onRemoveSelected,
  onClearAll,
}: ToolboxPanelProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={1.5}>Toolbox</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button variant="outlined" onClick={onAddText}>Text</Button>
        <Button variant="outlined" onClick={onAddBlackBox}>Siyah Kutu</Button>
        <Button variant="outlined" onClick={onAddLine}>Cizgi</Button>
        <Button variant="outlined" onClick={onAddBox}>Kutu</Button>
        <Button variant="outlined" onClick={onAddBarcode}>Barcode</Button>
        <Button variant="outlined" color="error" onClick={onRemoveSelected}>Sil</Button>
        <Button variant="outlined" color="error" onClick={onClearAll}>Tum Elemanlari Temizle</Button>
      </Stack>
    </Paper>
  );
});