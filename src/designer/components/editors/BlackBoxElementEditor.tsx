import { Alert, MenuItem, TextField } from "@mui/material";
import type { BlackBoxElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { BindingField, BufferedTextField, NumberField, TwoColumnFields } from "./shared";

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
        Siyah Kutu beyaz yazi siyah zemin olarak basilir. 0 degeri metne gore otomatik boyut demektir.
      </Alert>
      <BindingField
        value={element.binding}
        datasetKeys={datasetKeys}
        helperText="Icerigi JSON alanindan almak istersen sec."
        onChange={(value) => updateElement(element.id, { binding: value })}
      />
      <BufferedTextField
        key={`${element.id}-blackbox-text`}
        label="Kutu Metni"
        value={element.staticText}
        helperText={element.binding ? "Secilen binding bos donerse bu metin kullanilir." : "Binding yoksa dogrudan bu metin basilir."}
        onCommit={(next) => updateElement(element.id, { staticText: next })}
      />
      <TextField
        select
        label="Yazi Tipi"
        value={element.font}
        onChange={(event) => updateElement(element.id, { font: Number((event.target as HTMLInputElement).value) as BlackBoxElement["font"] })}
      >
        <MenuItem value={1}>Yazi Tipi 1</MenuItem>
        <MenuItem value={2}>Yazi Tipi 2</MenuItem>
        <MenuItem value={3}>Yazi Tipi 3</MenuItem>
        <MenuItem value={4}>Yazi Tipi 4</MenuItem>
      </TextField>
      <TwoColumnFields
        left={
          <NumberField
            label="Genislik"
            value={element.width}
            min={0}
            helperText="0 = otomatik"
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { width: next })}
          />
        }
        right={
          <NumberField
            label="Yukseklik"
            value={element.height}
            min={0}
            helperText="0 = otomatik"
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { height: next })}
          />
        }
      />
    </>
  );
}