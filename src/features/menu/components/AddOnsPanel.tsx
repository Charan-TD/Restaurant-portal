import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import ExtensionOutlined from "@mui/icons-material/ExtensionOutlined";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { formatRupees } from "@/shared/utils/format";
import type { CategoryOption } from "../services/menuItemApi";
import {
  ADDON_IMAGE_MAX_BYTES,
  ADDON_IMAGE_TYPES,
  type AddOnForm,
  type RestaurantAddOn,
} from "../services/addOnApi";
import { MenuItemThumb } from "./MenuItemThumb";
import { InfoCell, rowSx } from "./InfoCell";

const squareButton = {
  width: 40,
  height: 40,
  borderRadius: "10px",
  bgcolor: "#f3f4f2",
  color: "text.secondary",
} as const;

interface Props {
  addOns: RestaurantAddOn[];
  categories: CategoryOption[];
  saving: boolean;
  /** `previous` null creates one. Resolves true when saved. */
  onSave: (
    previous: RestaurantAddOn | null,
    form: AddOnForm,
  ) => Promise<boolean>;
  onDelete: (addOn: RestaurantAddOn) => Promise<boolean>;
}

/** Dialog state: a new add-on, or the one being edited. */
type Editing = { addOn: RestaurantAddOn | null } | null;

function AddOnDialog({
  addOn,
  categories,
  saving,
  onClose,
  onSave,
}: {
  addOn: RestaurantAddOn | null;
  categories: CategoryOption[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: AddOnForm) => void;
}) {
  const [name, setName] = useState(addOn?.name ?? ""),
    [categoryId, setCategoryId] = useState(addOn?.categoryId ?? ""),
    [price, setPrice] = useState(addOn ? String(addOn.price) : ""),
    [image, setImage] = useState<File | null>(null),
    [imageError, setImageError] = useState(""),
    // The picked file, else the saved picture.
    preview = useMemo(
      () => (image ? URL.createObjectURL(image) : (addOn?.imageUrl ?? "")),
      [image, addOn],
    ),
    amount = Number(price),
    priceOk = price.trim() !== "" && Number.isInteger(amount) && amount >= 0,
    nameOk = name.trim().length > 0 && name.trim().length <= 100;
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(preview);
    },
    [image, preview],
  );
  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ADDON_IMAGE_TYPES.includes(file.type))
      return setImageError("Choose a JPG, PNG or WEBP picture.");
    if (file.size > ADDON_IMAGE_MAX_BYTES)
      return setImageError("The picture must be smaller than 2 MB.");
    setImageError("");
    setImage(file);
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{addOn ? "Edit add-on" : "Add an add-on"}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            role="img"
            aria-label="Add-on picture"
            sx={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              color: "text.secondary",
              bgcolor: "#f3f4f2",
              backgroundSize: "cover",
              backgroundPosition: "center",
              ...(preview && { backgroundImage: `url("${preview}")` }),
            }}
          >
            {!preview && <AddPhotoAlternateOutlined />}
          </Box>
          <Box>
            <CommonButton component="label" variant="outlined" size="small">
              {preview ? "Change picture" : "Add picture"}
              <input
                hidden
                type="file"
                aria-label="Add-on picture"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </CommonButton>
            <Typography
              variant="caption"
              color={imageError ? "error" : "text.secondary"}
              sx={{ display: "block", mt: 0.5 }}
            >
              {imageError || "Optional. JPG, PNG or WEBP, up to 2 MB."}
            </Typography>
          </Box>
        </Box>
        <CommonTextField
          label="Add-on name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <CommonTextField
          select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          helperText="The food category this add-on goes with."
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </CommonTextField>
        <CommonTextField
          label="Price (₹)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={price !== "" && !priceOk}
          placeholder="e.g. 30"
          helperText={
            price === "" || priceOk
              ? "Use 0 for a free add-on."
              : "Enter a whole number, 0 or more."
          }
        />
      </DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose} disabled={saving}>
          Cancel
        </CommonButton>
        <CommonButton
          variant="contained"
          disabled={!nameOk || !priceOk || !categoryId || saving}
          onClick={() =>
            onSave({ name: name.trim(), categoryId, price: amount, image })
          }
        >
          {saving ? "Saving…" : "Save"}
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
}

/** The restaurant's add-ons, one row each, like the live orders list. */
export function AddOnsPanel({
  addOns,
  categories,
  saving,
  onSave,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState<Editing>(null),
    [deleting, setDeleting] = useState<RestaurantAddOn | null>(null);
  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <CommonButton
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setEditing({ addOn: null })}
        >
          Add add-on
        </CommonButton>
      </Box>
      {addOns.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 6,
            textAlign: "center",
          }}
        >
          <ExtensionOutlined color="disabled" sx={{ fontSize: 48 }} />
          <Typography variant="h6">No add-ons yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
            Add-ons are extras customers can add to a dish, like extra raita or
            a cold drink.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
          {addOns.map((addOn) => (
            <Box
              key={addOn.id}
              sx={rowSx("minmax(160px, 1fr) minmax(120px, 1fr) 120px auto")}
            >
              <InfoCell
                first
                strong
                value={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <MenuItemThumb
                      images={addOn.imageUrl ? [addOn.imageUrl] : []}
                      name={addOn.name}
                      size={48}
                    />
                    {addOn.name}
                  </Box>
                }
              />
              <InfoCell
                value={
                  categories.find((c) => c.id === addOn.categoryId)?.name ||
                  addOn.categoryId ||
                  "–"
                }
                caption="Category"
              />
              <InfoCell
                strong
                value={addOn.price ? formatRupees(addOn.price) : "Free"}
                caption="Price"
              />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Tooltip title="Edit">
                  <IconButton
                    aria-label={`Edit ${addOn.name}`}
                    sx={squareButton}
                    onClick={() => setEditing({ addOn })}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    aria-label={`Delete ${addOn.name}`}
                    sx={squareButton}
                    onClick={() => setDeleting(addOn)}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {editing && (
        <AddOnDialog
          addOn={editing.addOn}
          categories={categories}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={(form) =>
            void onSave(editing.addOn, form).then(
              (ok) => ok && setEditing(null),
            )
          }
        />
      )}
      <Dialog
        open={!!deleting}
        onClose={saving ? undefined : () => setDeleting(null)}
      >
        <DialogTitle>Delete {deleting?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Customers will no longer be offered this add-on.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <CommonButton onClick={() => setDeleting(null)} disabled={saving}>
            Cancel
          </CommonButton>
          <CommonButton
            color="error"
            variant="contained"
            disabled={saving}
            onClick={() =>
              deleting &&
              void onDelete(deleting).then((ok) => ok && setDeleting(null))
            }
          >
            {saving ? "Deleting…" : "Delete"}
          </CommonButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
