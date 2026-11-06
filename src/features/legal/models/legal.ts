/** A bullet: plain text, or text that starts with a bold lead-in ("Passengers can see…"). */
export type LegalItem = string | { lead: string; text: string };

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: LegalItem[] };

export interface LegalSection {
  heading: string;
  body: LegalBlock[];
}

/** A page of legal text: each section becomes a numbered heading, and the contents list follows. */
export interface LegalDocument {
  title: string;
  /** e.g. "Last updated 1 Oct 2026". */
  updated?: string;
  intro?: string;
  sections: LegalSection[];
}
