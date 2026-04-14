import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type DisplayMode = "numbers" | "letters";
type SectionType = "INTRO" | "VERSE" | "CHORUS" | "TURN" | "BRIDGE" | "INSTRUMENTAL" | "OUTRO";

type Section = {
  id: string;
  type: SectionType;
  title: string;
  note: string;
  content: string;
};

type Segment = {
  lyric: string;
  chord?: string;
  annotation?: string;
};

type SongData = {
  title: string;
  artist: string;
  key: string;
  bpm: string;
  timeSignature: string;
  displayMode: DisplayMode;
  roadmap: string;
  sections: Section[];
};

type LibrarySong = SongData & {
  libraryId: string;
  savedAt: string;
};

type PrintPage = {
  left: Section[];
  right: Section[];
  isFirstPage: boolean;
};

type DragInsertPosition = "before" | "after" | null;

const AUTOSAVE_KEY = "chord-chart-builder-autosave-v4";
const LIBRARY_KEY = "chord-chart-builder-library-v3";

const PAGE = {
  widthIn: 8.5,
  heightIn: 11,
  marginIn: 0.32,
  columnGapIn: 0.16,
  sectionGapPx: 10,
  firstPageExtraTopPx: 12,
  pxPerIn: 96,
};

const PAGINATION = {
  pageSafetyBufferPx: 8,
  headerFallbackHeightPx: 132,
};

const BRAND = {
  name: "ChordCanvas",
  tagline: "Where Songs Take Shape",
  primary: "#053A63",
  background: "#F4FAFD",
  text: "#111827",
  muted: "#5B6B79",
  border: "#CFE4EF",
  chip: "#E8F6FD",
  panel: "#FFFFFF",
  panelSoft: "#FBFDFF",
  dangerBg: "#FFF1F2",
  dangerBorder: "#FECACA",
  dangerText: "#B91C1C",
};

const KEY_OPTIONS = ["#", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab"];

const SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_SCALE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

function makeId() {
  return Math.random().toString(36).slice(2, 11);
}

function normalizeSections(sections: Section[] | undefined): Section[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => ({
    id: section.id || makeId(),
    type: section.type || "VERSE",
    title: section.title || "VERSE",
    note: section.note || "",
    content: section.content || "",
  }));
}

function getNextDuplicateTitle(currentTitle: string, sections: Section[]) {
  const cleanTitle = currentTitle.trim() || "Untitled Block";
  const baseTitle = cleanTitle.replace(/\s+\d+$/, "").trim() || cleanTitle;
  const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactPattern = new RegExp(`^${escapedBase}(?:\\s+(\\d+))?$`, "i");

  let maxNumber = 1;

  sections.forEach((section) => {
    const match = section.title.trim().match(exactPattern);
    if (!match) return;
    const n = match[1] ? Number(match[1]) : 1;
    if (!Number.isNaN(n)) maxNumber = Math.max(maxNumber, n);
  });

  return `${baseTitle} ${maxNumber + 1}`;
}

function getDefaultSongData(): SongData {
  return {
    title: "",
    artist: "",
    key: "#",
    bpm: "",
    timeSignature: "",
    displayMode: "numbers",
    roadmap: "",
    sections: [],
  };
}

function getTemplateSection(type: SectionType): Section {
  switch (type) {
    case "INTRO":
      return {
        id: makeId(),
        type: "INTRO",
        title: "INTRO",
        note: "Pad, keys, electric",
        content: "| 1 | 4 | 5 | 1 |\n| 1 | 4 | 5 | 1 |",
      };
    case "VERSE":
      return {
        id: makeId(),
        type: "VERSE",
        title: "VERSE",
        note: "",
        content: "Type verse lyrics here\nAdd inline chords like [1], [5], [6m], [1/3]",
      };
    case "CHORUS":
      return {
        id: makeId(),
        type: "CHORUS",
        title: "CHORUS",
        note: "",
        content: "Type chorus lyrics here\nUse [1] and [5] inline with the lyrics",
      };
    case "TURN":
      return {
        id: makeId(),
        type: "TURN",
        title: "TURN",
        note: "",
        content: "| 1 | 5 | 6m | 4 |",
      };
    case "BRIDGE":
      return {
        id: makeId(),
        type: "BRIDGE",
        title: "BRIDGE",
        note: "",
        content: "{BUILD!!} [1/5]Big moment here",
      };
    case "INSTRUMENTAL":
      return {
        id: makeId(),
        type: "INSTRUMENTAL",
        title: "INSTRUMENTAL",
        note: "",
        content: "| 1<> | 3m | 6m | 4 |\n| 1 | 5 | 4 | 4 |",
      };
    case "OUTRO":
      return {
        id: makeId(),
        type: "OUTRO",
        title: "OUTRO",
        note: "",
        content: "| 1 | 5 | 6m | 4 |\nEnd on [1]",
      };
    default:
      return {
        id: makeId(),
        type: "VERSE",
        title: "VERSE",
        note: "",
        content: "Type lyrics here",
      };
  }
}

function getScaleForKey(key: string) {
  if (key === "#") return [];
  const tonic = NOTE_TO_SEMITONE[key];
  const useFlats = key.includes("b");
  const source = useFlats ? FLAT_SCALE : SHARP_SCALE;
  return MAJOR_INTERVALS.map((interval) => source[(tonic + interval) % 12]);
}

function numberToChord(token: string, key: string): string {
  if (key === "#") return token;

  const trimmed = token.trim();
  if (!trimmed) return trimmed;

  const slashParts = trimmed.split("/");
  if (slashParts.length > 1) {
    return slashParts.map((part) => numberToChord(part, key)).join("/");
  }

  const match = trimmed.match(
    /^(b|#)?([1-7])(m|maj7|maj9|sus|sus2|sus4|add9|dim|aug|7|9|11|13|2)?(.*)$/i,
  );
  if (!match) return trimmed;

  const accidental = match[1] || "";
  const degree = Number(match[2]);
  const suffixA = match[3] || "";
  const suffixB = match[4] || "";
  const suffix = `${suffixA}${suffixB}`;

  const scale = getScaleForKey(key);
  const baseNote = scale[degree - 1];
  let semitone = NOTE_TO_SEMITONE[baseNote];

  if (accidental === "b") semitone = (semitone + 11) % 12;
  if (accidental === "#") semitone = (semitone + 1) % 12;

  const useFlats = key.includes("b");
  const source = useFlats ? FLAT_SCALE : SHARP_SCALE;
  return `${source[semitone]}${suffix}`;
}

function parseInlineInput(text: string): Segment[] {
  const tokenRegex = /(\[[^\]]+\]|\{[^}]+\})/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let pendingChord: string | undefined;
  let pendingAnnotation: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      segments.push({
        lyric: before,
        chord: pendingChord,
        annotation: pendingAnnotation,
      });
      pendingChord = undefined;
      pendingAnnotation = undefined;
    }

    const token = match[0];
    if (token.startsWith("[")) {
      pendingChord = token.slice(1, -1).trim();
    } else if (token.startsWith("{")) {
      pendingAnnotation = token.slice(1, -1).trim();
    }

    lastIndex = tokenRegex.lastIndex;
  }

  const after = text.slice(lastIndex);
  if (after || pendingChord || pendingAnnotation) {
    segments.push({
      lyric: after,
      chord: pendingChord,
      annotation: pendingAnnotation,
    });
  }

  return segments;
}

function isBarLineContent(line: string) {
  return line.includes("|");
}

function getChordTextStyle(compact: boolean): React.CSSProperties {
  return {
    fontSize: compact ? 12 : 15,
    fontWeight: 700,
    color: "#1d4ed8",
    fontFamily: "Arial, sans-serif",
    lineHeight: 1,
  };
}

function renderBarLine(line: string, key: string, displayMode: DisplayMode, compact: boolean) {
  const forceNumbersOnly = key === "#";
  const parts = line.split(/(\[[^\]]+\])/g);

  return (
    <span
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "Courier New, monospace",
        display: "inline-block",
        width: "100%",
        textAlign: "left",
      }}
    >
      {parts.map((part, index) => {
        const chordMatch = part.match(/^\[([^\]]+)\]$/);
        if (chordMatch) {
          const token = chordMatch[1].trim();
          const shown =
            forceNumbersOnly ? token : displayMode === "letters" ? numberToChord(token, key) : token;

          return (
            <span key={index} style={getChordTextStyle(compact)}>
              {shown}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

function renderInlineLine(line: string, key: string, displayMode: DisplayMode, compact: boolean) {
  if (isBarLineContent(line)) {
    return renderBarLine(line, key, displayMode, compact);
  }

  const segments = parseInlineInput(line);
  const forceNumbersOnly = key === "#";
  const lineHasTopItems = segments.some((segment) => !!segment.chord || !!segment.annotation);
  const topPad = lineHasTopItems ? (compact ? 18 : 22) : 0;
  const minHeight = lineHasTopItems ? (compact ? 26 : 32) : undefined;

  return (
    <span
      style={{
        display: "inline",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: "left",
      }}
    >
      {segments.map((segment, index) => {
        const shownChord = segment.chord
          ? forceNumbersOnly
            ? segment.chord
            : displayMode === "letters"
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
              wordBreak: "break-word",
              paddingTop: topPad,
              lineHeight: 1.45,
              minHeight,
              verticalAlign: "top",
              textAlign: "left",
            }}
          >
            {(shownChord || segment.annotation) && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "flex",
                  alignItems: "baseline",
                  gap: shownChord && segment.annotation ? 10 : 0,
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {shownChord && <span style={getChordTextStyle(compact)}>{shownChord}</span>}

                {segment.annotation && (
                  <span
                    style={{
                      fontSize: compact ? 11 : 14,
                      fontWeight: 700,
                      color: "#f25f5c",
                      fontStyle: "italic",
                    }}
                  >
                    {segment.annotation}
                  </span>
                )}
              </span>
            )}
            <span>{segment.lyric}</span>
          </span>
        );
      })}
    </span>
  );
}

function splitRoadmap(text: string) {
  return text
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getPageGeometry() {
  const pageWidthPx = PAGE.widthIn * PAGE.pxPerIn;
  const pageHeightPx = PAGE.heightIn * PAGE.pxPerIn;
  const marginPx = PAGE.marginIn * PAGE.pxPerIn;
  const contentWidthPx = pageWidthPx - marginPx * 2;
  const contentHeightPx = pageHeightPx - marginPx * 2;
  const columnWidthPx = (contentWidthPx - PAGE.columnGapIn * PAGE.pxPerIn) / 2;

  return {
    pageWidthPx,
    pageHeightPx,
    marginPx,
    contentWidthPx,
    contentHeightPx,
    columnWidthPx,
  };
}

function estimateWrappedLineRows(line: string, columnWidthPx: number) {
  const usableWidthPx = Math.max(80, columnWidthPx - 28);

  if (!line.trim()) return 1;

  if (isBarLineContent(line)) {
    return Math.max(1, Math.ceil((line.length * 7.3) / usableWidthPx));
  }

  const segments = parseInlineInput(line);
  let approxWidth = 0;

  segments.forEach((segment) => {
    if (segment.chord) approxWidth += Math.max(18, segment.chord.length * 6.6);
    if (segment.annotation) approxWidth += Math.max(26, segment.annotation.length * 6.6);
    if (segment.lyric) approxWidth += segment.lyric.length * 6.9;
  });

  return Math.max(1, Math.ceil(Math.max(approxWidth, 1) / usableWidthPx));
}

function estimateLineHeight(line: string, columnWidthPx: number) {
  const baseLinePx = 13 * 1.45;
  const rows = estimateWrappedLineRows(line, columnWidthPx);
  const parsed = parseInlineInput(line);
  const hasTopItems = parsed.some((segment) => !!segment.chord || !!segment.annotation);
  const topPad = hasTopItems ? 18 : 0;
  const minHeight = hasTopItems ? 26 : 0;
  const contentHeight = rows * baseLinePx;
  return Math.max(minHeight, contentHeight + topPad);
}

function estimateSectionHeight(section: Section, columnWidthPx: number) {
  const lines = section.content.split("\n");
  const verticalPadding = 20;
  const titleHeight = 18;
  const lineGaps = Math.max(0, lines.length - 1) * 4;
  const contentHeight = lines.reduce((sum, line) => sum + estimateLineHeight(line, columnWidthPx), 0);

  return verticalPadding + titleHeight + 8 + contentHeight + lineGaps + 18;
}

function paginateSectionsWithHeights(
  sections: Section[],
  sectionHeights: Record<string, number>,
  headerHeight: number,
  geom: ReturnType<typeof getPageGeometry>,
): PrintPage[] {
  const pages: PrintPage[] = [];
  const firstPageColumnLimit =
    geom.contentHeightPx - headerHeight - PAGE.firstPageExtraTopPx - PAGINATION.pageSafetyBufferPx;
  const laterPageColumnLimit = geom.contentHeightPx - PAGINATION.pageSafetyBufferPx;

  let currentLimit = Math.max(80, firstPageColumnLimit);
  let currentPage: PrintPage = { left: [], right: [], isFirstPage: true };
  let leftHeight = 0;
  let rightHeight = 0;
  let fillingLeft = true;

  function pushCurrentPage() {
    if (currentPage.left.length || currentPage.right.length) {
      pages.push(currentPage);
    }
    currentLimit = Math.max(80, laterPageColumnLimit);
    currentPage = { left: [], right: [], isFirstPage: false };
    leftHeight = 0;
    rightHeight = 0;
    fillingLeft = true;
  }

  function canFit(currentHeight: number, sectionHeight: number) {
    return currentHeight + sectionHeight <= currentLimit;
  }

  for (const section of sections) {
    const measured = sectionHeights[section.id];
    const fallback = estimateSectionHeight(section, geom.columnWidthPx);
    const sectionHeight = (measured || fallback) + PAGE.sectionGapPx;

    if (fillingLeft) {
      if (currentPage.left.length === 0 || canFit(leftHeight, sectionHeight)) {
        currentPage.left.push(section);
        leftHeight += sectionHeight;
        continue;
      }
      fillingLeft = false;
    }

    if (!fillingLeft) {
      if (currentPage.right.length === 0 || canFit(rightHeight, sectionHeight)) {
        currentPage.right.push(section);
        rightHeight += sectionHeight;
        continue;
      }

      pushCurrentPage();
      currentPage.left.push(section);
      leftHeight = sectionHeight;
    }
  }

  if (currentPage.left.length || currentPage.right.length) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [{ left: [], right: [], isFirstPage: true }];
}

type HeaderBlockProps = {
  title: string;
  artist: string;
  bpm: string;
  timeSignature: string;
  songKey: string;
  roadmapItems: string[];
  printMode?: boolean;
};

function HeaderBlock({
  title,
  artist,
  bpm,
  timeSignature,
  songKey,
  roadmapItems,
  printMode = false,
}: HeaderBlockProps) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              color: "#000000",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              textAlign: "left",
            }}
          >
            {title}
          </h1>
          <div
            style={{
              marginTop: 8,
              color: BRAND.muted,
              fontSize: 14,
              textAlign: "left",
            }}
          >
            {artist}
          </div>
        </div>

        <div style={{ textAlign: "right", fontSize: 14, lineHeight: 1.6 }}>
          <div>
            <strong>{bpm}</strong> bpm
          </div>
          <div>
            <strong>{timeSignature}</strong>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "3px solid #111827",
          textAlign: "left",
          fontSize: 13,
        }}
      >
        <strong>Key:</strong> {songKey}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {roadmapItems.map((item, index) => (
          <span key={`${item}-${index}`} style={printMode ? roadmapChipPrintStyle : roadmapChipStyle}>
            {item}
          </span>
        ))}
      </div>
    </>
  );
}

type SectionCardProps = {
  section: Section;
  songKey: string;
  effectiveDisplayMode: DisplayMode;
  compact?: boolean;
  printMode?: boolean;
};

function SectionCard({
  section,
  songKey,
  effectiveDisplayMode,
  compact = true,
  printMode = false,
}: SectionCardProps) {
  const lines = section.content.split("\n");
  const cardStyle = printMode ? printSectionCardStyle : sectionCardStyle;

  return (
    <div
      className={printMode ? "print-section-wrap-dom" : "section-wrap"}
      style={{
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <div
        className={printMode ? "print-section-card-dom" : undefined}
        style={{
          ...cardStyle,
          padding: compact ? 10 : 14,
        }}
      >
        <div
          style={{
            marginBottom: compact ? 8 : 12,
            fontSize: compact ? 13 : 17,
            fontWeight: 800,
            textAlign: "left",
          }}
        >
          {section.title}
          {section.note && (
            <>
              <span style={{ color: "#111827", fontWeight: 700 }}> - </span>
              <span style={{ color: "#f25f5c", fontWeight: 700 }}>{section.note}</span>
            </>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: compact ? 4 : 8,
            fontSize: compact ? 13 : 18,
            textAlign: "left",
            justifyItems: "start",
          }}
        >
          {lines.map((line, index) => (
            <div
              key={`${section.id}-${index}`}
              className={printMode ? "print-line-dom" : undefined}
              style={{
                minHeight: compact ? 16 : 24,
                whiteSpace: "pre-wrap",
                lineHeight: 1.45,
                fontFamily: isBarLineContent(line) ? "Courier New, monospace" : "Arial, sans-serif",
                textAlign: "left",
                width: "100%",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                breakInside: "avoid",
                pageBreakInside: "avoid",
                position: "relative",
              }}
            >
              {renderInlineLine(line, songKey, effectiveDisplayMode, compact)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type PageSectionsProps = {
  page: PrintPage;
  songKey: string;
  effectiveDisplayMode: DisplayMode;
  printMode?: boolean;
};

function PageSections({ page, songKey, effectiveDisplayMode, printMode = false }: PageSectionsProps) {
  return (
    <div
      className={printMode ? "print-sections-dom" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: `${PAGE.columnGapIn}in`,
        alignItems: "start",
      }}
    >
      <div className={printMode ? "print-column-dom" : "print-column"} style={{ display: "grid", gap: PAGE.sectionGapPx }}>
        {page.left.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            songKey={songKey}
            effectiveDisplayMode={effectiveDisplayMode}
            compact
            printMode={printMode}
          />
        ))}
      </div>

      <div className={printMode ? "print-column-dom" : "print-column"} style={{ display: "grid", gap: PAGE.sectionGapPx }}>
        {page.right.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            songKey={songKey}
            effectiveDisplayMode={effectiveDisplayMode}
            compact
            printMode={printMode}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [songKey, setSongKey] = useState("#");
  const [bpm, setBpm] = useState("");
  const [timeSignature, setTimeSignature] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("numbers");
  const [roadmap, setRoadmap] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState("Not saved yet");
  const [songLibrary, setSongLibrary] = useState<LibrarySong[]>([]);
  const [libraryFilter, setLibraryFilter] = useState("");
  const [previewScale, setPreviewScale] = useState(0.75);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragInsertPosition, setDragInsertPosition] = useState<DragInsertPosition>(null);
  const [focusSectionTitleId, setFocusSectionTitleId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState<number>(PAGINATION.headerFallbackHeightPx);
  const [measuredSectionHeights, setMeasuredSectionHeights] = useState<Record<string, number>>({});

  const editorColumnRef = useRef<HTMLDivElement | null>(null);
  const sectionTitleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const measureHeaderRef = useRef<HTMLDivElement | null>(null);
  const measureSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const effectiveDisplayMode: DisplayMode = songKey === "#" ? "numbers" : displayMode;
  const geom = useMemo(() => getPageGeometry(), []);
  const roadmapItems = useMemo(() => splitRoadmap(roadmap), [roadmap]);

  useEffect(() => {
    const fontHref = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap";
    const existing = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).find((el) =>
      (el as HTMLLinkElement).href.includes("family=Fredoka"),
    ) as HTMLLinkElement | undefined;

    if (!existing) {
      const preconnectA = document.createElement("link");
      preconnectA.rel = "preconnect";
      preconnectA.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnectA);

      const preconnectB = document.createElement("link");
      preconnectB.rel = "preconnect";
      preconnectB.href = "https://fonts.gstatic.com";
      preconnectB.crossOrigin = "anonymous";
      document.head.appendChild(preconnectB);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontHref;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    function handleAfterPrint() {
      setIsPrinting(false);
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useEffect(() => {
    if (!isPrinting) return;
    const timeout = window.setTimeout(() => {
      window.print();
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [isPrinting]);

  useEffect(() => {
    try {
      const rawLibrary = localStorage.getItem(LIBRARY_KEY);
      if (rawLibrary) {
        const parsedLibrary = JSON.parse(rawLibrary);
        if (Array.isArray(parsedLibrary)) {
          setSongLibrary(
            parsedLibrary.map((song) => ({
              libraryId: song.libraryId || makeId(),
              title: song.title || "Untitled Song",
              artist: song.artist || "",
              key: song.key || "#",
              bpm: song.bpm || "",
              timeSignature: song.timeSignature || "4/4",
              displayMode: song.displayMode || "numbers",
              roadmap: song.roadmap || "",
              sections: normalizeSections(song.sections),
              savedAt: song.savedAt || new Date().toISOString(),
            })),
          );
        }
      }
    } catch (error) {
      console.error("Failed to load song library:", error);
    }

    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SongData;
        setTitle(parsed.title ?? "");
        setArtist(parsed.artist ?? "");
        setSongKey(parsed.key ?? "#");
        setBpm(parsed.bpm ?? "");
        setTimeSignature(parsed.timeSignature ?? "");
        setDisplayMode(parsed.displayMode ?? "numbers");
        setRoadmap(parsed.roadmap ?? "");
        setSections(normalizeSections(parsed.sections));
        setAutosaveStatus("Loaded autosaved chart");
        return;
      }
    } catch (error) {
      console.error("Failed to load autosave:", error);
    }

    const defaults = getDefaultSongData();
    setTitle(defaults.title);
    setArtist(defaults.artist);
    setSongKey(defaults.key);
    setBpm(defaults.bpm);
    setTimeSignature(defaults.timeSignature);
    setDisplayMode(defaults.displayMode);
    setRoadmap(defaults.roadmap);
    setSections(defaults.sections);
  }, []);

  useEffect(() => {
    const payload: SongData = {
      title,
      artist,
      key: songKey,
      bpm,
      timeSignature,
      displayMode: effectiveDisplayMode,
      roadmap,
      sections,
    };

    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      setAutosaveStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Failed to autosave:", error);
      setAutosaveStatus("Autosave failed");
    }
  }, [title, artist, songKey, bpm, timeSignature, effectiveDisplayMode, roadmap, sections]);

  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(songLibrary));
    } catch (error) {
      console.error("Failed to save song library:", error);
    }
  }, [songLibrary]);

  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const previewPane = target.closest(".preview-column");
      if (!previewPane) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      event.preventDefault();

      const delta = event.deltaY > 0 ? -0.03 : 0.03;
      setPreviewScale((current) => {
        const next = current + delta;
        return Math.min(1.1, Math.max(0.55, Number(next.toFixed(2))));
      });
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!focusSectionTitleId) return;

    const input = sectionTitleInputRefs.current[focusSectionTitleId];
    if (!input) return;

    const timeout = window.setTimeout(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
      input.select();
      setFocusSectionTitleId(null);
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [focusSectionTitleId, sections]);

  useLayoutEffect(() => {
    function measureNow() {
      const nextHeaderHeight = measureHeaderRef.current?.getBoundingClientRect().height;
      if (nextHeaderHeight && Number.isFinite(nextHeaderHeight)) {
        setMeasuredHeaderHeight(Math.ceil(nextHeaderHeight));
      }

      const nextSectionHeights: Record<string, number> = {};
      sections.forEach((section) => {
        const el = measureSectionRefs.current[section.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.height) {
          nextSectionHeights[section.id] = Math.ceil(rect.height);
        }
      });

      setMeasuredSectionHeights((current) => {
        const currentKeys = Object.keys(current);
        const nextKeys = Object.keys(nextSectionHeights);
        if (currentKeys.length === nextKeys.length) {
          let same = true;
          for (const key of nextKeys) {
            if (current[key] !== nextSectionHeights[key]) {
              same = false;
              break;
            }
          }
          if (same) return current;
        }
        return nextSectionHeights;
      });
    }

    const rafA = window.requestAnimationFrame(measureNow);
    const rafB = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measureNow);
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, [sections, title, artist, bpm, timeSignature, songKey, roadmapItems.length, roadmap, effectiveDisplayMode]);

  const documentPages = useMemo(() => {
    return paginateSectionsWithHeights(sections, measuredSectionHeights, measuredHeaderHeight, geom);
  }, [sections, measuredSectionHeights, measuredHeaderHeight, geom]);

  const scaledPaperWidth = Math.ceil(geom.pageWidthPx * previewScale);
  const scaledPaperHeight = Math.ceil(geom.pageHeightPx * previewScale);

  const filteredLibrary = useMemo(() => {
    const q = libraryFilter.trim().toLowerCase();
    if (!q) return songLibrary;

    return songLibrary.filter((song) => {
      const haystack = `${song.title} ${song.artist} ${song.key}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [songLibrary, libraryFilter]);

  function getCurrentSongData(): SongData {
    return {
      title,
      artist,
      key: songKey,
      bpm,
      timeSignature,
      displayMode: effectiveDisplayMode,
      roadmap,
      sections,
    };
  }

  function loadSongIntoEditor(song: SongData) {
    setTitle(song.title ?? "");
    setArtist(song.artist ?? "");
    setSongKey(song.key ?? "#");
    setBpm(song.bpm ?? "");
    setTimeSignature(song.timeSignature ?? "");
    setDisplayMode(song.displayMode ?? "numbers");
    setRoadmap(song.roadmap ?? "");
    setSections(normalizeSections(song.sections));
    setCollapsedSections({});
    setAutosaveStatus("Loaded song into editor");
  }

  function updateSection(id: string, field: keyof Section, value: string) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, [field]: value } : section)),
    );
  }

  function addSection() {
    const newSection = getTemplateSection("VERSE");
    setSections((current) => [...current, newSection]);
    setCollapsedSections((current) => ({ ...current, [newSection.id]: false }));
    setFocusSectionTitleId(newSection.id);
  }

 function duplicateSection(id: string) {
  const section = sections.find((item) => item.id === id);
  if (!section) return;

  const duplicated = {
    ...section,
    id: makeId(),
    title: getNextDuplicateTitle(section.title, sections),
  };

  setSections((current) => [...current, duplicated]);
  setCollapsedSections((current) => ({
    ...current,
    [duplicated.id]: true,
  }));
  setFocusSectionTitleId(null);
}

  function removeSection(id: string) {
    setSections((current) => current.filter((section) => section.id !== id));
    setCollapsedSections((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
  }

  function toggleSectionCollapsed(id: string) {
    setCollapsedSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function autoScrollEditor(clientY: number) {
    const el = editorColumnRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const threshold = 80;
    const speed = 18;

    if (clientY < rect.top + threshold) {
      el.scrollTop -= speed;
    } else if (clientY > rect.bottom - threshold) {
      el.scrollTop += speed;
    }
  }

  function reorderSections(draggedId: string, targetId: string, position: Exclude<DragInsertPosition, null>) {
    if (draggedId === targetId) return;

    setSections((current) => {
      const draggedIndex = current.findIndex((section) => section.id === draggedId);
      const targetIndex = current.findIndex((section) => section.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return current;

      const next = [...current];
      const [draggedItem] = next.splice(draggedIndex, 1);

      const adjustedTargetIndex = next.findIndex((section) => section.id === targetId);
      if (adjustedTargetIndex === -1) return current;

      const insertIndex = position === "before" ? adjustedTargetIndex : adjustedTargetIndex + 1;
      next.splice(insertIndex, 0, draggedItem);

      return next;
    });
  }

  function createNewSong() {
    const blank: SongData = {
      title: "",
      artist: "",
      key: "#",
      bpm: "",
      timeSignature: "",
      displayMode: "numbers",
      roadmap: "",
      sections: [],
    };
    loadSongIntoEditor(blank);
  }

  function saveCurrentSongToLibrary() {
    const current = getCurrentSongData();
    const savedSong: LibrarySong = {
      libraryId: makeId(),
      savedAt: new Date().toISOString(),
      ...current,
      sections: current.sections.map((section) => ({ ...section, id: makeId() })),
    };

    setSongLibrary((currentLibrary) => [savedSong, ...currentLibrary]);
    setAutosaveStatus("Saved current song to library");
  }

  function loadLibrarySong(libraryId: string) {
    const song = songLibrary.find((item) => item.libraryId === libraryId);
    if (!song) return;
    loadSongIntoEditor(song);
  }

  function duplicateLibrarySong(libraryId: string) {
    const song = songLibrary.find((item) => item.libraryId === libraryId);
    if (!song) return;

    const duplicate: LibrarySong = {
      ...song,
      libraryId: makeId(),
      title: `${song.title} Copy`,
      savedAt: new Date().toISOString(),
      sections: song.sections.map((section) => ({ ...section, id: makeId() })),
    };

    setSongLibrary((currentLibrary) => [duplicate, ...currentLibrary]);
  }

  function deleteLibrarySong(libraryId: string) {
    setSongLibrary((currentLibrary) => currentLibrary.filter((song) => song.libraryId !== libraryId));
  }

  function handlePrint() {
    setIsPrinting(true);
  }

  return (
    <div
      className={`app-shell ${isPrinting ? "printing" : ""}`}
      style={{
        height: "100vh",
        overflow: "hidden",
        background: BRAND.background,
        color: BRAND.text,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @page {
          size: letter portrait;
          margin: ${PAGE.marginIn}in;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .print-root,
          .print-root * {
            visibility: visible;
          }

          .print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }

          .screen-root {
            display: none !important;
          }

          .print-page-dom {
            display: block !important;
            width: 100%;
            box-sizing: border-box;
            break-after: page;
            page-break-after: always;
            break-inside: avoid-page;
            page-break-inside: avoid;
            margin: 0;
            padding: 0;
          }

          .print-page-dom:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .print-paper-dom {
            width: ${PAGE.widthIn}in !important;
            height: ${PAGE.heightIn}in !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          .print-sections-dom {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: ${PAGE.columnGapIn}in !important;
            align-items: start !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          .print-column-dom {
            display: grid !important;
            gap: ${PAGE.sectionGapPx}px !important;
            align-content: start !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          .print-section-wrap-dom,
          .print-section-card-dom,
          .print-line-dom {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-section-card-dom {
            display: block !important;
            width: 100% !important;
            box-shadow: none !important;
          }

          .print-line-dom {
            position: relative !important;
          }

          .print-line-dom span {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -20000,
          top: 0,
          width: geom.pageWidthPx,
          pointerEvents: "none",
          opacity: 0,
          zIndex: -1,
        }}
      >
        <div
          style={{
            width: geom.contentWidthPx,
            padding: 0,
            margin: 0,
          }}
        >
          <div ref={measureHeaderRef}>
            <HeaderBlock
              title={title}
              artist={artist}
              bpm={bpm}
              timeSignature={timeSignature}
              songKey={songKey}
              roadmapItems={roadmapItems}
            />
          </div>

          <div
            style={{
              marginTop: PAGE.firstPageExtraTopPx,
              width: geom.columnWidthPx,
              display: "grid",
              gap: PAGE.sectionGapPx,
            }}
          >
            {sections.map((section) => (
              <div
                key={`measure-${section.id}`}
                ref={(el) => {
                  measureSectionRefs.current[section.id] = el;
                }}
                style={{ width: geom.columnWidthPx }}
              >
                <SectionCard
                  section={section}
                  songKey={songKey}
                  effectiveDisplayMode={effectiveDisplayMode}
                  compact
                  printMode
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="screen-root" style={{ height: "100%" }}>
        <div
          style={{
            maxWidth: 1680,
            height: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "460px minmax(0, 1fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div
            ref={editorColumnRef}
            className="editor-column"
            style={{
              display: "grid",
              gap: 20,
              overflowY: "auto",
              minHeight: 0,
              paddingBottom: 8,
            }}
            onDragOver={(e) => {
              if (draggingSectionId) {
                e.preventDefault();
                autoScrollEditor(e.clientY);
              }
            }}
          >
            <div style={{ ...panelStyle, paddingTop: 12 }}>
              <div style={panelAccentLineStyle} />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 18,
                  marginTop: 4,
                  marginBottom: 18,
                }}
              >
                <img
                  src="/chordcanvas_icon_1024.png"
                  alt="ChordCanvas logo"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 36,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      color: "#171933",
                      fontFamily:
                        '"Fredoka", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {BRAND.name}
                  </h1>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 18,
                      lineHeight: 1.2,
                      color: "#72758A",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {BRAND.tagline}
                  </p>
                </div>
              </div>

              <div style={fieldGridStyle}>
                <label style={labelBlockStyle}>
                  <span>Song Title</span>
                  <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>

                <label style={labelBlockStyle}>
                  <span>Artist</span>
                  <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} />
                </label>

                <label style={labelBlockStyle}>
                  <span>Key</span>
                  <select style={inputStyle} value={songKey} onChange={(e) => setSongKey(e.target.value)}>
                    {KEY_OPTIONS.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelBlockStyle}>
                  <span>BPM</span>
                  <input style={inputStyle} value={bpm} onChange={(e) => setBpm(e.target.value)} />
                </label>

                <label style={labelBlockStyle}>
                  <span>Time Signature</span>
                  <input style={inputStyle} value={timeSignature} onChange={(e) => setTimeSignature(e.target.value)} />
                </label>

                <label style={labelBlockStyle}>
                  <span>Display Mode</span>
                  <select
                    style={inputStyle}
                    value={effectiveDisplayMode}
                    onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
                    disabled={songKey === "#"}
                  >
                    <option value="numbers">Numbers</option>
                    <option value="letters">Letters</option>
                  </select>
                </label>
              </div>

              {songKey === "#" && (
                <p style={{ ...helpTextStyle, marginTop: 12 }}>
                  “#” key mode shows Nashville Numbers only.
                </p>
              )}

              <div style={{ marginTop: 14, fontSize: 13, color: BRAND.muted, fontWeight: 600 }}>
                {autosaveStatus}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelAccentLineStyle} />
              <h2 style={sectionHeadingStyle}>Song Library</h2>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button style={primaryButtonStyle} onClick={saveCurrentSongToLibrary}>
                  Save to Library
                </button>
                <button style={secondaryButtonStyle} onClick={createNewSong}>
                  New Song
                </button>
              </div>

              <input
                style={inputStyle}
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                placeholder="Search library..."
              />

              <div style={{ display: "grid", gap: 10, marginTop: 14, maxHeight: 320, overflowY: "auto" }}>
                {filteredLibrary.length === 0 && (
                  <div style={{ color: BRAND.muted, fontSize: 14 }}>
                    Your canvas library is empty. Start shaping your first song.
                  </div>
                )}

                {filteredLibrary.map((song) => (
                  <div key={song.libraryId} style={libraryCardStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{song.title}</div>
                      <div style={{ fontSize: 13, color: BRAND.muted }}>
                        {song.artist || "No artist"} • Key {song.key} • Saved {formatSavedAt(song.savedAt)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <button style={secondaryButtonStyleSmall} onClick={() => loadLibrarySong(song.libraryId)}>
                        Load
                      </button>
                      <button style={secondaryButtonStyleSmall} onClick={() => duplicateLibrarySong(song.libraryId)}>
                        Duplicate
                      </button>
                      <button style={dangerButtonStyleSmall} onClick={() => deleteLibrarySong(song.libraryId)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelAccentLineStyle} />
              <h2 style={sectionHeadingStyle}>Song Flow</h2>
              <textarea
                style={{ ...textareaStyle, minHeight: 80 }}
                value={roadmap}
                onChange={(e) => setRoadmap(e.target.value)}
              />
              <p style={helpTextStyle}>Example: INTRO V1 CH TURN V1 CHx2 INST BR BR2 CHx2</p>
            </div>

            <div style={panelStyle}>
              <div style={panelAccentLineStyle} />
              <h2 style={sectionHeadingStyle}>Song Blocks</h2>
              <p style={{ ...helpTextStyle, marginTop: 0, marginBottom: 12 }}>
                Drag and drop blocks to reorder them.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {sections.map((section, index) => {
                  const isCollapsed = !!collapsedSections[section.id];
                  const isDragging = draggingSectionId === section.id;
                  const wrapperDropBeforeActive =
                    dragOverSectionId === section.id && dragInsertPosition === "before";
                  const wrapperDropAfterActive =
                    dragOverSectionId === section.id && dragInsertPosition === "after";

                  return (
                    <div
                      key={section.id}
                      onDragOver={(e) => {
                        if (!draggingSectionId) return;
                        e.preventDefault();
                        autoScrollEditor(e.clientY);

                        const rect = e.currentTarget.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        const nextPosition: Exclude<DragInsertPosition, null> =
                          e.clientY < midpoint ? "before" : "after";

                        setDragOverSectionId(section.id);
                        setDragInsertPosition(nextPosition);
                      }}
                      onDrop={(e) => {
                        if (!draggingSectionId || !dragInsertPosition) return;
                        e.preventDefault();

                        const draggedId = e.dataTransfer.getData("text/plain") || draggingSectionId;
                        if (draggedId) {
                          reorderSections(draggedId, section.id, dragInsertPosition);
                        }

                        setDraggingSectionId(null);
                        setDragOverSectionId(null);
                        setDragInsertPosition(null);
                      }}
                      style={{
                        display: "grid",
                        gap: 6,
                        paddingTop: wrapperDropBeforeActive ? 10 : 0,
                        paddingBottom: wrapperDropAfterActive ? 10 : 0,
                        position: "relative",
                        transition: "padding 120ms ease",
                      }}
                    >
                      {wrapperDropBeforeActive && <div style={{ ...dropIndicatorStyle, top: 0 }} />}

                      <div
                        style={{
                          ...editorCardStyle,
                          opacity: isDragging ? 0.6 : 1,
                          borderColor: dragOverSectionId === section.id ? BRAND.primary : BRAND.border,
                          boxShadow:
                            dragOverSectionId === section.id
                              ? `0 0 0 2px rgba(5,58,99,0.10), 0 6px 18px rgba(5,58,99,0.08)`
                              : "0 2px 8px rgba(3, 43, 74, 0.03)",
                          transition:
                            "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease",
                        }}
                      >
                        <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 0,
    }}
  >
    <span
      draggable
      onDragStart={(e) => {
        setDraggingSectionId(section.id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", section.id);
      }}
      onDragEnd={() => {
        setDraggingSectionId(null);
        setDragOverSectionId(null);
        setDragInsertPosition(null);
      }}
      style={{
        fontSize: 16,
        color: BRAND.muted,
        userSelect: "none",
        cursor: "grab",
        padding: "2px 4px",
        borderRadius: 6,
      }}
      title="Drag to reorder"
    >
      ⋮⋮
    </span>

    <div
      style={{
        fontWeight: 700,
        fontSize: 15,
        color: BRAND.text,
        minWidth: 0,
      }}
    >
      {section.title || "Untitled Block"}
    </div>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <button
      type="button"
      style={secondaryButtonStyleSmall}
      onClick={() => duplicateSection(section.id)}
    >
      Duplicate
    </button>

    <button
      type="button"
      style={secondaryButtonStyleSmall}
      onClick={() => toggleSectionCollapsed(section.id)}
    >
      {isCollapsed ? "Expand" : "Collapse"}
    </button>
  </div>
</div>

                        {!isCollapsed && (
                          <>
                            <label style={labelBlockStyle}>
                              <span>Title</span>
                              <input
                                ref={(el) => {
                                  sectionTitleInputRefs.current[section.id] = el;
                                }}
                                style={inputStyle}
                                value={section.title}
                                onChange={(e) => updateSection(section.id, "title", e.target.value)}
                              />
                            </label>

                            <label style={labelBlockStyle}>
                              <span>Note</span>
                              <input
                                style={inputStyle}
                                value={section.note}
                                onChange={(e) => updateSection(section.id, "note", e.target.value)}
                                placeholder="Pad, keys, electric"
                              />
                            </label>

                            <label style={labelBlockStyle}>
                              <span>Content</span>
                              <textarea
                                style={textareaStyle}
                                value={section.content}
                                onChange={(e) => updateSection(section.id, "content", e.target.value)}
                              />
                            </label>

                            <p style={helpTextStyle}>
                              Use inline chord tags like [1], [5], [6m], [1/3] and dynamic notes like {"{BUILD!!}"}.
                            </p>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
  <button style={dangerButtonStyle} onClick={() => removeSection(section.id)}>
    Delete
  </button>
</div>
                          </>
                        )}
                      </div>

                      {wrapperDropAfterActive && <div style={{ ...dropIndicatorStyle, bottom: 0 }} />}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16 }}>
                <button style={primaryButtonStyle} onClick={addSection}>
                  + Add block
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button className="floating-print-button" style={secondaryButtonStyle} onClick={handlePrint}>
                Print View
              </button>
            </div>
          </div>

          <div
            className="preview-column"
            style={{
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
              paddingRight: 4,
            }}
          >
            <div
              className="preview-panel"
              style={{
                ...panelStyle,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div style={panelAccentLineStyle} />
              <div
                className="screen-preview-toolbar"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 13,
                  color: BRAND.muted,
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 2,
                  paddingBottom: 6,
                  flex: "0 0 auto",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: BRAND.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Live Canvas
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Zoom: {Math.round(previewScale * 100)}%</span>
                  <button
                    style={secondaryButtonStyleSmall}
                    onClick={() => setPreviewScale((s) => Math.max(0.55, Number((s - 0.05).toFixed(2))))}
                  >
                    -
                  </button>
                  <button
                    style={secondaryButtonStyleSmall}
                    onClick={() => setPreviewScale((s) => Math.min(1.1, Number((s + 0.05).toFixed(2))))}
                  >
                    +
                  </button>
                  <button style={secondaryButtonStyleSmall} onClick={() => setPreviewScale(0.75)}>
                    Reset Zoom
                  </button>
                </div>
              </div>

              <div
                className="preview-scroll-wrap"
                style={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <div
                  className="preview-scroll-content"
                  style={{
                    display: "inline-block",
                    minWidth: "100%",
                    width: Math.max(scaledPaperWidth, 1),
                  }}
                >
                  <div
                    className="document-pages"
                    style={{
                      display: "grid",
                      gap: 24,
                      justifyContent: "start",
                      alignContent: "start",
                      width: "max-content",
                      minWidth: scaledPaperWidth,
                    }}
                  >
                    {documentPages.map((page, pageIndex) => (
                      <div
                        key={pageIndex}
                        className="screen-page-shell"
                        style={{
                          width: scaledPaperWidth,
                          height: scaledPaperHeight,
                          overflow: "hidden",
                          display: "block",
                        }}
                      >
                        <div
                          className="preview-paper"
                          style={{
                            ...previewPaperStyle,
                            width: `${PAGE.widthIn}in`,
                            height: `${PAGE.heightIn}in`,
                            padding: `${PAGE.marginIn}in`,
                            transform: `scale(${previewScale})`,
                            transformOrigin: "top left",
                            overflow: "hidden",
                          }}
                        >
                          {page.isFirstPage && (
                            <HeaderBlock
                              title={title}
                              artist={artist}
                              bpm={bpm}
                              timeSignature={timeSignature}
                              songKey={songKey}
                              roadmapItems={roadmapItems}
                            />
                          )}

                          <div style={{ marginTop: page.isFirstPage ? PAGE.firstPageExtraTopPx : 0 }}>
                            <PageSections page={page} songKey={songKey} effectiveDisplayMode={effectiveDisplayMode} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="print-root" style={{ display: "none" }}>
        {documentPages.map((page, pageIndex) => (
          <div key={`print-${pageIndex}`} className="print-page-dom">
            <div
              className="print-paper-dom"
              style={{
                ...printPaperStyle,
                width: `${PAGE.widthIn}in`,
                height: `${PAGE.heightIn}in`,
                padding: `${PAGE.marginIn}in`,
                overflow: "hidden",
              }}
            >
              {page.isFirstPage && (
                <HeaderBlock
                  title={title}
                  artist={artist}
                  bpm={bpm}
                  timeSignature={timeSignature}
                  songKey={songKey}
                  roadmapItems={roadmapItems}
                  printMode
                />
              )}

              <div style={{ marginTop: page.isFirstPage ? PAGE.firstPageExtraTopPx : 0 }}>
                <PageSections
                  page={page}
                  songKey={songKey}
                  effectiveDisplayMode={effectiveDisplayMode}
                  printMode
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top left, rgba(102,217,255,0.08), transparent 28%), radial-gradient(circle at bottom right, rgba(242,180,131,0.07), transparent 28%)",
        }}
      />
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: "relative",
  background: BRAND.panel,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 6px 20px rgba(3, 43, 74, 0.08)",
  border: `1px solid ${BRAND.border}`,
};

const previewPaperStyle: React.CSSProperties = {
  background: "#f9fafb",
  borderRadius: 12,
  boxSizing: "border-box",
  margin: "0",
};

const printPaperStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 0,
  padding: 0,
  width: "100%",
  minHeight: "auto",
  boxSizing: "border-box",
  margin: "0",
};

const fieldGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const labelBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${BRAND.border}`,
  fontSize: 14,
  color: "#000000",
  background: "#ffffff",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 140,
  padding: "12px",
  borderRadius: 12,
  border: `1px solid ${BRAND.border}`,
  fontSize: 14,
  fontFamily: "Courier New, monospace",
  resize: "vertical",
  background: "#ffffff",
  color: "#000000",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  background: BRAND.primary,
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(5,58,99,0.18)",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${BRAND.border}`,
  background: "white",
  color: BRAND.text,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyleSmall: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: `1px solid ${BRAND.border}`,
  background: "white",
  color: BRAND.text,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 12,
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${BRAND.dangerBorder}`,
  background: BRAND.dangerBg,
  color: BRAND.dangerText,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyleSmall: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: `1px solid ${BRAND.dangerBorder}`,
  background: BRAND.dangerBg,
  color: BRAND.dangerText,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12,
};

const sectionHeadingStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  color: BRAND.text,
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

const helpTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: BRAND.muted,
  fontSize: 13,
  lineHeight: 1.5,
};

const editorCardStyle: React.CSSProperties = {
  border: `1px solid ${BRAND.border}`,
  borderRadius: 16,
  padding: 14,
  display: "grid",
  gap: 12,
  background: BRAND.panelSoft,
  boxShadow: "0 2px 8px rgba(3, 43, 74, 0.03)",
};

const libraryCardStyle: React.CSSProperties = {
  border: `1px solid ${BRAND.border}`,
  borderRadius: 14,
  padding: 12,
  background: BRAND.panelSoft,
  boxShadow: "0 2px 8px rgba(3, 43, 74, 0.03)",
};

const roadmapChipStyle: React.CSSProperties = {
  background: BRAND.chip,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 700,
  color: BRAND.primary,
  border: `1px solid rgba(5,58,99,0.10)`,
};

const roadmapChipPrintStyle: React.CSSProperties = {
  background: BRAND.chip,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 700,
  color: BRAND.primary,
  border: `1px solid rgba(5,58,99,0.10)`,
  boxShadow: "none",
};

const sectionCardStyle: React.CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  borderRadius: 4,
  padding: 14,
  textAlign: "left",
  breakInside: "avoid",
  pageBreakInside: "avoid",
  marginBottom: 0,
  display: "block",
  width: "100%",
  boxSizing: "border-box",
};

const printSectionCardStyle: React.CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  boxShadow: "none",
  borderRadius: 4,
  padding: 14,
  textAlign: "left",
  breakInside: "avoid",
  pageBreakInside: "avoid",
  marginBottom: 0,
  display: "block",
  width: "100%",
  boxSizing: "border-box",
};

const dropIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  height: 4,
  borderRadius: 999,
  background: BRAND.primary,
  boxShadow: "0 0 0 4px rgba(102,217,255,0.18)",
  transition: "all 120ms ease",
};

const panelAccentLineStyle: React.CSSProperties = {
  height: 2,
  borderRadius: 999,
  background: BRAND.primary,
  marginBottom: 14,
};