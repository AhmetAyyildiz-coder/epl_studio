import { Alert, FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import type { BarcodeElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { BindingField, NumberField, TwoColumnFields } from "./shared";

type BarcodeElementEditorProps = {
  element: BarcodeElement;
  datasetKeys: string[];
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function BarcodeElementEditor({
  element,
  datasetKeys,
  updateElement,
  handleNumberFieldArrow,
}: BarcodeElementEditorProps) {
  return (
    <>
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Binding secilirse barkod verisi JSON'dan gelir. Veri bossa varsayilan barkod metni kullanilir.
      </Alert>
      <BindingField
        value={element.binding}
        datasetKeys={datasetKeys}
        helperText="Barkod icerigini hangi alandan alacagini sec."
        onChange={(value) => updateElement(element.id, { binding: value })}
      />
      <TextField
        label="Varsayilan Barkod Metni"
        value={element.staticText}
        helperText={element.binding ? "Secilen binding bos donerse bu deger kullanilir." : "Binding yoksa dogrudan bu deger kullanilir."}
        onChange={(event) => updateElement(element.id, { staticText: event.target.value })}
      />
      <TwoColumnFields
        left={
          <TextField
            select
            label="Tip"
            value={element.barcodeType}
            onChange={(event) => updateElement(element.id, { barcodeType: event.target.value as BarcodeElement["barcodeType"] })}
          >
            <MenuItem value="1">Code128</MenuItem>
            <MenuItem value="3">Code39</MenuItem>
          </TextField>
        }
        right={
          <NumberField
            label="Yukseklik"
            value={element.height}
            min={40}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { height: next })}
          />
        }
      />
      <TwoColumnFields
        left={
          <NumberField
            label="Narrow"
            value={element.narrow}
            min={1}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { narrow: next })}
          />
        }
        right={
          <NumberField
            label="Wide"
            value={element.wide}
            min={2}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { wide: next })}
          />
        }
      />
      <FormControlLabel
        control={<Switch checked={element.humanReadable} onChange={(event) => updateElement(element.id, { humanReadable: event.target.checked })} />}
        label="Alt Metni Goster"
      />
    </>
  );
}