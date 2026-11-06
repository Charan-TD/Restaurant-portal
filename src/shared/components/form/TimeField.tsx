"use client";
import { useId, useState } from "react";
import { Box, ButtonBase, FormHelperText, Popover, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import { tokens } from "@/core/theme/tokens";

const ITEM = 40, // height of one row in a wheel
  ROWS = 5, // rows in view: the middle one is the chosen one
  pad = (n: number) => String(n).padStart(2, "0"),
  HOURS = Array.from({ length: 24 }, (_, i) => i),
  MINUTES = Array.from({ length: 60 }, (_, i) => i);

const split = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return { hour: Math.min(23, h || 0), minute: Math.min(59, m || 0) };
};

/** One scrolling column: it snaps to a row, and the row in the middle is the choice. */
function Wheel({
  label,
  values,
  selected,
  onSelect,
  onEnter,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  onEnter: () => void;
}) {
  const pad2 = (v: number) => pad(v);
  return (
    <Box
      role="listbox"
      aria-label={label}
      tabIndex={0}
      data-wheel
      ref={(el: HTMLElement | null) => {
        // Start with the current value in the middle.
        if (el && el.dataset.ready !== "1") {
          el.dataset.ready = "1";
          el.scrollTop = selected * ITEM;
        }
      }}
      onScroll={(e) => {
        const index = Math.round(e.currentTarget.scrollTop / ITEM);
        if (values[index] !== undefined && values[index] !== selected) onSelect(values[index]);
      }}
      onKeyDown={(e) => {
        const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (e.key === "Enter") return onEnter();
        if (!step) return;
        e.preventDefault();
        const next = Math.min(values.length - 1, Math.max(0, selected + step));
        e.currentTarget.scrollTo({ top: next * ITEM, behavior: "smooth" });
      }}
      sx={{
        width: 64,
        height: ITEM * ROWS,
        overflowY: "auto",
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        outline: 0,
        // The rows above and below fade out.
        maskImage: "linear-gradient(transparent, #000 32%, #000 68%, transparent)",
        WebkitMaskImage: "linear-gradient(transparent, #000 32%, #000 68%, transparent)",
      }}
    >
      <Box sx={{ py: `${ITEM * Math.floor(ROWS / 2)}px` }}>
        {values.map((v) => (
          <Box
            key={v}
            role="option"
            aria-selected={v === selected}
            onClick={(e) =>
              (e.currentTarget.closest("[data-wheel]") as HTMLElement).scrollTo({
                top: v * ITEM,
                behavior: "smooth",
              })
            }
            sx={{
              height: ITEM,
              display: "grid",
              placeItems: "center",
              scrollSnapAlign: "center",
              cursor: "pointer",
              fontSize: v === selected ? 20 : 16,
              fontWeight: v === selected ? 700 : 400,
              color: v === selected ? tokens.color.text : tokens.color.textSubtle,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pad2(v)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * A 24-hour time field like 18:30. It opens a small "Select time" panel with
 * an hour wheel and a minute wheel; Save keeps the choice, Cancel drops it.
 */
export function TimeField({
  label,
  value,
  onChange,
  error,
  compact,
  width,
  placeholder = "Select time",
  title = "Select time",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  compact?: boolean;
  width?: number | string;
  /** Shown in the field until a time is chosen. */
  placeholder?: string;
  /** The heading of the panel. */
  title?: string;
}) {
  const id = useId(),
    [anchor, setAnchor] = useState<HTMLElement | null>(null),
    [draft, setDraft] = useState(split(value)),
    empty = !value,
    saved = split(value),
    close = () => setAnchor(null),
    save = () => {
      onChange(`${pad(draft.hour)}:${pad(draft.minute)}`);
      close();
    };
  return (
    <Box sx={{ minWidth: 0, width: width ?? "100%" }}>
      <ButtonBase
        aria-label={empty ? `${label}, not set` : `${label}, ${pad(saved.hour)}:${pad(saved.minute)}`}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        aria-describedby={error?.trim() ? id : undefined}
        onClick={(e) => {
          // Nothing chosen yet: the wheels start at a sensible hour.
          setDraft(empty ? { hour: 9, minute: 0 } : split(value));
          setAnchor(e.currentTarget);
        }}
        sx={{
          width: "100%",
          height: compact ? 40 : 48,
          px: 1.5,
          gap: 1,
          justifyContent: "flex-start",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: tokens.radius.input,
          bgcolor: tokens.color.card,
          border: `1.5px solid ${error ? tokens.color.error : anchor ? tokens.color.primary : tokens.color.borderInput}`,
        }}
      >
        <AccessTimeOutlined sx={{ fontSize: 18, color: tokens.color.success }} />
        <Box
          component="span"
          sx={{
            flex: 1,
            textAlign: "left",
            letterSpacing: empty ? 0 : "0.5px",
            fontWeight: empty ? 500 : 600,
            color: empty ? tokens.color.textSubtle : tokens.color.text,
          }}
        >
          {empty ? placeholder : `${pad(saved.hour)}:${pad(saved.minute)}`}
        </Box>
        <KeyboardArrowDownRounded sx={{ fontSize: 18, color: tokens.color.textMuted }} />
      </ButtonBase>
      {error?.trim() && (
        <FormHelperText id={id} error sx={{ mx: 0 }}>
          {error}
        </FormHelperText>
      )}
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        slotProps={{
          paper: { sx: { mt: 0.5, p: 2, borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.14)" } },
        }}
      >
        <Typography sx={{ mb: 1, textAlign: "center", fontSize: 14, fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
          {/* The band that marks the row in the middle. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: ITEM,
              mt: `-${ITEM / 2}px`,
              borderRadius: "10px",
              bgcolor: tokens.color.muted,
              pointerEvents: "none",
            }}
          />
          <Wheel
            label={`${label} hour`}
            values={HOURS}
            selected={draft.hour}
            onSelect={(hour) => setDraft((d) => ({ ...d, hour }))}
            onEnter={save}
          />
          <Box component="span" aria-hidden sx={{ position: "relative", fontSize: 20, fontWeight: 700 }}>
            :
          </Box>
          <Wheel
            label={`${label} minute`}
            values={MINUTES}
            selected={draft.minute}
            onSelect={(minute) => setDraft((d) => ({ ...d, minute }))}
            onEnter={save}
          />
        </Box>
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <ButtonBase
            onClick={close}
            sx={{ height: 36, px: 2, borderRadius: "10px", fontSize: 14, fontWeight: 600 }}
          >
            Cancel
          </ButtonBase>
          <ButtonBase
            onClick={save}
            sx={{
              height: 36,
              px: 2.5,
              borderRadius: "10px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              bgcolor: tokens.color.primary,
              "&:hover": { bgcolor: tokens.color.primaryHover },
            }}
          >
            Save
          </ButtonBase>
        </Box>
      </Popover>
    </Box>
  );
}
