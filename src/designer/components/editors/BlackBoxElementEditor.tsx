import { Alert, MenuItem, TextField } from "@mui/material";
import type { BlackBoxElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { BindingField, NumberField, TwoColumnFields } from "./shared";

type BlackBoxElementEditorProps = {
  element: BlackBoxElement;
  datasetKeys: string[];
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function BlackBoxElementEditor({
  element,
  datasetKeys,
  updateElement,
  handleNumberFieldArrow,
}: BlackBoxElementEditorProps) {
  return (
    <>
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Siyah Kutu tek satirlik, beyaz yazi siyah zemin presetidir. Max line, hizalama ve ters baski gibi text ayarlari burada gizlenir.
      </Alert>
      <BindingField
        value={element.binding}
        datasetKeys={datasetKeys}
        helperText="Icerigi JSON alanindan almak istersen sec."
        onChange={(value) => updateElement(element.id, { binding: value })}
      />
      <TextField
        label="Kutu Metni"
        value={element.staticText}
        helperText={element.binding ? "Secilen binding bos donerse bu metin kullanilir." : "Binding yoksa dogrudan bu metin basilir."}
        onChange={(event) => updateElement(element.id, { staticText: event.target.value })}
      />
      <TextField
        select
        label="Font"
        value={element.font}
        onChange={(event) => updateElement(element.id, { font: Number((event.target as HTMLInputElement).value) as BlackBoxElement["font"] })}
      >
        <MenuItem value={1}>Font 1</MenuItem>
        <MenuItem value={2}>Font 2</MenuItem>
        <MenuItem value={3}>Font 3</MenuItem>
        <MenuItem value={4}>Font 4</MenuItem>
      </TextField>
      <TwoColumnFields
        left={
          <NumberField
            label="Yatay Padding"
            value={element.paddingX}
            min={4}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { paddingX: next })}
          />
        }
        right={
          <NumberField
            label="Dikey Padding"
            value={element.paddingY}
            min={2}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { paddingY: next })}
          />
        }
      />
    </>
  );
}