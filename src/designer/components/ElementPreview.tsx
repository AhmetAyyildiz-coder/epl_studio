import { memo, useRef } from "react";
import { Box } from "@mui/material";
import Barcode from "react-barcode";
import { Rnd } from "react-rnd";
import { DEFAULT_PREVIEW_ZOOM, DOTS_PER_MM, PREVIEW_SCALE } from "../constants";
import type { LabelMetadata, PreviewCommand } from "../types";

type ElementPreviewProps = {
  commands: PreviewCommand[];
  metadata: LabelMetadata;
  selectedId: string | null;
  zoom?: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

type PreviewItemProps = {
  command: PreviewCommand;
  selected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

const DRAG_STOP_THRESHOLD = 2;

type DragPosition = {
  x: number;
  y: number;
};

function hasMeaningfulDrag(deltaX: number, deltaY: number) {
  return Math.abs(deltaX) > DRAG_STOP_THRESHOLD || Math.abs(deltaY) > DRAG_STOP_THRESHOLD;
}

function isSamePreviewCommand(previous: PreviewCommand, next: PreviewCommand) {
  if (previous.type !== next.type || previous.id !== next.id) {
    return false;
  }

  if (previous.type === "text" && next.type === "text") {
    return (
      previous.x === next.x &&
      previous.y === next.y &&
      previous.text === next.text &&
      previous.fontSize === next.fontSize &&
      previous.reverse === next.reverse &&
      previous.bold === next.bold &&
      previous.width === next.width &&
      previous.height === next.height &&
      previous.align === next.align &&
      previous.lines.length === next.lines.length &&
      previous.lines.every((line, index) => line === next.lines[index])
    );
  }

  if (previous.type === "blackBox" && next.type === "blackBox") {
    return previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height && previous.text === next.text && previous.fontSize === next.fontSize;
  }

  if (previous.type === "line" && next.type === "line") {
    return previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height;
  }

  if (previous.type === "box" && next.type === "box") {
    return previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height && previous.thickness === next.thickness;
  }

  if (previous.type === "barcode" && next.type === "barcode") {
    return previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height && previous.text === next.text && previous.barcodeType === next.barcodeType && previous.moduleWidth === next.moduleWidth && previous.humanReadable === next.humanReadable;
  }

  return false;
}

const PreviewItem = memo(function PreviewItem({ command, selected, scale, onSelect, onMove }: PreviewItemProps) {
  const stroke = selected ? "#bf360c" : "rgba(0,77,64,0.22)";
  const fill = selected ? "rgba(191,54,12,0.08)" : "rgba(0,77,64,0.04)";
  const dragStartPositionRef = useRef<DragPosition | null>(null);

  const rememberDragStart = (position: DragPosition) => {
    dragStartPositionRef.current = position;
    onSelect(command.id);
  };

  const shouldCommitDrag = (position: DragPosition) => {
    const startPosition = dragStartPositionRef.current;
    dragStartPositionRef.current = null;

    if (!startPosition) {
      return false;
    }

    return hasMeaningfulDrag(position.x - startPosition.x, position.y - startPosition.y);
  };

  if (command.type === "text") {
    const anchorLeft =
      command.align === "right"
        ? command.x - command.width
        : command.align === "center"
          ? command.x - Math.round(command.width / 2)
          : command.x;

    return (
      <Rnd
        size={{ width: command.width + 8, height: command.height + 8 }}
        position={{ x: Math.max(0, anchorLeft - 4), y: Math.max(0, command.y) }}
        scale={scale}
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={(_, data) => rememberDragStart({ x: data.x, y: data.y })}
        onDragStop={(_, data) => {
          if (!shouldCommitDrag({ x: data.x, y: data.y })) {
            return;
          }

          const nextX =
            command.align === "right"
              ? data.x + command.width + 4
              : command.align === "center"
                ? data.x + Math.round(command.width / 2) + 4
                : data.x + 4;
          onMove(command.id, nextX, data.y);
        }}
        style={{ zIndex: selected ? 4 : 2 }}
      >
        <Box
          onClick={() => onSelect(command.id)}
          sx={{
            width: "100%",
            height: "100%",
            px: 0.5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent:
              command.align === "right"
                ? "flex-end"
                : command.align === "center"
                  ? "center"
                  : "flex-start",
            border: `1px dashed ${stroke}`,
            bgcolor: command.reverse ? "#111" : fill,
            borderRadius: 0,
            cursor: "grab",
            userSelect: "none",
            fontFamily: "monospace",
            fontSize: `${command.fontSize}px`,
            fontWeight: command.bold ? 700 : 400,
            lineHeight: 1,
            whiteSpace: "pre-wrap",
            color: command.reverse ? "#fff" : "#111",
          }}
        >
          {command.lines.join("\n")}
        </Box>
      </Rnd>
    );
  }

  if (command.type === "blackBox") {
    return (
      <Rnd
        size={{ width: command.width, height: command.height }}
        position={{ x: command.x, y: command.y }}
        scale={scale}
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={(_, data) => rememberDragStart({ x: data.x, y: data.y })}
        onDragStop={(_, data) => {
          if (!shouldCommitDrag({ x: data.x, y: data.y })) {
            return;
          }

          onMove(command.id, data.x, data.y);
        }}
        style={{ zIndex: selected ? 4 : 2 }}
      >
        <Box
          onClick={() => onSelect(command.id)}
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 0.5,
            border: `1px ${selected ? "dashed" : "solid"} ${selected ? "#bf360c" : "#111"}`,
            bgcolor: "#111",
            color: "#fff",
            cursor: "grab",
            userSelect: "none",
            boxSizing: "border-box",
            overflow: "hidden",
            fontFamily: "monospace",
            fontSize: `${command.fontSize}px`,
            lineHeight: 1,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {command.text}
        </Box>
      </Rnd>
    );
  }

  if (command.type === "line") {
    return (
      <Rnd
        size={{ width: command.width, height: Math.max(8, command.height) }}
        position={{ x: command.x, y: command.y }}
        scale={scale}
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={(_, data) => rememberDragStart({ x: data.x, y: data.y })}
        onDragStop={(_, data) => {
          if (!shouldCommitDrag({ x: data.x, y: data.y })) {
            return;
          }

          onMove(command.id, data.x, data.y);
        }}
        style={{ zIndex: selected ? 4 : 2 }}
      >
        <Box
          onClick={() => onSelect(command.id)}
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "#111",
            outline: selected ? "2px solid #bf360c" : "none",
            cursor: "grab",
          }}
        />
      </Rnd>
    );
  }

  if (command.type === "box") {
    return (
      <Rnd
        size={{ width: command.width, height: command.height }}
        position={{ x: command.x, y: command.y }}
        scale={scale}
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={(_, data) => rememberDragStart({ x: data.x, y: data.y })}
        onDragStop={(_, data) => {
          if (!shouldCommitDrag({ x: data.x, y: data.y })) {
            return;
          }

          onMove(command.id, data.x, data.y);
        }}
        style={{ zIndex: selected ? 4 : 2 }}
      >
        <Box
          onClick={() => onSelect(command.id)}
          sx={{
            width: "100%",
            height: "100%",
            border: `${command.thickness}px ${selected ? "dashed" : "solid"} ${selected ? "#bf360c" : "#111"}`,
            cursor: "grab",
            boxSizing: "border-box",
          }}
        />
      </Rnd>
    );
  }

  return (
    <Rnd
      size={{ width: command.width, height: command.height }}
      position={{ x: command.x, y: command.y }}
      scale={scale}
      bounds="parent"
      enableResizing={false}
      dragGrid={[1, 1]}
      onDragStart={(_, data) => rememberDragStart({ x: data.x, y: data.y })}
      onDragStop={(_, data) => {
        if (!shouldCommitDrag({ x: data.x, y: data.y })) {
          return;
        }

        onMove(command.id, data.x, data.y);
      }}
      style={{ zIndex: selected ? 4 : 2 }}
    >
      <Box
        onClick={() => onSelect(command.id)}
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          bgcolor: "#fff",
          border: `1px dashed ${stroke}`,
          cursor: "grab",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "& svg": {
            display: "block",
            maxWidth: "100%",
          },
          "& text": {
            fontFamily: "monospace !important",
          },
        }}
      >
        <Barcode
          value={command.text.trim() || " "}
          format={command.barcodeType === "1" ? "CODE128" : "CODE39"}
          renderer="svg"
          height={Math.max(24, command.height - (command.humanReadable ? 24 : 8))}
          width={Math.max(1, command.moduleWidth * 0.6)}
          margin={0}
          displayValue={command.humanReadable}
          background="transparent"
          lineColor="#111111"
        />
      </Box>
    </Rnd>
  );
}, (previousProps, nextProps) => {
  return (
    previousProps.selected === nextProps.selected &&
    previousProps.onSelect === nextProps.onSelect &&
    previousProps.onMove === nextProps.onMove &&
    isSamePreviewCommand(previousProps.command, nextProps.command)
  );
});

export const ElementPreview = memo(function ElementPreview({
  commands,
  metadata,
  selectedId,
  zoom = DEFAULT_PREVIEW_ZOOM,
  onSelect,
  onMove,
}: ElementPreviewProps) {
  const effectiveScale = PREVIEW_SCALE * zoom;
  const labelWidthDots = Math.round(metadata.labelWidthMm * DOTS_PER_MM);
  const labelHeightDots = Math.round(metadata.labelHeightMm * DOTS_PER_MM);

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        borderRadius: 0,
        border: "1px solid rgba(0,0,0,0.14)",
        bgcolor: "#fffdfa",
        p: 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: `${Math.round(labelWidthDots * effectiveScale)}px`,
          height: `${Math.round(labelHeightDots * effectiveScale)}px`,
          borderRadius: 0,
          overflow: "hidden",
          bgcolor: "#fffdfa",
          border: "2px solid #1f2522",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${labelWidthDots}px`,
            height: `${labelHeightDots}px`,
            overflow: "hidden",
            bgcolor: "#fffdfa",
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: `${5 * DOTS_PER_MM}px ${5 * DOTS_PER_MM}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
            border: "2px solid #1f2522",
            boxSizing: "border-box",
          }}
        >
          {commands.map((command) => (
            <PreviewItem
              key={command.id}
              command={command}
              selected={selectedId === command.id}
              scale={effectiveScale}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
});