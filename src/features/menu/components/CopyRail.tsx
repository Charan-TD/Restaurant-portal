"use client";
import { useRef, useState, type ReactNode } from "react";
import { Box, ButtonBase, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import CheckBoxOutlineBlankRounded from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import CheckBoxRounded from "@mui/icons-material/CheckBoxRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import { tokens } from "@/core/theme/tokens";

export interface CopyCard {
  key: string;
  title: string;
  summary: string;
  usedIn: number;
  checked: boolean;
  onToggle: () => void;
}

/**
 * "Copy from other items": cards in one row that scrolls sideways. The
 * scrollbar is hidden on purpose (the design has none); a mouse drags the row,
 * a trackpad or touch screen swipes it, and the cards snap into place.
 */
export function CopyRail({ label, cards }: { label: string; cards: CopyCard[] }) {
  const ref = useRef<HTMLDivElement>(null),
    drag = useRef({ x: 0, left: 0, moved: false, active: false });
  if (!cards.length) return null;
  return (
    <Box sx={{ mt: 2, minWidth: 0, maxWidth: "100%" }}>
      <Typography sx={{ mb: 1, fontSize: 12, color: tokens.color.textMuted }}>{label}</Typography>
      <Box
        ref={ref}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          drag.current = { x: e.clientX, left: ref.current?.scrollLeft ?? 0, moved: false, active: true };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.active || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          ref.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => (drag.current.active = false)}
        onPointerLeave={() => (drag.current.active = false)}
        // A drag that ends on a card must not also tick it.
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        sx={{
          display: "flex",
          gap: 1.25,
          overflowX: "auto",
          pb: 0.5,
          scrollSnapType: "x proximity",
          overscrollBehaviorX: "contain",
          cursor: "grab",
          userSelect: "none",
          // No visible scrollbar, in every browser.
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {cards.map((c) => (
          <ButtonBase
            key={c.key}
            onClick={c.onToggle}
            aria-pressed={c.checked}
            aria-label={`Copy ${c.title}: ${c.summary}`}
            sx={{
              flex: "0 0 150px",
              scrollSnapAlign: "start",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              textAlign: "left",
              gap: 0.5,
              p: 1.25,
              minHeight: 92,
              borderRadius: tokens.radius.input,
              border: `1.5px solid ${c.checked ? tokens.color.success : tokens.color.border}`,
              bgcolor: c.checked ? tokens.color.successBg : tokens.color.card,
            }}
          >
            <Box sx={{ display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between", gap: 0.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{c.title}</Typography>
              {c.checked ? (
                <CheckBoxRounded sx={{ fontSize: 20, color: tokens.color.success }} />
              ) : (
                <CheckBoxOutlineBlankRounded sx={{ fontSize: 20, color: tokens.color.textMuted }} />
              )}
            </Box>
            <Typography sx={{ fontSize: 11, color: tokens.color.textMuted, lineHeight: 1.35 }}>
              {c.summary}
            </Typography>
            <Typography sx={{ mt: "auto", fontSize: 10, color: tokens.color.textMuted }}>
              Used in {c.usedIn} {c.usedIn === 1 ? "item" : "items"}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

/** The dish's own set: a green tick, a title, what it holds and a ⋯ menu. */
export function SetCard({
  title,
  summary,
  actions,
  children,
}: {
  title: string;
  summary: string;
  actions: { label: string; onClick: () => void }[];
  children?: ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.5,
        borderRadius: tokens.radius.input,
        border: `1px solid ${tokens.color.border}`,
        bgcolor: tokens.color.card,
      }}
    >
      <CheckCircleRounded sx={{ color: tokens.color.success }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{summary}</Typography>
        {children}
      </Box>
      <IconButton aria-label={`${title} options`} size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizRounded fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {actions.map((a) => (
          <MenuItem
            key={a.label}
            onClick={() => {
              setAnchor(null);
              a.onClick();
            }}
          >
            {a.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
