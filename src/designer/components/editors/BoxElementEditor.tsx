import type { BoxElement, NumberFieldArrowHandler, UpdateElementFn } from "../../types";
import { NumberField, TwoColumnFields } from "./shared";

type BoxElementEditorProps = {
  element: BoxElement;
  updateElement: UpdateElementFn;
  handleNumberFieldArrow: NumberFieldArrowHandler;
};

export function BoxElementEditor({ element, updateElement, handleNumberFieldArrow }: BoxElementEditorProps) {
  return (
    <>
      <TwoColumnFields
        left={
          <NumberField
            label="Genislik"
            value={element.width}
            min={4}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { width: next })}
          />
        }
        right={
          <NumberField
            label="Yukseklik"
            value={element.height}
            min={4}
            handleNumberFieldArrow={handleNumberFieldArrow}
            onChange={(next) => updateElement(element.id, { height: next })}
          />
        }
      />
      <NumberField
        label="Cizgi Kalinligi"
        value={element.thickness}
        min={1}
        handleNumberFieldArrow={handleNumberFieldArrow}
        onChange={(next) => updateElement(element.id, { thickness: next })}
      />
    </>
  );
}