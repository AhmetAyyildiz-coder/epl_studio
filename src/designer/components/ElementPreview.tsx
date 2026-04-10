import { memo, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { Rnd } from "react-rnd";
import { DOTS_PER_MM, LABEL_HEIGHT_DOTS, LABEL_WIDTH_DOTS } from "../constants";
import { generateCode39Bars } from "../utils";
import type { PreviewCommand } from "../types";

type ElementPreviewProps = {
  commands: PreviewCommand[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

type PreviewItemProps = {
  command: PreviewCommand;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

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
    return previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height && previous.text === next.text && previous.humanReadable === next.humanReadable;
  }

  return false;
}

const PreviewItem = memo(function PreviewItem({ command, selected, onSelect, onMove }: PreviewItemProps) {
  const stroke = selected ? "#bf360c" : "rgba(0,77,64,0.22)";
  const fill = selected ? "rgba(191,54,12,0.08)" : "rgba(0,77,64,0.04)";
  const barcodeBars = useMemo(() => (command.type === "barcode" ? generateCode39Bars(command.text, 2, 4) : []), [command]);

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
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={() => onSelect(command.id)}
        onDragStop={(_, data) => {
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
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={() => onSelect(command.id)}
        onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
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
            px: 1,
            bgcolor: "#111",
            color: "#fff",
            border: `1px ${selected ? "dashed" : "solid"} ${selected ? "#bf360c" : "#111"}`,
            cursor: "grab",
            userSelect: "none",
            fontFamily: "monospace",
            fontSize: `${command.fontSize}px`,
            lineHeight: 1,
            textAlign: "center",
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
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={() => onSelect(command.id)}
        onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
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
        bounds="parent"
        enableResizing={false}
        dragGrid={[1, 1]}
        onDragStart={() => onSelect(command.id)}
        onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
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
      bounds="parent"
      enableResizing={false}
      dragGrid={[1, 1]}
      onDragStart={() => onSelect(command.id)}
      onDragStop={(_, data) => onMove(command.id, data.x, data.y)}
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
        }}
      >
        {barcodeBars.map((bar) => (
          <Box
            key={`${command.id}-${bar.x}-${bar.width}`}
            sx={{
              position: "absolute",
              left: bar.x,
              top: 8,
              width: bar.width,
              height: command.height - (command.humanReadable ? 28 : 16),
              bgcolor: "#111",
            }}
          />
        ))}
        {command.humanReadable ? (
          <Typography
            sx={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 4,
              fontFamily: "monospace",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            {command.text}
          </Typography>
        ) : null}
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
  selectedId,
  onSelect,
  onMove,
}: ElementPreviewProps) {
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
          width: `${LABEL_WIDTH_DOTS}px`,
          height: `${LABEL_HEIGHT_DOTS}px`,
          borderRadius: 0,
          overflow: "hidden",
          bgcolor: "#fffdfa",
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: `${5 * DOTS_PER_MM}px ${5 * DOTS_PER_MM}px`,
          border: "2px solid #1f2522",
        }}
      >
        {commands.map((command) => (
          <PreviewItem
            key={command.id}
            command={command}
            selected={selectedId === command.id}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
      </Box>
    </Box>
  );
});