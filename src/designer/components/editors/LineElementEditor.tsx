import { MenuItem, TextField } from "@mui/material";
import type { LineElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { NumberField, TwoColumnFields } from "./shared";

type LineElementEditorProps = {
  element: LineElement;
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function LineElementEditor({ element, updateElement, handleNumberFieldArrow }: LineElementEditorProps) {
  return (
    <>
      <TextField
        select
        label="Yon"
        value={element.orientation}
        onChange={(event) => {
          const nextOrientation = event.target.value as LineElement["orientation"];
          updateElement(element.id, {
            orientation: nextOrientation,
            width: nextOrientation === "horizontal" ? Math.max(element.width, 120) : Math.min(element.width, 3),
            height: nextOrientation === "vertical" ? Math.max(element.height, 120) : Math.min(element.height, 3),
          });
        }}
      >
        <MenuItem value="horizontal">Yatay</MenuItem>
        <MenuItem value="vertical">Dikey</MenuItem>
      </TextField>
      <TwoColumnFields
        left={
          <NumberField
            label={element.orientation === "horizontal" ? "Uzunluk" : "Kalinlik"}
            value={element.width}
            min={1}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { width: next })}
          />
        }
        right={
          <NumberField
            label={element.orientation === "vertical" ? "Uzunluk" : "Kalinlik"}
            value={element.height}
            min={1}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { height: next })}
          />
        }
      />
    </>
  );
}