import type { DisplayMode, Section } from "../types/song";
import { isBarLineContent, splitRoadmap } from "../utils/chordUtils";
import { renderInlineLine } from "../utils/parseInlineInput";

type SongPreviewProps = {
  title: string;
  artist: string;
  songKey: string;
  bpm: string;
  timeSignature: string;
  displayMode: DisplayMode;
  roadmap: string;
  sections: Section[];
};

export default function SongPreview({
  title,
  artist,
  songKey,
  bpm,
  timeSignature,
  displayMode,
  roadmap,
  sections,
}: SongPreviewProps) {
  const roadmapItems = splitRoadmap(roadmap);

  return (
    <div style={panelStyle}>
      <div style={previewPaperStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 42 }}>{title}</h1>
            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 18 }}>{artist}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 18, lineHeight: 1.6 }}>
            <div>
              <strong>{bpm}</strong> bpm
            </div>
            <div>
              <strong>{timeSignature}</strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "3px solid #111827" }}>
          <strong>Key:</strong> {songKey}
          <span style={{ marginLeft: 18, color: "#6b7280" }}>
            {displayMode === "numbers" ? "Nashville Number View" : "Chord Letter View"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
          {roadmapItems.map((item, index) => (
            <span key={`${item}-${index}`} style={roadmapChipStyle}>
              {item}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 20,
            alignItems: "start",
          }}
        >
          {sections.map((section) => {
            const lines = section.content.split("\n");

            return (
              <div key={section.id} style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                  {section.title}
                  {section.note && <span style={{ color: "#ef4444", fontWeight: 600 }}> - {section.note}</span>}
                </div>

                <div style={{ display: "grid", gap: 8, fontSize: 18, textAlign: "left", justifyItems: "start" }}>
                  {lines.map((line, index) => (
                    <div
                      key={`${section.id}-${index}`}
                      style={{
                        minHeight: 24,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        fontFamily: isBarLineContent(line) ? "Courier New, monospace" : "Arial, sans-serif",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      {renderInlineLine(line, songKey, displayMode)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const previewPaperStyle: React.CSSProperties = {
  background: "#f9fafb",
  borderRadius: 12,
  padding: 24,
  minHeight: 1000,
};

const roadmapChipStyle: React.CSSProperties = {
  background: "#e5e7eb",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
  fontWeight: 700,
};

const sectionCardStyle: React.CSSProperties = {
  background: "#e5e7eb",
  border: "1px solid #9ca3af",
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  borderRadius: 4,
  padding: 14,
  textAlign: "left",
};

const sectionTitleStyle: React.CSSProperties = {
  marginBottom: 12,
  fontSize: 17,
  fontWeight: 800,
  textAlign: "left",
};