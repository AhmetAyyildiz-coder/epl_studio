import { useCallback } from "react";
import {
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { LayoutDraft } from "../types";

type RemoteLayoutFilters = {
  shortCode: string;
  name: string;
};

interface LayoutPanelProps {
  layouts: LayoutDraft[];
  selectedLayoutId: string;
  isLoadingRemoteLayouts: boolean;
  remoteLayoutFilters: RemoteLayoutFilters;
  onSelectLayout: (id: string) => void;
  onCreateNew: () => void;
  onUpdateFilter: (field: keyof RemoteLayoutFilters, value: string) => void;
  onSearchRemote: () => void;
  onResetRemoteSearch: () => void;
}

export function LayoutPanel({
  layouts,
  selectedLayoutId,
  isLoadingRemoteLayouts,
  remoteLayoutFilters,
  onSelectLayout,
  onCreateNew,
  onUpdateFilter,
  onSearchRemote,
  onResetRemoteSearch,
}: LayoutPanelProps) {
  const handleFilterKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSearchRemote();
    }
  }, [onSearchRemote]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Taslaklar</Typography>
        <IconButton color="primary" onClick={onCreateNew}>
          +
        </IconButton>
      </Stack>
      <Stack spacing={1.25} mb={1.5}>
        <TextField
          size="small"
          label="DB Kisa Kod"
          value={remoteLayoutFilters.shortCode}
          onChange={(event) => onUpdateFilter("shortCode", event.target.value.toUpperCase())}
          onKeyDown={handleFilterKeyDown}
        />
        <TextField
          size="small"
          label="DB Taslak Adi"
          value={remoteLayoutFilters.name}
          onChange={(event) => onUpdateFilter("name", event.target.value)}
          onKeyDown={handleFilterKeyDown}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={onSearchRemote} disabled={isLoadingRemoteLayouts} sx={{ flex: 1 }}>
            {isLoadingRemoteLayouts ? "Araniyor..." : "DB'de Ara"}
          </Button>
          <Button variant="outlined" onClick={onResetRemoteSearch} disabled={isLoadingRemoteLayouts}>
            Tumunu Getir
          </Button>
        </Stack>
      </Stack>
      <List sx={{ p: 0 }}>
        {layouts.map((layout) => (
          <ListItemButton
            key={layout.id}
            selected={layout.id === selectedLayoutId}
            onClick={() => onSelectLayout(layout.id)}
            sx={{ mb: 1, borderRadius: 0 }}
          >
            <ListItemText
              primary={layout.name}
              secondary={`${layout.shortCode || "KOD-YOK"} • ${layout.elements.length} eleman`}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
