"use client";
import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { cardSx, tokens } from "@/core/theme/tokens";

const overline = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
} as const;

/** One figure of the top row; `highlight` colours the card green (earnings, settled). */
export function StatCard({
  label,
  value,
  note,
  noteColor,
  href,
  highlight,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  noteColor?: string;
  /** Where "View details" goes; no link when left out. */
  href?: string;
  highlight?: boolean;
}) {
  return (
    <Box
      sx={{
        ...cardSx,
        p: 2.25,
        minWidth: 0,
        ...(highlight && { bgcolor: tokens.color.successBg, borderColor: "#cfe8da" }),
      }}
    >
      <Typography sx={overline}>{label}</Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 26,
          lineHeight: "34px",
          fontWeight: 700,
          color: highlight ? tokens.color.success : tokens.color.text,
        }}
      >
        {value}
      </Typography>
      {note && (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: noteColor ? 600 : 400,
            color: noteColor ?? tokens.color.textMuted,
          }}
        >
          {note}
        </Typography>
      )}
      {href && (
        <ButtonBase
          component={Link}
          href={href}
          sx={{
            mt: 1.25,
            pt: 1,
            width: "100%",
            justifyContent: "flex-start",
            gap: 0.25,
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.primary,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          View details <ChevronRightRounded sx={{ fontSize: 16 }} />
        </ButtonBase>
      )}
    </Box>
  );
}

/** A white card with a bold title. */
export function Card({
  title,
  subtitle,
  action,
  children,
  flush,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** No padding around the body (a table that runs edge to edge). */
  flush?: boolean;
}) {
  return (
    <Box sx={{ ...cardSx, p: 0, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 3, pb: flush ? 2 : 1.5 }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      <Box sx={flush ? undefined : { px: 3, pb: 3 }}>{children}</Box>
    </Box>
  );
}

export const DownloadButton = () => (
  <ButtonBase
    sx={{
      height: 36,
      px: 2,
      fontSize: 13,
      fontWeight: 600,
      borderRadius: "10px",
      border: `1px solid ${tokens.color.borderInput}`,
      bgcolor: tokens.color.card,
    }}
  >
    Download
  </ButtonBase>
);

/** A "label … amount" line of the settlement card. */
export function SumRow({
  label,
  value,
  tone,
  strong,
  line,
}: {
  label: string;
  value: string;
  tone?: "muted" | "error" | "success";
  strong?: boolean;
  /** A rule above the row. */
  line?: boolean;
}) {
  const color =
    tone === "error"
      ? tokens.color.error
      : tone === "success"
        ? tokens.color.success
        : tone === "muted"
          ? tokens.color.textMuted
          : tokens.color.text;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        fontSize: 14,
        fontWeight: strong ? 700 : 400,
        color,
        borderTop: line ? `1px solid ${tokens.color.border}` : 0,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </Box>
  );
}

/** A table that scrolls sideways on a narrow screen. */
export function TableScroll({ children, min = 720 }: { children: ReactNode; min?: number }) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: min }}>{children}</Box>
    </Box>
  );
}

/** One row of the earnings tables: the first cell is left, the rest right-aligned. */
export function TableRow({
  cells,
  columns,
  head,
  foot,
  onClick,
  selected,
}: {
  cells: ReactNode[];
  columns: string;
  head?: boolean;
  foot?: boolean;
  /** Makes the row a button (an order opens its side panel). */
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Box
      {...(onClick && {
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      })}
      sx={{
        ...(onClick && {
          cursor: "pointer",
          "&:hover": { bgcolor: tokens.color.sunken },
          ...(selected && {
            boxShadow: `inset 3px 0 0 ${tokens.color.primary}`,
            bgcolor: tokens.color.primarySubtle,
            "&:hover": { bgcolor: tokens.color.primarySubtle },
          }),
        }),
        display: "grid",
        gridTemplateColumns: columns,
        alignItems: "center",
        gap: 1,
        px: 3,
        py: head ? 1.25 : 1.5,
        fontSize: head ? 11 : 14,
        fontWeight: head || foot ? 700 : 400,
        letterSpacing: head ? "0.4px" : 0,
        color: head ? tokens.color.textMuted : tokens.color.text,
        bgcolor: head || foot ? tokens.color.page : "transparent",
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
        "& > :not(:first-of-type)": { textAlign: "right" },
      }}
    >
      {cells.map((cell, i) => (
        <Box key={i} sx={{ minWidth: 0 }}>
          {cell}
        </Box>
      ))}
    </Box>
  );
}
