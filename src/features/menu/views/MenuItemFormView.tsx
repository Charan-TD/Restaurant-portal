"use client";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type UseFormSetValue,
} from "react-hook-form";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormHelperText,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import EnergySavingsLeafOutlined from "@mui/icons-material/EnergySavingsLeafOutlined";
import EggOutlined from "@mui/icons-material/EggOutlined";
import SetMealOutlined from "@mui/icons-material/SetMealOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import {
  ITEM_IMAGE_TYPES,
  menuFoodTypes,
  type MenuFoodType,
  type MenuItemForm,
} from "../models/menuItem";
import { formatRupees } from "@/shared/utils/format";
import { menuImageUrl } from "../services/menuItemService";
import { useMenuItemFormViewModel } from "../viewmodels/useMenuItemFormViewModel";
type NumberName =
  | "price"
  | "discountedPrice"
  | "taxRate"
  | "preparationMinutes";
/** Bold label above a field, with a red star when required. */
function FieldLabel({
  text,
  required,
  htmlFor,
}: {
  text: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{ display: "block", fontWeight: 600, fontSize: 14, mb: 0.75 }}
    >
      {text}
      {required && <span style={{ color: "#d32f2f" }}> *</span>}
    </Typography>
  );
}
const foodStyle: Record<MenuFoodType, { icon: ReactNode; color: string }> = {
  Veg: { icon: <EnergySavingsLeafOutlined fontSize="small" />, color: "#2e7d32" },
  Egg: { icon: <EggOutlined fontSize="small" />, color: "#e09b00" },
  "Non-veg": { icon: <SetMealOutlined fontSize="small" />, color: "#c62828" },
};
/** Typed digits only (one decimal point if allowed): no letters, signs or spinner. */
const clean = (raw: string, decimal?: boolean) =>
  decimal
    ? raw.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*)\..*$/, "$1")
    : raw.replace(/\D/g, "");
function NumberInput({
  field,
  fieldState,
  label,
  required,
  prefix,
  placeholder,
  helperText,
  decimal,
}: {
  field: ControllerRenderProps<MenuItemForm, NumberName>;
  fieldState: ControllerFieldState;
  label: string;
  required?: boolean;
  prefix?: string;
  placeholder?: string;
  helperText?: string;
  decimal?: boolean;
}) {
  // Keeps what was typed, so "2." survives while the form stores 2.
  const [typed, setTyped] = useState(field.value == null ? "" : String(field.value));
  const stored = typed === "" ? null : Number(typed);
  const text = stored === field.value ? typed : field.value == null ? "" : String(field.value);
  const inputId = `menu-${field.name}`;
  return (
    <div>
      <FieldLabel text={label} required={required} htmlFor={inputId} />
      <CommonTextField
        id={inputId}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = clean(e.target.value, decimal);
          setTyped(next);
          field.onChange(next === "" || next === "." ? null : Number(next));
        }}
        onBlur={field.onBlur}
        inputRef={field.ref}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? helperText}
        slotProps={{
          htmlInput: { inputMode: decimal ? "decimal" : "numeric" },
          input: prefix
            ? {
                startAdornment: (
                  <Box
                    sx={{
                      alignSelf: "stretch",
                      display: "flex",
                      alignItems: "center",
                      px: 1.5,
                      mr: 1.5,
                      ml: -1.75,
                      bgcolor: "#f3f4f2",
                      borderRight: 1,
                      borderColor: "divider",
                      borderRadius: "10px 0 0 10px",
                      color: "text.secondary",
                    }}
                  >
                    {prefix}
                  </Box>
                ),
              }
            : undefined,
        }}
      />
    </div>
  );
}
/** Number input whose empty state is null. */
function NumberField({
  control,
  name,
  ...props
}: {
  control: Control<MenuItemForm>;
  name: NumberName;
  label: string;
  required?: boolean;
  prefix?: string;
  placeholder?: string;
  helperText?: string;
  /** Allows one decimal point, e.g. a 2.5 tax rate. */
  decimal?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <NumberInput field={field} fieldState={fieldState} {...props} />
      )}
    />
  );
}
/** A form block: orange icon tile, title and subtitle, then its fields. */
function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        py: 3,
        "&:not(:first-of-type)": { borderTop: 1, borderColor: "divider" },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: { xs: "none", sm: "grid" },
          placeItems: "center",
          bgcolor: "rgba(242,106,46,.1)",
          color: "primary.main",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {subtitle}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: "24px 28px" },
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            alignItems: "start",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
const fullRow = { gridColumn: { md: "1 / -1" } } as const;
/** Dropdown of existing values that also accepts a new one typed in. */
function ComboField({
  id,
  value,
  options,
  placeholder,
  error,
  helperText,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  error: boolean;
  helperText?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <Autocomplete
      id={id}
      freeSolo
      forcePopupIcon
      fullWidth
      options={options}
      inputValue={value}
      onInputChange={(_, next) => onChange(next)}
      onBlur={onBlur}
      renderInput={(params) => (
        <CommonTextField
          {...params}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, maxLength: 255 },
          }}
        />
      )}
    />
  );
}
/**
 * Category-style field: pick an existing value from the dropdown or press
 * "Add new …" to type a new one in its own text box.
 */
function ChoiceField({
  id,
  value,
  options,
  placeholder,
  addLabel,
  newPlaceholder,
  existingLabel,
  error,
  helperText,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  addLabel: string;
  newPlaceholder: string;
  existingLabel: string;
  error: boolean;
  helperText?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const [adding, setAdding] = useState(false);
  if (adding)
    return (
      <>
        <CommonTextField
          id={id}
          autoFocus
          value={value}
          placeholder={newPlaceholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          error={error}
          helperText={helperText ?? "Saved when you add the item."}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        <Button
          size="small"
          onClick={() => {
            setAdding(false);
            onChange("");
          }}
          sx={{ mt: 1, minHeight: 0, px: 0.5, fontWeight: 600 }}
        >
          Choose from existing
        </Button>
      </>
    );
  return (
    <>
      <ComboField
        id={id}
        value={value}
        options={options}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        onChange={onChange}
        onBlur={onBlur}
      />
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          startIcon={<AddOutlined />}
          onClick={() => {
            setAdding(true);
            onChange("");
          }}
          sx={{ minHeight: 0, px: 0.5, fontWeight: 600 }}
        >
          {addLabel}
        </Button>
        {options.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {existingLabel}
            </Typography>
            {options.slice(0, 8).map((name) => (
              <Chip
                key={name}
                label={name}
                variant="outlined"
                onClick={() => onChange(name)}
                sx={{ bgcolor: "#f8f8f6" }}
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
/** Optional discount (percent or flat ₹ off) that sets the offer price. */
function DiscountField({
  control,
  setValue,
}: {
  control: Control<MenuItemForm>;
  setValue: UseFormSetValue<MenuItemForm>;
}) {
  const price = useWatch({ control, name: "price" }),
    offer = useWatch({ control, name: "discountedPrice" }),
    [mode, setMode] = useState<"percent" | "flat">("percent"),
    [amount, setAmount] = useState("");
  const apply = (nextMode: typeof mode, raw: string, base: number | null) => {
    const n = Number(raw);
    if (!raw || !base || !Number.isFinite(n) || n <= 0)
      return setValue("discountedPrice", null, { shouldValidate: true });
    const off =
      nextMode === "percent" ? Math.round((base * n) / 100) : Math.round(n);
    setValue("discountedPrice", off > 0 && off < base ? base - off : null, {
      shouldValidate: true,
    });
  };
  return (
    <div>
      <FieldLabel text="Discount" htmlFor="menu-discount" />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Select
          size="small"
          value={mode}
          onChange={(e) => {
            const next = e.target.value as typeof mode;
            setMode(next);
            apply(next, amount, price);
          }}
          inputProps={{ "aria-label": "Discount type" }}
          sx={{ flex: 1.3, minWidth: 0 }}
        >
          <MenuItem value="percent">Percentage % off</MenuItem>
          <MenuItem value="flat">Flat ₹ off</MenuItem>
        </Select>
        <CommonTextField
          id="menu-discount"
          value={amount}
          placeholder="10"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "");
            setAmount(next);
            apply(mode, next, price);
          }}
          slotProps={{
            htmlInput: { inputMode: "numeric", "aria-label": "Discount value" },
            input: {
              endAdornment: (
                <Typography color="text.secondary">
                  {mode === "percent" ? "%" : "₹"}
                </Typography>
              ),
            },
          }}
          sx={{ flex: 1 }}
        />
      </Box>
      {offer != null && price != null && amount ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.75,
            fontWeight: 600,
            color: "success.main",
          }}
        >
          Customers pay {formatRupees(offer)} · save {formatRupees(price - offer)}
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.75 }}
        >
          Optional. Sets the offer price from the price.
        </Typography>
      )}
    </div>
  );
}
/** Drag-and-drop picture slot with a preview of what was picked. */
function PictureDrop({
  value,
  currentUrl,
  onChange,
  error,
}: {
  value: File | null;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null),
    [over, setOver] = useState(false),
    preview = useMemo(
      () => (value ? URL.createObjectURL(value) : null),
      [value],
    );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const shown = preview ?? currentUrl ?? null;
  return (
    <Box sx={fullRow}>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onChange(file);
        }}
        sx={{
          p: 2,
          border: "1.5px dashed",
          borderColor: over ? "primary.main" : "divider",
          bgcolor: over ? "rgba(242,106,46,.05)" : "transparent",
          borderRadius: "12px",
        }}
      >
        <FieldLabel text="Main image" required />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2.5,
          }}
        >
          <Box
            sx={{
              flex: "1 1 280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              p: 2,
              border: "1.5px dashed",
              borderColor: "divider",
              borderRadius: "10px",
            }}
          >
            <FileUploadOutlined color="primary" sx={{ fontSize: 32 }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2">
                Drag &amp; drop an image here
              </Typography>
              <Typography variant="caption" color="text.secondary">
                or
              </Typography>
              <Box>
                <CommonButton
                  size="small"
                  variant="outlined"
                  onClick={() => input.current?.click()}
                >
                  {value ? "Change file" : "Choose file"}
                </CommonButton>
              </Box>
            </Box>
            <input
              ref={input}
              hidden
              aria-label="Main image"
              type="file"
              accept={`${ITEM_IMAGE_TYPES.join(",")},.jpg,.jpeg,.webp`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange(file);
                e.target.value = "";
              }}
            />
          </Box>
          {shown && (
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Box
                component="img"
                src={shown}
                alt="Item preview"
                sx={{
                  width: 130,
                  height: 96,
                  objectFit: "cover",
                  borderRadius: "10px",
                  display: "block",
                }}
              />
              {value && (
                <IconButton
                  size="small"
                  aria-label="Remove image"
                  onClick={() => onChange(null)}
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <CloseOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          JPG or WEBP, up to 2 MB
        </Typography>
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
export function MenuItemFormView({ id }: { id?: string }) {
  const vm = useMenuItemFormViewModel(id),
    { control, setValue } = vm.form,
    title = vm.editing ? "Edit item" : "Add items";
  return (
    <>
      <PageHeader
        eyebrow={`Menu / ${title}`.toUpperCase()}
        title={vm.editing ? vm.item?.name || "Edit item" : "Add a menu item"}
        subtitle={
          vm.editing
            ? "Update the price, picture or details of this dish."
            : "Add a new dish with details, pricing, image and availability."
        }
      />
      {vm.created && (
        <Alert
          severity="success"
          onClose={vm.dismissCreated}
          sx={{ mb: 3 }}
          action={
            <CommonButton
              color="inherit"
              size="small"
              href="/menu/items"
              LinkComponent={NextLink}
            >
              View menu
            </CommonButton>
          }
        >
          {vm.created.name} was added to your menu. Add another below.
        </Alert>
      )}
      {vm.draftSaved && (
        <Alert severity="info" onClose={vm.clearDraftSaved} sx={{ mb: 3 }}>
          Draft saved in this browser. The picture is not part of the draft.
        </Alert>
      )}
      {vm.error && (
        <Alert severity="error" onClose={vm.dismissError} sx={{ mb: 3 }}>
          {vm.error}
        </Alert>
      )}
      {vm.loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress aria-label="Loading menu item" />
        </Box>
      ) : vm.loadError ? (
        <Alert
          severity="error"
          action={
            <CommonButton color="inherit" size="small" onClick={vm.cancel}>
              Back to menu
            </CommonButton>
          }
        >
          {vm.loadError}
        </Alert>
      ) : (
        <CommonCard className="profile-card">
          <form noValidate onSubmit={vm.submit}>
            <Section
              icon={<DescriptionOutlined />}
              title="Basic details"
              subtitle="Enter the basic information about your menu item."
            >
              <Box sx={{ display: "grid", gap: 3 }}>
                <Controller
                  control={control}
                  name="foodType"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel text="Food type" required />
                      <ToggleButtonGroup
                        exclusive
                        value={field.value}
                        onChange={(_, value) => value && field.onChange(value)}
                        sx={{ flexWrap: "wrap", gap: 1.5 }}
                      >
                        {menuFoodTypes.map((type) => (
                          <ToggleButton
                            key={type}
                            value={type}
                            sx={{
                              px: 3,
                              gap: 1,
                              fontWeight: 600,
                              color: "text.primary",
                              border: "1px solid #d9ded9 !important",
                              borderRadius: "10px !important",
                              "& svg": { color: foodStyle[type].color },
                              "&.Mui-selected, &.Mui-selected:hover": {
                                bgcolor: `${foodStyle[type].color}14`,
                                borderColor: `${foodStyle[type].color} !important`,
                              },
                            }}
                          >
                            {foodStyle[type].icon}
                            {type}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                      {fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel text="Item name" required htmlFor="menu-name" />
                      <CommonTextField
                        {...field}
                        id="menu-name"
                        placeholder="e.g. Paneer Butter Masala"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        slotProps={{ htmlInput: { maxLength: 255 } }}
                      />
                    </div>
                  )}
                />
              </Box>
              <Box sx={{ display: "grid", gap: 3 }}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel
                        text="Category"
                        required
                        htmlFor="menu-category"
                      />
                      <ChoiceField
                        id="menu-category"
                        value={field.value}
                        options={vm.categories}
                        placeholder="e.g. Biryani"
                        addLabel="Add new category"
                        newPlaceholder="Type the new category"
                        existingLabel="Existing categories:"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="subCategory"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel
                        text="Sub category"
                        htmlFor="menu-sub"
                      />
                      <ChoiceField
                        id="menu-sub"
                        value={field.value}
                        options={vm.subCategories}
                        placeholder="e.g. Chicken Biryani"
                        addLabel="Add new subcategory"
                        newPlaceholder="Type the new subcategory"
                        existingLabel="Existing subcategories:"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                  )}
                />
              </Box>
              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <Box sx={fullRow}>
                    <FieldLabel text="Description" htmlFor="menu-description" />
                    <CommonTextField
                      {...field}
                      id="menu-description"
                      placeholder="Describe your dish, ingredients, taste, etc..."
                      multiline
                      minRows={3}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{ htmlInput: { maxLength: 500 } }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                    >
                      {field.value.length}/500
                    </Typography>
                  </Box>
                )}
              />
            </Section>
            <Section
              icon={<CurrencyRupee />}
              title="Pricing & preparation"
              subtitle="Set the price, discount and preparation details."
            >
              <NumberField
                control={control}
                name="price"
                label="Price"
                required
                prefix="₹"
                placeholder="e.g. 120"
              />
              <NumberField
                control={control}
                name="discountedPrice"
                label="Offer price"
                prefix="₹"
                placeholder="e.g. 99"
                helperText="Optional. Shown instead of the price."
              />
              <DiscountField control={control} setValue={setValue} />
              <NumberField
                control={control}
                name="preparationMinutes"
                label="Preparation time (minutes)"
                required
                placeholder="15"
              />
            </Section>
            <Section
              icon={<ImageOutlined />}
              title="Media"
              subtitle={
                vm.editing && vm.item?.images.length
                  ? "Choosing a new picture replaces the current one."
                  : "Add a picture of your dish."
              }
            >
              <Controller
                control={control}
                name="images.0"
                render={({ field, fieldState }) => (
                  <PictureDrop
                    value={field.value ?? null}
                    currentUrl={
                      vm.editing && vm.item?.images[0]
                        ? menuImageUrl(vm.item.images[0])
                        : null
                    }
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </Section>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                pt: 3,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              {!vm.editing && (
                <Button
                  startIcon={<DescriptionOutlined />}
                  onClick={vm.saveDraft}
                  sx={{ fontWeight: 600 }}
                >
                  Save draft
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <CommonButton
                variant="outlined"
                color="inherit"
                onClick={vm.cancel}
                disabled={vm.submitting}
              >
                Cancel
              </CommonButton>
              <CommonButton
                type="submit"
                variant="contained"
                disabled={vm.submitting}
              >
                {vm.submitting
                  ? "Saving…"
                  : vm.editing
                    ? "Save changes"
                    : "Add item"}
              </CommonButton>
            </Box>
          </form>
        </CommonCard>
      )}
    </>
  );
}
