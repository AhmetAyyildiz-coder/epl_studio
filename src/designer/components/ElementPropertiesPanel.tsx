import { Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import type { CanvasElement, NumberFieldArrowHandler, UpdateElementFn } from "../types";
import { formatElementOptionLabel } from "../utils";
import { BarcodeElementEditor } from "./editors/BarcodeElementEditor";
import { BlackBoxElementEditor } from "./editors/BlackBoxElementEditor";
import { BoxElementEditor } from "./editors/BoxElementEditor";
import { LineElementEditor } from "./editors/LineElementEditor";
import { TextElementEditor } from "./editors/TextElementEditor";
import { NumberField } from "./editors/shared";

type ElementPropertiesPanelProps = {
  elements: CanvasElement[];
  selectedElement: CanvasElement | null;
  selectedElementId: string | null;
  datasetKeys: string[];
  setSelectedElementId: (id: string | null) => void;
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function ElementPropertiesPanel({
  elements,
  selectedElement,
  selectedElementId,
  datasetKeys,
  setSelectedElementId,
  updateElement,
  handleNumberFieldArrow,
}: ElementPropertiesPanelProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={1.5}>Eleman Ozellikleri</Typography>
      {elements.length ? (
        <Stack spacing={1.5}>
          <TextField
            select
            label="Eleman Sec"
            value={elements.find((element) => element.id === selectedElementId) ? selectedElementId : ""}
            onChange={(event) => setSelectedElementId(event.target.value || null)}
          >
            {elements.map((element, index) => (
              <MenuItem key={element.id} value={element.id}>
                {formatElementOptionLabel(element, index)}
              </MenuItem>
            ))}
          </TextField>

          {selectedElement ? (
            <>
              <TextField
                label="Eleman Adi"
                value={selectedElement.label}
                helperText="Bu ad sadece editor icinde gorunur."
                onChange={(event) => updateElement(selectedElement.id, { label: event.target.value })}
              />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <NumberField
                    label="X"
                    value={selectedElement.x}
                    min={0}
                    handleNumberFieldArrow={handleNumberFieldArrow}
                    onChange={(next) => updateElement(selectedElement.id, { x: next })}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <NumberField
                    label="Y"
                    value={selectedElement.y}
                    min={0}
                    handleNumberFieldArrow={handleNumberFieldArrow}
                    onChange={(next) => updateElement(selectedElement.id, { y: next })}
                  />
                </Grid>
              </Grid>

              {selectedElement.type === "text" ? (
                <TextElementEditor
                  element={selectedElement}
                  datasetKeys={datasetKeys}
                  updateElement={updateElement}
                  handleNumberFieldArrow={handleNumberFieldArrow}
                />
              ) : null}

              {selectedElement.type === "blackBox" ? (
                <BlackBoxElementEditor
                  element={selectedElement}
                  datasetKeys={datasetKeys}
                  updateElement={updateElement}
                  handleNumberFieldArrow={handleNumberFieldArrow}
                />
              ) : null}

              {selectedElement.type === "line" ? (
                <LineElementEditor
                  element={selectedElement}
                  updateElement={updateElement}
                  handleNumberFieldArrow={handleNumberFieldArrow}
                />
              ) : null}

              {selectedElement.type === "box" ? (
                <BoxElementEditor
                  element={selectedElement}
                  updateElement={updateElement}
                  handleNumberFieldArrow={handleNumberFieldArrow}
                />
              ) : null}

              {selectedElement.type === "barcode" ? (
                <BarcodeElementEditor
                  element={selectedElement}
                  datasetKeys={datasetKeys}
                  updateElement={updateElement}
                  handleNumberFieldArrow={handleNumberFieldArrow}
                />
              ) : null}
            </>
          ) : (
            <Typography color="text.secondary">Listeden bir eleman secin.</Typography>
          )}
        </Stack>
      ) : (
        <Typography color="text.secondary">Canvas uzerinden bir eleman secin.</Typography>
      )}
    </Paper>
  );
}