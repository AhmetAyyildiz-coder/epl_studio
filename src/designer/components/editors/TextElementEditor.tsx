import { Alert, FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import type { TextElement, UpdateElementFn, NumberFieldArrowHandler } from "../../types";
import { BindingField, NumberField, TwoColumnFields } from "./shared";

type TextElementEditorProps = {
  element: TextElement;
  datasetKeys: string[];
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function TextElementEditor({
  element,
  datasetKeys,
  updateElement,
  handleNumberFieldArrow,
}: TextElementEditorProps) {
  return (
    <>
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Binding secilirse veri alanindan okur. Veri bos gelirse alttaki varsayilan metni kullanir.
      </Alert>
      <BindingField
        value={element.binding}
        datasetKeys={datasetKeys}
        helperText="JSON icindeki alanlardan birini sec."
        onChange={(value) => updateElement(element.id, { binding: value })}
      />
      <TextField
        label="Varsayilan Metin"
        value={element.staticText}
        helperText={element.binding ? "Secilen binding bos donerse bu metin basilir." : "Binding yoksa dogrudan bu metin basilir."}
        onChange={(event) => updateElement(element.id, { staticText: event.target.value })}
      />
      <TwoColumnFields
        left={
          <NumberField
            label="Wrap Width"
            value={element.wrapWidth}
            min={56}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { wrapWidth: next })}
          />
        }
        right={
          <NumberField
            label="Max Lines"
            value={element.maxLines}
            min={1}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { maxLines: next })}
          />
        }
      />
      <TextField
        select
        label="Font"
        value={element.font}
        onChange={(event) => updateElement(element.id, { font: Number((event.target as HTMLInputElement).value) as TextElement["font"] })}
      >
        <MenuItem value={1}>Font 1</MenuItem>
        <MenuItem value={2}>Font 2</MenuItem>
        <MenuItem value={3}>Font 3</MenuItem>
        <MenuItem value={4}>Font 4</MenuItem>
      </TextField>
      <TextField
        select
        label="Hiza"
        value={element.align}
        onChange={(event) => updateElement(element.id, { align: event.target.value as TextElement["align"] })}
      >
        <MenuItem value="left">Sol</MenuItem>
        <MenuItem value="center">Orta</MenuItem>
        <MenuItem value="right">Sag</MenuItem>
      </TextField>
      <FormControlLabel
        control={<Switch checked={element.reverse} onChange={(event) => updateElement(element.id, { reverse: event.target.checked })} />}
        label="Ters Baski"
      />
    </>
  );
}