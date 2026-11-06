"use client";
import { useState } from "react";
import { Box, ButtonBase, Popover, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import { tokens } from "@/core/theme/tokens";
import { CommonTextField } from "@/shared/components/form/CommonTextField";

export interface RecommendedCategory {
  id: string;
  name: string;
  /** This restaurant already has it. */
  added: boolean;
}

/**
 * The "Recommended" button above the menu: opens the categories TrainDhaba
 * suggests, each with a tick when the restaurant has it and a + to add it.
 */
export function RecommendedMenu({
  categories,
  busy,
  onAdd,
}: {
  categories: RecommendedCategory[];
  busy: boolean;
  onAdd: (category: { id: string; name: string }) => Promise<boolean>;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null),
    [query, setQuery] = useState(""),
    added = categories.filter((c) => c.added).length,
    shown = categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  if (categories.length === 0) return null;
  return (
    <>
      <ButtonBase
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          gap: 1,
          height: 44,
          px: 1.75,
          fontSize: 14,
          borderRadius: tokens.radius.input,
          bgcolor: tokens.color.card,
          border: `1.5px solid ${anchor ? tokens.color.primary : tokens.color.borderInput}`,
        }}
      >
        <StarRounded sx={{ fontSize: 18, color: "#f5a524" }} />
        Recommended
        <Box
          component="span"
          sx={{ px: 0.75, borderRadius: "999px", fontSize: 12, lineHeight: "20px", color: "#9a6700", bgcolor: "#fff4d6" }}
        >
          {added}
        </Box>
        <ExpandMoreOutlined sx={{ fontSize: 18, color: tokens.color.textMuted }} />
      </ButtonBase>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null);
          setQuery("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1, width: 320, p: 2, borderRadius: "14px" } } }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Add to Recommended</Typography>
        <Typography sx={{ mb: 1.5, fontSize: 12, color: tokens.color.textMuted }}>
          Suggested by TrainDhaba · {added} of {categories.length} added
        </Typography>
        <CommonTextField
          placeholder="Search categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputPrefix={<SearchOutlined fontSize="small" />}
          slotProps={{ htmlInput: { "aria-label": "Search categories" } }}
        />
        <Box sx={{ mt: 1, maxHeight: 280, overflowY: "auto", display: "grid", gap: 0.25 }}>
          {shown.length === 0 && (
            <Typography sx={{ py: 2, textAlign: "center", fontSize: 13, color: tokens.color.textMuted }}>
              No categories match
            </Typography>
          )}
          {shown.map((c) => (
            <Box
              key={c.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: "10px",
                bgcolor: c.added ? tokens.color.primarySubtle : "transparent",
              }}
            >
              <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                {c.name}
              </Typography>
              {c.added ? (
                <Box
                  aria-label={`${c.name} added`}
                  sx={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "50%", color: "#fff", bgcolor: tokens.color.success }}
                >
                  <CheckOutlined sx={{ fontSize: 18 }} />
                </Box>
              ) : (
                <ButtonBase
                  aria-label={`Add ${c.name}`}
                  disabled={busy}
                  onClick={() => void onAdd(c)}
                  sx={{ width: 28, height: 28, borderRadius: "50%", color: tokens.color.primary, border: `1.5px solid ${tokens.color.primary}` }}
                >
                  <AddOutlined sx={{ fontSize: 18 }} />
                </ButtonBase>
              )}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
