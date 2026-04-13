const SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_SCALE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export const KEY_OPTIONS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];

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

export function getScaleForKey(key: string) {
  const tonic = NOTE_TO_SEMITONE[key];
  const useFlats = key.includes("b");
  const source = useFlats ? FLAT_SCALE : SHARP_SCALE;
  return MAJOR_INTERVALS.map((interval) => source[(tonic + interval) % 12]);
}

export function numberToChord(token: string, key: string): string {
  const trimmed = token.trim();
  if (!trimmed) return trimmed;

  const slashParts = trimmed.split("/");
  if (slashParts.length > 1) {
    return slashParts.map((part) => numberToChord(part, key)).join("/");
  }

  const match = trimmed.match(
    /^(b|#)?([1-7])(m|maj7|maj9|sus|sus2|sus4|add9|dim|aug|7|9|11|13|2)?(.*)$/i
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

export function splitRoadmap(text: string) {
  return text
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isBarLineContent(line: string) {
  return line.includes("|");
}

export function makeId() {
  return Math.random().toString(36).slice(2, 9);
}