import { useState } from "react";
import { Box, Collapse, IconButton, Tooltip, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import type { CategoryNode } from "../models/menuGroups";

/** A text box with an Add button, used for new categories and sub categories. */
function AddRow({
  placeholder,
  label,
  saving,
  onAdd,
  onCancel,
}: {
  placeholder: string;
  label: string;
  saving: boolean;
  /** Resolves true when saved, which clears the box. */
  onAdd: (name: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const submit = async () => {
    if (!name.trim() || saving) return;
    if (await onAdd(name.trim())) setName("");
  };
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
      <CommonTextField
        size="small"
        placeholder={placeholder}
        value={name}
        autoFocus={!!onCancel}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
        slotProps={{ htmlInput: { maxLength: 255, "aria-label": label } }}
        sx={{
          "& fieldset": { borderStyle: "dashed" },
        }}
      />
      <CommonButton
        variant="contained"
        disabled={!name.trim() || saving}
        onClick={() => void submit()}
        sx={{ minWidth: 80, height: 40 }}
      >
        Add
      </CommonButton>
      {onCancel && (
        <CommonButton
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={saving}
          sx={{ height: 40 }}
        >
          Cancel
        </CommonButton>
      )}
    </Box>
  );
}

/**
 * Categories as a list; tapping one opens its sub categories (with how many
 * items each holds) and a box to add another.
 */
export function CategoriesPanel({
  categories,
  saving,
  onView,
  onAdd,
}: {
  categories: CategoryNode[];
  saving: boolean;
  onView: (name: string) => void;
  /** Saves a category, or sub categories under it. Resolves true when saved. */
  onAdd: (category: string, subcategories?: string[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState<string | null>(null),
    [adding, setAdding] = useState(false);
  return (
    <Box sx={{ mt: 1 }}>
      {categories.length === 0 && !adding && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 5,
            textAlign: "center",
          }}
        >
          <CategoryOutlined color="disabled" sx={{ fontSize: 48 }} />
          <Typography variant="h6">No categories yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
            Add a category, then the sub categories you sell under it.
          </Typography>
        </Box>
      )}
      {categories.map((category) => {
        const isOpen = open === category.name,
          caption = category.subs.length
            ? `${category.subs.length} ${category.subs.length === 1 ? "sub-category" : "sub-categories"}`
            : `${category.items.length} ${category.items.length === 1 ? "item" : "items"}`;
        return (
          <Box
            key={category.name}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: "14px",
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow:
                "0 1px 2px rgba(16, 24, 40, 0.06), 0 6px 16px rgba(16, 24, 40, 0.07)",
              transition: "box-shadow .2s ease",
              "&:hover": {
                boxShadow:
                  "0 2px 4px rgba(16, 24, 40, 0.08), 0 12px 26px rgba(16, 24, 40, 0.12)",
              },
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : category.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(isOpen ? null : category.name);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                cursor: "pointer",
                px: 0.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 20 }} noWrap>
                  {category.name}
                </Typography>
                <Typography color="text.secondary">{caption}</Typography>
              </Box>
              <Tooltip
                title={isOpen ? "Hide sub categories" : "Show sub categories"}
              >
                <IconButton
                  tabIndex={-1}
                  aria-label={
                    isOpen ? "Hide sub categories" : "Show sub categories"
                  }
                  sx={{
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                  }}
                >
                  <ExpandMoreOutlined />
                </IconButton>
              </Tooltip>
            </Box>
            <Collapse in={isOpen} unmountOnExit>
              <Box
                sx={{
                  mt: 1.5,
                  ml: 1,
                  pl: 2.5,
                  borderLeft: 3,
                  borderColor: "#f6dccd",
                  display: "grid",
                  gap: 1.75,
                }}
              >
                {category.subs.map((sub) => (
                  <Box
                    key={sub.name}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 18 }}>
                      {sub.name}{" "}
                      <Typography
                        component="span"
                        color="text.secondary"
                        sx={{ fontSize: 15 }}
                      >
                        · {sub.items.length}
                      </Typography>
                    </Typography>
                  </Box>
                ))}
                <AddRow
                  placeholder="+ Add sub-category"
                  label={`Add a sub-category to ${category.name}`}
                  saving={saving}
                  onAdd={(name) => onAdd(category.name, [name])}
                />
                {category.items.length > 0 && (
                  <Box>
                    <CommonButton
                      variant="outlined"
                      onClick={() => onView(category.name)}
                    >
                      View {category.items.length}{" "}
                      {category.items.length === 1 ? "item" : "items"}
                    </CommonButton>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}
      <Box sx={{ mt: 2 }}>
        {adding ? (
          <AddRow
            placeholder="Category name, e.g. Biryani"
            label="New category name"
            saving={saving}
            onCancel={() => setAdding(false)}
            onAdd={async (name) => {
              const ok = await onAdd(name);
              if (ok) {
                setAdding(false);
                setOpen(name);
              }
              return ok;
            }}
          />
        ) : (
          <CommonButton
            fullWidth
            variant="outlined"
            startIcon={<AddOutlined />}
            onClick={() => setAdding(true)}
            sx={{ height: 52, fontWeight: 700 }}
          >
            Add category
          </CommonButton>
        )}
      </Box>
    </Box>
  );
}
