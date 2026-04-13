import type { DisplayMode } from "../types/song";
import { numberToChord } from "./chordUtils";

export type Segment = {
  lyric: string;
  chord?: string;
};

export function parseInlineInput(text: string): Segment[] {
  const regex = /\[([^\]]+)\]/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let pendingChord: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      segments.push({ lyric: before, chord: pendingChord });
      pendingChord = undefined;
    }
    pendingChord = match[1].trim();
    lastIndex = regex.lastIndex;
  }

  const after = text.slice(lastIndex);
  if (after || pendingChord) {
    segments.push({ lyric: after, chord: pendingChord });
  }

  return segments;
}

export function renderInlineLine(line: string, key: string, displayMode: DisplayMode) {
  const segments = parseInlineInput(line);

  return segments.map((segment, index) => {
    const shownChord = segment.chord
      ? displayMode === "letters"
        ? numberToChord(segment.chord, key)
        : segment.chord
      : undefined;

    return (
      <span
        key={`${line}-${index}`}
        style={{
          position: "relative",
          display: "inline-block",
          whiteSpace: "pre-wrap",
          paddingTop: shownChord ? 22 : 0,
          lineHeight: 1.5,
          minHeight: shownChord ? 32 : undefined,
        }}
      >
        {shownChord && (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "#1d4ed8",
              whiteSpace: "nowrap",
            }}
          >
            {shownChord}
          </span>
        )}
        <span>{segment.lyric}</span>
      </span>
    );
  });
}