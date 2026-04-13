import type { Section } from "../types/song";
import { SECTION_TYPES } from "../types/song";

type SectionEditorProps = {
  section: Section;
  index: number;
  totalSections: number;
  onUpdate: (id: string, field: keyof Section, value: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function SectionEditor({
  section,
  index,
  totalSections,
  onUpdate,
  onMove,
  onDuplicate,
  onDelete,
}: SectionEditorProps) {
  return (
    <div style={editorCardStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={labelBlockStyle}>
          <span>Section type</span>
          <select
            style={inputStyle}
            value={section.type}
            onChange={(e) => onUpdate(section.id, "type", e.target.value)}
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label style={labelBlockStyle}>
          <span>Visible title</span>
          <input
            style={inputStyle}
            value={section.title}
            onChange={(e) => onUpdate(section.id, "title", e.target.value)}
          />
        </label>
      </div>

      <label style={labelBlockStyle}>
        <span>Note</span>
        <input
          style={inputStyle}
          value={section.note}
          onChange={(e) => onUpdate(section.id, "note", e.target.value)}
          placeholder="Pad, keys, electric"
        />
      </label>

      <label style={labelBlockStyle}>
        <span>Content</span>
        <textarea
          style={textareaStyle}
          value={section.content}
          onChange={(e) => onUpdate(section.id, "content", e.target.value)}
        />
      </label>

      <p style={helpTextStyle}>
        Use inline chord tags like [1], [5], [6m], [1/3]. For instrumental bars, type lines like | 4
        | 5 | 4 | 5 |.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button style={secondaryButtonStyle} onClick={() => onMove(section.id, "up")} disabled={index === 0}>
          Move up
        </button>
        <button
          style={secondaryButtonStyle}
          onClick={() => onMove(section.id, "down")}
          disabled={index === totalSections - 1}
        >
          Move down
        </button>
        <button style={secondaryButtonStyle} onClick={() => onDuplicate(section.id)}>
          Duplicate
        </button>
        <button style={dangerButtonStyle} onClick={() => onDelete(section.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};

const helpTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.5,
};

const editorCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 12,
  background: "#fcfcfd",
};