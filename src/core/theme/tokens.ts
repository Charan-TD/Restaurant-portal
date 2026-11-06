/** The TrainDhaba Partner design tokens used by the redesigned screens (Offers, Riders, Profile). */
export const tokens = {
  color: {
    primary: "#c94a00",
    primaryHover: "#a63d00",
    primarySubtle: "#fff4ec",
    primarySubtleBorder: "#f6c9ab",
    text: "#1c1c1c",
    textMuted: "#666666",
    textSubtle: "#8a8a8a",
    link: "#1a56b0",
    page: "#f5f5f5",
    card: "#ffffff",
    muted: "#f2f2f2",
    sunken: "#f7f8fa",
    border: "#e6e6e6",
    borderSubtle: "#f0f0f0",
    borderInput: "#d6d6d6",
    borderStrong: "#1c1c1c",
    dashed: "#b8b8b8",
    success: "#1b7f4b",
    successBg: "#edf7f1",
    errorBg: "#fdecea",
    error: "#b3261e",
    infoBg: "#e8f0fe",
    info: "#1a56b0",
  },
  radius: { badge: "6px", button: "10px", input: "12px", card: "16px" },
  shadow: {
    card: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
  },
} as const;

const t = tokens;

/** A white card: 16px corners, hairline border and the card shadow. */
export const cardSx = {
  bgcolor: t.color.card,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.card,
  boxShadow: t.shadow.card,
} as const;

/** Card heading: 18px bold title over a 14px muted line, divided from the body. */
export const cardHeaderSx = {
  px: 3,
  py: 2.5,
  borderBottom: `1px solid ${t.color.borderSubtle}`,
  "& .title": { fontSize: 18, lineHeight: "24px", fontWeight: 700 },
  "& .subtitle": { fontSize: 14, lineHeight: "20px", color: t.color.textMuted },
} as const;

/**
 * A search box: its border, and the search icon, turn the primary colour on
 * hover and focus, with a soft tint behind it while typing.
 */
export const searchFieldSx = {
  "&& .MuiOutlinedInput-root": {
    "&:hover fieldset": { borderColor: t.color.primary },
    "&.Mui-focused": {
      bgcolor: t.color.primarySubtle,
      boxShadow: `0 0 0 3px ${t.color.primarySubtleBorder}66`,
    },
    "&.Mui-focused fieldset": { borderColor: t.color.primary },
  },
  "& .search-icon": { color: t.color.primary },
} as const;

/**
 * Put on a screen's wrapper so the inputs and buttons inside follow the
 * tokens: 48px inputs with 12px corners and a 1.5px border that turns dark on
 * focus, a 48px primary button, and a 40px outlined one.
 */
export const tokenScopeSx = {
  color: t.color.text,
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    borderRadius: t.radius.input,
    bgcolor: t.color.card,
    "& fieldset": { borderWidth: "1.5px", borderColor: t.color.borderInput },
    "&:hover fieldset": { borderColor: t.color.borderInput },
    "&.Mui-focused fieldset": {
      borderWidth: "1.5px",
      borderColor: t.color.borderStrong,
    },
    "&.Mui-disabled": { bgcolor: t.color.sunken },
  },
  "& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)": {
    transform: "translate(14px, 12px) scale(1)",
  },
  "& .MuiFormHelperText-root": { fontSize: 12, color: t.color.textSubtle },
  "& .MuiButton-contained:not(.Mui-disabled)": {
    bgcolor: t.color.primary,
    color: "#fff",
    minHeight: 48,
    px: 3.5,
    borderRadius: t.radius.input,
    fontSize: 15,
    fontWeight: 600,
    boxShadow: "none",
    "&:hover": { bgcolor: t.color.primaryHover, boxShadow: "none" },
  },
  "& .MuiButton-contained.Mui-disabled": {
    minHeight: 48,
    borderRadius: t.radius.input,
    fontWeight: 600,
  },
  "& .MuiButton-outlined": {
    minHeight: 40,
    borderRadius: t.radius.button,
    borderColor: t.color.borderInput,
    color: t.color.text,
    fontWeight: 600,
    "&:hover": { borderColor: t.color.borderInput, bgcolor: t.color.muted },
  },
  "& .MuiButton-text": {
    minHeight: 48,
    borderRadius: t.radius.input,
    bgcolor: t.color.muted,
    color: t.color.text,
    fontWeight: 600,
    "&:hover": { bgcolor: "#e9e9e9" },
  },
} as const;
