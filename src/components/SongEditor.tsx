import type { DisplayMode, Section } from "../types/song";
import { KEY_OPTIONS } from "../utils/chordUtils";
import SectionEditor from "./SectionEditor";

type SongEditorProps = {
  title: string;
  setTitle: (value: string) => void;
  artist: string;
  setArtist: (value: string) => void;
  songKey: string;
  setSongKey: (value: string) => void;
  bpm: string;
  setBpm: (value: string) => void;
  timeSignature: string;
  setTimeSignature: (value: string) => void;
  displayMode: DisplayMode;
  setDisplayMode: (value: DisplayMode) => void;
  roadmap: string;
  setRoadmap: (value: string) => void;
  sections: Section[];
  onAddSection: () => void;
  onUpdateSection: (id: string, field: keyof Section, value: string) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onExportJson: () => void;
  onDownloadSongFile: () => void;
  onLoadSongFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SongEditor({
  title,
  setTitle,
  artist,
  setArtist,
  songKey,
  setSongKey,
  bpm,
  setBpm,
  timeSignature,
  setTimeSignature,
  displayMode,
  setDisplayMode,
  roadmap,
  setRoadmap,
  sections,
  onAddSection,
  onUpdateSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onExportJson,
  onDownloadSongFile,
  onLoadSongFile,
}: SongEditorProps) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={panelStyle}>
        <h1 style={{ marginTop: 0, marginBottom: 16 }}>Chord Chart Builder</h1>
        <p style={{ marginTop: 0, color: "#4b5563" }}>
          Build structured worship charts with sections, roadmap, notes, and inline Nashville Numbers.
        </p>

        <div style={fieldGridStyle}>
          <label style={labelBlockStyle}>
            <span>Song title</span>
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
            <span>Time signature</span>
            <input style={inputStyle} value={timeSignature} onChange={(e) => setTimeSignature(e.target.value)} />
          </label>

          <label style={labelBlockStyle}>
            <span>Display mode</span>
            <select
              style={inputStyle}
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
            >
              <option value="numbers">Nashville Numbers</option>
              <option value="letters">Chord Letters</option>
            </select>
          </label>
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionHeadingStyle}>Arrangement roadmap</h2>
        <textarea
          style={{ ...textareaStyle, minHeight: 80 }}
          value={roadmap}
          onChange={(e) => setRoadmap(e.target.value)}
        />
        <p style={helpTextStyle}>Example: INTRO V1 CH TURN V1 CHx2 INST BR BR2 CHx2</p>
      </div>

      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={sectionHeadingStyle}>Song sections</h2>
          <button style={primaryButtonStyle} onClick={onAddSection}>
            + Add section
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              index={index}
              totalSections={sections.length}
              onUpdate={onUpdateSection}
              onMove={onMoveSection}
              onDuplicate={onDuplicateSection}
              onDelete={onDeleteSection}
            />
          ))}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionHeadingStyle}>Utilities</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button style={primaryButtonStyle} onClick={onExportJson}>
            Copy song data as JSON
          </button>

          <button style={secondaryButtonStyle} onClick={onDownloadSongFile}>
            Save song file
          </button>

          <label style={fileUploadLabelStyle}>
            Load song file
            <input
              type="file"
              accept=".json,application/json"
              onChange={onLoadSongFile}
              style={{ display: "none" }}
            />
          </label>

          <button style={secondaryButtonStyle} onClick={() => window.print()}>
            Print / Save as PDF
          </button>
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
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 140,
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  fontFamily: "Courier New, monospace",
  resize: "vertical",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const fileUploadLabelStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const sectionHeadingStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const helpTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.5,
};