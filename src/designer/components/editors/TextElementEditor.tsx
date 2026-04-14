import { Alert, FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import type { TextElement, UpdateElementFn, NumberFieldArrowHandler } from "../../types";
import { BindingField, BufferedTextField, NumberField, TwoColumnFields } from "./shared";

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
      <BufferedTextField
        key={`${element.id}-static-text`}
        label="Varsayilan Metin"
        value={element.staticText}
        helperText={element.binding ? "Secilen binding bos donerse bu metin basilir." : "Binding yoksa dogrudan bu metin basilir."}
        onCommit={(next) => updateElement(element.id, { staticText: next })}
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
        label="Font Boyutu"
        value={element.font}
        onChange={(event) => updateElement(element.id, { font: Number((event.target as HTMLInputElement).value) as TextElement["font"] })}
      >
        <MenuItem value={1}>10pt (Küçük)</MenuItem>
        <MenuItem value={2}>12pt (Orta)</MenuItem>
        <MenuItem value={3}>14pt (Büyük)</MenuItem>
        <MenuItem value={4}>18pt (Çok Büyük)</MenuItem>
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
        control={<Switch checked={element.reverse ?? false} onChange={(event) => updateElement(element.id, { reverse: event.target.checked })} />}
        label="Ters Baski"
      />
      <FormControlLabel
        control={<Switch checked={element.bold ?? false} onChange={(event) => updateElement(element.id, { bold: event.target.checked })} />}
        label="Kalin (Bold)"
      />
    </>
  );
}