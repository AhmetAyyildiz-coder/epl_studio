import { Alert, MenuItem, TextField } from "@mui/material";
import type { LineElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { NumberField, TwoColumnFields } from "./shared";

type LineElementEditorProps = {
  element: LineElement;
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function LineElementEditor({ element, updateElement, handleNumberFieldArrow }: LineElementEditorProps) {
  const endX = element.x + element.width;
  const endY = element.y + element.height;

  const updateHorizontalStart = (nextX: number) => {
    const safeNextX = Math.min(nextX, Math.max(0, endX - 1));
    updateElement(element.id, {
      x: safeNextX,
      width: Math.max(1, endX - safeNextX),
    });
  };

  const updateHorizontalEnd = (nextEndX: number) => {
    const safeEndX = Math.max(element.x + 1, nextEndX);
    updateElement(element.id, { width: Math.max(1, safeEndX - element.x) });
  };

  const updateVerticalStart = (nextY: number) => {
    const safeNextY = Math.min(nextY, Math.max(0, endY - 1));
    updateElement(element.id, {
      y: safeNextY,
      height: Math.max(1, endY - safeNextY),
    });
  };

  const updateVerticalEnd = (nextEndY: number) => {
    const safeEndY = Math.max(element.y + 1, nextEndY);
    updateElement(element.id, { height: Math.max(1, safeEndY - element.y) });
  };

  return (
    <>
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Cizgiler icin baslangic ve bitis koordinatlari ayridir. Boylece yatayda sag ucu, dikeyde alt ucu ayri kontrol edebilirsiniz.
      </Alert>
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
            label={element.orientation === "horizontal" ? "Baslangic X" : "X"}
            value={element.x}
            min={0}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => {
              if (element.orientation === "horizontal") {
                updateHorizontalStart(next);
                return;
              }

              updateElement(element.id, { x: next });
            }}
          />
        }
        right={
          <NumberField
            label={element.orientation === "horizontal" ? "Bitis X" : "Baslangic Y"}
            value={element.orientation === "horizontal" ? endX : element.y}
            min={0}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => {
              if (element.orientation === "horizontal") {
                updateHorizontalEnd(next);
                return;
              }

              updateVerticalStart(next);
            }}
          />
        }
      />
      <TwoColumnFields
        left={
          <NumberField
            label={element.orientation === "horizontal" ? "Y" : "Bitis Y"}
            value={element.orientation === "horizontal" ? element.y : endY}
            min={0}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => {
              if (element.orientation === "horizontal") {
                updateElement(element.id, { y: next });
                return;
              }

              updateVerticalEnd(next);
            }}
          />
        }
        right={
          <NumberField
            label="Kalinlik"
            value={element.orientation === "horizontal" ? element.height : element.width}
            min={1}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, element.orientation === "horizontal" ? { height: next } : { width: next })}
          />
        }
      />
    </>
  );
}