export type DisplayMode = "numbers" | "letters";

export type SectionType =
  | "INTRO"
  | "VERSE"
  | "CHORUS"
  | "TURN"
  | "BRIDGE"
  | "INSTRUMENTAL"
  | "OUTRO";

export type Section = {
  id: string;
  type: SectionType;
  title: string;
  note: string;
  content: string;
};

export const SECTION_TYPES: SectionType[] = [
  "INTRO",
  "VERSE",
  "CHORUS",
  "TURN",
  "BRIDGE",
  "INSTRUMENTAL",
  "OUTRO",
];