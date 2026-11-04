"use client";
import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import type { CategoryNode } from "../models/menuGroups";

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  justifyContent: "flex-start",
  textAlign: "left",
  px: 1.5,
  py: 1.1,
  borderRadius: "10px",
  fontSize: 14,
  color: tokens.color.text,
} as const;

/** The small grey number pill beside a name. */
function Count({ value }: { value: number }) {
  return (
    <Box
      component="span"
      sx={{
        minWidth: 24,
        px: 0.75,
        borderRadius: "999px",
        fontSize: 12,
        lineHeight: "20px",
        textAlign: "center",
        color: tokens.color.textMuted,
        bgcolor: tokens.color.muted,
      }}
    >
      {value}
    </Box>
  );
}

/** A name typed into a box; Enter or Add saves it. */
function NameBox({
  placeholder,
  saving,
  onAdd,
  onCancel,
}: {
  placeholder: string;
  saving: boolean;
  /** Resolves true when saved. */
  onAdd: (name: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const submit = async () => {
    if (!name.trim() || saving) return;
    if (await onAdd(name.trim())) setName("");
  };
  return (
    <Box sx={{ display: "grid", gap: 1, p: 1 }}>
      <CommonTextField
        autoFocus
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
          if (e.key === "Escape") onCancel();
        }}
        slotProps={{ htmlInput: { maxLength: 255, "aria-label": placeholder } }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <CommonButton
          variant="contained"
          disabled={!name.trim() || saving}
          onClick={() => void submit()}
        >
          Add
        </CommonButton>
        <CommonButton variant="text" disabled={saving} onClick={onCancel}>
          Cancel
        </CommonButton>
      </Box>
    </Box>
  );
}

/**
 * The categories on the left of the menu: each with its item count, the open
 * one showing its sub categories. Also holds the recommended categories from
 * TrainDhaba and the way into add-ons.
 */
export function CategoryRail({
  categories,
  selected,
  selectedSub,
  onSelect,
  onSelectSub,
  saving,
  onAdd,
  recommended,
  addingRecommended,
  onAddRecommended,
  addOnsCount,
  addOnsActive,
  onOpenAddOns,
}: {
  categories: CategoryNode[];
  selected: string | null;
  selectedSub: string | null;
  onSelect: (name: string) => void;
  onSelectSub: (name: string | null) => void;
  saving: boolean;
  /** Saves a category, or sub categories under it. Resolves true when saved. */
  onAdd: (category: string, subcategories?: string[]) => Promise<boolean>;
  recommended: { id: string; name: string }[];
  addingRecommended: boolean;
  onAddRecommended: (category: { id: string; name: string }) => Promise<boolean>;
  addOnsCount: number;
  addOnsActive: boolean;
  onOpenAddOns: () => void;
}) {
  const [addingCategory, setAddingCategory] = useState(false),
    [addingSub, setAddingSub] = useState(false);
  return (
    <Box
      component="nav"
      aria-label="Menu categories"
      sx={{
        bgcolor: tokens.color.card,
        borderRight: { md: `1px solid ${tokens.color.border}` },
        p: 2.5,
        minHeight: { md: "calc(100vh - 72px)" },
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Categories</Typography>
      <Box
        sx={{
          width: 32,
          height: 3,
          mt: 0.5,
          mb: 2,
          borderRadius: "2px",
          bgcolor: tokens.color.primary,
        }}
      />
      <Box sx={{ display: "grid", gap: 0.5 }}>
        {categories.map((category) => {
          const open = !addOnsActive && selected === category.name;
          return (
            <Box key={category.name}>
              <ButtonBase
                aria-expanded={open}
                onClick={() => {
                  onSelect(category.name);
                  setAddingSub(false);
                }}
                sx={{
                  ...rowSx,
                  fontWeight: 600,
                  color: open ? tokens.color.primary : tokens.color.text,
                  bgcolor: open ? tokens.color.primarySubtle : "transparent",
                  "&:hover": {
                    bgcolor: open ? tokens.color.primarySubtle : tokens.color.muted,
                  },
                }}
              >
                <Box component="span" sx={{ flex: 1 }}>
                  {category.name}
                </Box>
                <Count value={category.items.length} />
                {open ? (
                  <ExpandMoreOutlined fontSize="small" />
                ) : (
                  <ChevronRight
                    fontSize="small"
                    sx={{ color: tokens.color.textSubtle }}
                  />
                )}
              </ButtonBase>
              {open && (
                <Box sx={{ display: "grid", gap: 0.25, mt: 0.5, pl: 1.5 }}>
                  {[
                    { name: null, label: `All ${category.name.toLowerCase()}`, count: category.items.length },
                    ...category.subs.map((s) => ({
                      name: s.name,
                      label: s.name,
                      count: s.items.length,
                    })),
                  ].map((sub) => {
                    const active = selectedSub === sub.name;
                    return (
                      <ButtonBase
                        key={sub.name ?? "all"}
                        onClick={() => onSelectSub(sub.name)}
                        sx={{
                          ...rowSx,
                          fontWeight: active ? 600 : 400,
                          color: active ? tokens.color.text : tokens.color.textMuted,
                          bgcolor: active ? tokens.color.muted : "transparent",
                          "&:hover": { bgcolor: tokens.color.muted },
                        }}
                      >
                        <Box component="span" sx={{ flex: 1 }}>
                          {sub.label}
                        </Box>
                        <Box
                          component="span"
                          sx={{ fontSize: 13, color: tokens.color.textMuted }}
                        >
                          {sub.count}
                        </Box>
                      </ButtonBase>
                    );
                  })}
                  {addingSub ? (
                    <NameBox
                      placeholder="Sub-category name"
                      saving={saving}
                      onCancel={() => setAddingSub(false)}
                      onAdd={async (name) => {
                        const ok = await onAdd(category.name, [name]);
                        if (ok) setAddingSub(false);
                        return ok;
                      }}
                    />
                  ) : (
                    <ButtonBase
                      onClick={() => setAddingSub(true)}
                      sx={{
                        ...rowSx,
                        gap: 0.75,
                        fontWeight: 600,
                        color: tokens.color.primary,
                      }}
                    >
                      <AddOutlined sx={{ fontSize: 18 }} />
                      Add sub-category
                    </ButtonBase>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      {categories.length === 0 && !addingCategory && (
        <Typography sx={{ fontSize: 14, color: tokens.color.textMuted, mb: 1 }}>
          No categories yet. Add one to start your menu.
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        {addingCategory ? (
          <NameBox
            placeholder="Category name, e.g. Biryani"
            saving={saving}
            onCancel={() => setAddingCategory(false)}
            onAdd={async (name) => {
              const ok = await onAdd(name);
              if (ok) {
                setAddingCategory(false);
                onSelect(name);
              }
              return ok;
            }}
          />
        ) : (
          <ButtonBase
            onClick={() => setAddingCategory(true)}
            sx={{
              ...rowSx,
              justifyContent: "center",
              gap: 0.75,
              py: 1.5,
              fontWeight: 600,
              color: tokens.color.primary,
              border: `1.5px dashed ${tokens.color.dashed}`,
              borderRadius: tokens.radius.input,
            }}
          >
            <AddOutlined sx={{ fontSize: 18 }} />
            Add category
          </ButtonBase>
        )}
      </Box>
      {recommended.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            Recommended categories
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted, mb: 1 }}>
            Suggested by TrainDhaba. Add the ones you sell.
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {recommended.map((category) => (
              <Box
                key={category.id}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                  {category.name}
                </Typography>
                <CommonButton
                  variant="outlined"
                  startIcon={<AddOutlined />}
                  disabled={addingRecommended}
                  onClick={() => void onAddRecommended(category)}
                >
                  Add
                </CommonButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <ButtonBase
          onClick={onOpenAddOns}
          sx={{
            ...rowSx,
            fontWeight: 600,
            color: addOnsActive ? tokens.color.primary : tokens.color.text,
            bgcolor: addOnsActive ? tokens.color.primarySubtle : "transparent",
            "&:hover": { bgcolor: tokens.color.muted },
          }}
        >
          <Box component="span" sx={{ flex: 1 }}>
            Add-ons
          </Box>
          <Count value={addOnsCount} />
        </ButtonBase>
      </Box>
    </Box>
  );
}
