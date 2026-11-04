"use client";
import { useEffect, useMemo, useState } from "react";
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
  createFilterOptions,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  ButtonBase,
  IconButton,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import RemoveOutlined from "@mui/icons-material/RemoveOutlined";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import { tokens } from "@/core/theme/tokens";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FieldLabel } from "@/shared/components/form/FormField";
import {
  ITEM_IMAGE_TYPES,
  menuFoodTypes,
  qtyTypes,
  type MenuItemForm,
} from "../models/menuItem";
import { formatRupees } from "@/shared/utils/format";
import { menuImageUrl } from "../services/menuItemApi";
import {
  ADDON_IMAGE_MAX_BYTES,
  ADDON_IMAGE_TYPES,
  type RestaurantAddOn,
} from "../services/addOnApi";
import { useMenuItemFormViewModel } from "../viewmodels/useMenuItemFormViewModel";
type NumberName =
  "price" | "discountedPrice" | "taxRate" | "preparationMinutes";
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
  suffix,
  placeholder,
  helperText,
  decimal,
}: {
  field: ControllerRenderProps<MenuItemForm, NumberName>;
  fieldState: ControllerFieldState;
  label: string;
  required?: boolean;
  prefix?: string;
  /** Small grey text at the end of the box, e.g. incl. GST. */
  suffix?: string;
  placeholder?: string;
  helperText?: string;
  decimal?: boolean;
}) {
  // Keeps what was typed, so "2." survives while the form stores 2.
  const [typed, setTyped] = useState(
    field.value == null ? "" : String(field.value),
  );
  const stored = typed === "" ? null : Number(typed);
  const text =
    stored === field.value
      ? typed
      : field.value == null
        ? ""
        : String(field.value);
  const inputId = `menu-${field.name}`;
  return (
    <div>
      {label && (
        <FieldLabel text={label} required={required} htmlFor={inputId} />
      )}
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
          input: prefix || suffix
            ? {
                endAdornment: suffix ? (
                  <Typography sx={{ fontSize: 13, whiteSpace: "nowrap", color: tokens.color.textMuted }}>
                    {suffix}
                  </Typography>
                ) : undefined,
                startAdornment: prefix ? (
                  <Box
                    sx={{
                      alignSelf: "stretch",
                      display: "flex",
                      alignItems: "center",
                      px: 1.5,
                      mr: 1.5,
                      ml: -1.75,
                      bgcolor: tokens.color.muted,
                      borderRight: 1,
                      borderColor: tokens.color.borderInput,
                      borderRadius: "10px 0 0 10px",
                      color: "text.secondary",
                    }}
                  >
                    {prefix}
                  </Box>
                ) : undefined,
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
  suffix?: string;
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

/** Creates an add-on; resolves to an error message, or "" once saved and ticked. */
type CreateAddOn = (
  name: string,
  price: number,
  image: File | null,
) => Promise<string>;
/** Inline box to create an add-on while filling in the item. */
function NewAddOn({ onCreate }: { onCreate: CreateAddOn }) {
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [price, setPrice] = useState(""),
    [image, setImage] = useState<File | null>(null),
    [error, setError] = useState(""),
    [imageError, setImageError] = useState(""),
    [busy, setBusy] = useState(false),
    preview = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
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
  const close = () => {
    setOpen(false);
    setName("");
    setPrice("");
    setImage(null);
    setError("");
    setImageError("");
  };
  const save = async () => {
    if (!name.trim()) return setError("Enter the add-on name.");
    if (price === "") return setError("Enter the price (0 if free).");
    setBusy(true);
    const problem = await onCreate(name.trim(), Number(price), image);
    setBusy(false);
    if (problem) setError(problem);
    else close();
  };
  if (!open)
    return (
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          startIcon={<AddOutlined />}
          onClick={() => setOpen(true)}
          sx={linkButtonSx}
        >
          Add new add-on
        </Button>
      </Box>
    );
  const enter = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  };
  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        display: "grid",
        gap: 1.5,
        alignItems: "start",
        border: 1,
        borderColor: "divider",
        borderRadius: "14px",
        gridTemplateColumns: { xs: "1fr", sm: "auto 2fr 1fr auto" },
      }}
    >
      <Tooltip
        title={
          imageError ||
          (image ? "Change picture" : "Add a picture (optional, up to 2 MB)")
        }
      >
        <Box
          component="label"
          aria-label="Add-on picture"
          sx={{
            width: 48,
            height: 48,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            cursor: busy ? "default" : "pointer",
            color: imageError ? "error.main" : "text.secondary",
            bgcolor: "#f3f4f2",
            border: 1,
            borderColor: imageError ? "error.main" : "transparent",
            backgroundSize: "cover",
            backgroundPosition: "center",
            ...(preview && { backgroundImage: `url("${preview}")` }),
          }}
        >
          {!preview && <AddPhotoAlternateOutlined fontSize="small" />}
          <input
            hidden
            type="file"
            disabled={busy}
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </Box>
      </Tooltip>
      <CommonTextField
        autoFocus
        value={name}
        placeholder="Add-on name, e.g. Extra raita"
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
        onKeyDown={enter}
        error={!!error && !name.trim()}
        helperText={!name.trim() ? error : undefined}
        slotProps={{
          htmlInput: { maxLength: 100, "aria-label": "Add-on name" },
        }}
      />
      <CommonTextField
        value={price}
        placeholder="Price, e.g. 30"
        onChange={(e) => {
          setPrice(clean(e.target.value));
          setError("");
        }}
        onKeyDown={enter}
        error={!!error && !!name.trim()}
        helperText={name.trim() ? error : undefined}
        slotProps={{
          htmlInput: { inputMode: "numeric", "aria-label": "Add-on price" },
          input: {
            startAdornment: (
              <Box sx={{ mr: 1, color: "text.secondary" }}>₹</Box>
            ),
          },
        }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <CommonButton
          size="small"
          variant="contained"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Adding…" : "Add"}
        </CommonButton>
        <CommonButton
          size="small"
          variant="outlined"
          color="inherit"
          disabled={busy}
          onClick={close}
        >
          Cancel
        </CommonButton>
      </Box>
      {imageError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ gridColumn: "1 / -1", mt: -0.5 }}
        >
          {imageError}
        </Typography>
      )}
    </Box>
  );
}

/** The restaurant's add-ons as a checklist; the ticked ones go with the item. */
function AddOnsField({
  control,
  addOns,
  onCreate,
}: {
  control: Control<MenuItemForm>;
  addOns: RestaurantAddOn[];
  onCreate: CreateAddOn;
}) {
  return (
    <div>
      <FieldLabel text="Add-ons" htmlFor="menu-addons" />
      {addOns.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No add-ons yet. Add one below.
        </Typography>
      ) : (
        <Controller
          control={control}
          name="addOnIds"
          render={({ field }) => (
            <Autocomplete
              id="menu-addons"
              multiple
              disableCloseOnSelect
              openOnFocus
              options={addOns}
              value={addOns.filter((a) => field.value.includes(a.id))}
              onChange={(_, picked) => field.onChange(picked.map((a) => a.id))}
              getOptionLabel={(a) => a.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText="No add-ons match"
              renderOption={({ key, ...props }, addOn, { selected }) => (
                <li key={key} {...props}>
                  <Checkbox checked={selected} sx={{ mr: 1, p: 0.5 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <span>{addOn.name}</span>
                    <strong>
                      {addOn.price ? `+${formatRupees(addOn.price)}` : "Free"}
                    </strong>
                  </Box>
                </li>
              )}
              renderValue={(picked, getItemProps) =>
                picked.map((addOn, index) => {
                  const { key, ...props } = getItemProps({ index });
                  return (
                    <Chip
                      key={key}
                      {...props}
                      label={`${addOn.name} · ${addOn.price ? formatRupees(addOn.price) : "Free"}`}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <CommonTextField
                  {...params}
                  placeholder={field.value.length ? "" : "Select add-ons"}
                />
              )}
            />
          )}
        />
      )}
      <NewAddOn onCreate={onCreate} />
    </div>
  );
}

/** A small blue text button, e.g. Add new category. */
const linkButtonSx = {
  mt: 1,
  minHeight: "0 !important",
  px: 0.5,
  py: 0.5,
  fontWeight: 600,
  color: `${tokens.color.link} !important`,
  bgcolor: "transparent !important",
} as const;
const filterByText = createFilterOptions<string>();
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
      openOnFocus
      forcePopupIcon
      fullWidth
      options={options}
      // Opening the list always shows every saved value; typing narrows it.
      filterOptions={(all, state) =>
        all.some(
          (o) => o.toLowerCase() === state.inputValue.trim().toLowerCase(),
        )
          ? all
          : filterByText(all, state)
      }
      noOptionsText="No saved values yet"
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
          sx={linkButtonSx}
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
          sx={linkButtonSx}
        >
          {addLabel}
        </Button>
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
    // What the vendor typed here, and the offer price it produced. When the
    // offer price changes any other way, the discount is worked out from it.
    [typed, setTyped] = useState<{ text: string; offer: number | null } | null>(
      null,
    ),
    off = offer != null && price ? price - offer : 0,
    derived =
      off > 0 && price
        ? mode === "percent"
          ? String(Math.round((off / price) * 10000) / 100)
          : String(off)
        : "",
    amount = typed && typed.offer === offer ? typed.text : derived;
  const type = (raw: string) => {
    const text =
        mode === "percent"
          ? raw.replace(/[^d.]/g, "").replace(/(..*)./g, "$1")
          : raw.replace(/D/g, ""),
      n = Number(text),
      cut =
        price && Number.isFinite(n) && n > 0
          ? mode === "percent"
            ? Math.round((price * n) / 100)
            : Math.round(n)
          : 0,
      next = price && cut > 0 && cut < price ? price - cut : null;
    setTyped({ text, offer: next });
    setValue("discountedPrice", next, { shouldValidate: true });
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
            setTyped(null);
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
          onChange={(e) => type(e.target.value)}
          slotProps={{
            htmlInput: { inputMode: "decimal", "aria-label": "Discount value" },
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
      {offer != null && price != null && off > 0 ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.75,
            fontWeight: 600,
            color: "success.main",
          }}
        >
          Customers pay {formatRupees(offer)} · flat {formatRupees(off)} off ·{" "}
          {Math.round((off / price) * 10000) / 100}% off
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.75 }}
        >
          Optional. Fills in from the offer price, or sets it.
        </Typography>
      )}
    </div>
  );
}
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** A small square to tap for the dish photo; shows it once chosen. */
function PhotoTile({
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
  const [problem, setProblem] = useState(""),
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
  const pick = (file?: File | null) => {
    if (!file) return;
    if (!ITEM_IMAGE_TYPES.includes(file.type))
      return setProblem("Choose a JPG or WEBP picture.");
    if (file.size > MAX_PICTURE_BYTES)
      return setProblem(
        `That picture is ${fileSize(file.size)}. Keep it under 2 MB.`,
      );
    setProblem("");
    onChange(file);
  };
  const shown = preview ?? currentUrl ?? null,
    message = problem || error;
  return (
    <Box sx={{ width: 88, flexShrink: 0 }}>
      <Box
        component="label"
        aria-label="Dish photo"
        sx={{
          width: 88,
          height: 88,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          cursor: "pointer",
          fontSize: 13,
          color: tokens.color.text,
          borderRadius: tokens.radius.input,
          border: `1.5px dashed ${message ? tokens.color.error : tokens.color.dashed}`,
          bgcolor: tokens.color.sunken,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...(shown && { backgroundImage: `url("${shown}")` }),
        }}
      >
        {!shown && (
          <>
            <CameraAltOutlined sx={{ color: tokens.color.textMuted }} />
            Photo
          </>
        )}
        <input
          hidden
          type="file"
          accept={`${ITEM_IMAGE_TYPES.join(",")},.jpg,.jpeg,.webp`}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Box>
      {message && (
        <FormHelperText error sx={{ mx: 0 }}>
          {message}
        </FormHelperText>
      )}
    </Box>
  );
}

const PREP_STEP = 5;
const SECTION_TITLE = { fontSize: 16, fontWeight: 700, mb: 1.5 } as const;

export function MenuItemFormView({ id }: { id?: string }) {
  const vm = useMenuItemFormViewModel(id),
    { control, setValue } = vm.form,
    offer = useWatch({ control, name: "discountedPrice" }),
    [discountOpen, setDiscountOpen] = useState(false),
    description = useWatch({ control, name: "description" });
  return (
    <Box
      component="form"
      noValidate
      onSubmit={vm.submit}
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <IconButton aria-label="Close" onClick={vm.cancel} edge="start">
          <CloseOutlined />
        </IconButton>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
          {vm.editing ? vm.item?.name || "Edit item" : "New item"}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>
        {vm.editing && vm.item?.adminAvailable === false && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>This item was disabled by TrainDhaba.</strong> Reason:{" "}
            {vm.item.adminInactiveReason || "No reason was given."} Customers
            cannot order it until it is enabled again.
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
          <Box sx={{ display: "grid", gap: 3.5 }}>
            <Box>
              <Typography sx={SECTION_TITLE}>Dish</Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Controller
                  control={control}
                  name="images.0"
                  render={({ field, fieldState }) => (
                    <PhotoTile
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
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <div>
                        <FieldLabel text="Dish name" required htmlFor="menu-name" />
                        <CommonTextField
                          {...field}
                          id="menu-name"
                          placeholder="e.g. Chicken 65 Biryani"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          slotProps={{ htmlInput: { maxLength: 255 } }}
                        />
                      </div>
                    )}
                  />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel text="Description (optional)" htmlFor="menu-description" />
                      <CommonTextField
                        {...field}
                        id="menu-description"
                        placeholder="Ingredients, taste, how much it serves"
                        multiline
                        minRows={3}
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ?? `${description.length}/500`
                        }
                        slotProps={{ htmlInput: { maxLength: 500 } }}
                      />
                    </div>
                  )}
                />
              </Box>
            </Box>
            <Box>
              <Typography sx={SECTION_TITLE}>Price</Typography>
              <NumberField
                control={control}
                name="price"
                label=""
                required
                prefix="₹"
                suffix="incl. GST"
                placeholder="e.g. 299"
              />
              {discountOpen || offer != null ? (
                <Box sx={{ mt: 1.5 }}>
                  <DiscountField control={control} setValue={setValue} />
                </Box>
              ) : (
                <ButtonBase
                  onClick={() => setDiscountOpen(true)}
                  sx={{
                    mt: 1.25,
                    gap: 0.5,
                    fontSize: 14,
                    fontWeight: 600,
                    color: tokens.color.link,
                  }}
                >
                  <AddOutlined sx={{ fontSize: 18 }} />
                  Add discount
                </ButtonBase>
              )}
            </Box>
            <Box>
              <Typography sx={SECTION_TITLE}>Menu section</Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  alignItems: "start",
                }}
              >
                <Controller
                  control={control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel text="Category" required htmlFor="menu-category" />
                      <ChoiceField
                        id="menu-category"
                        value={field.value}
                        options={vm.categories}
                        placeholder="e.g. Biryani"
                        addLabel="Add new category"
                        newPlaceholder="Type the new category"
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
                      <FieldLabel text="Sub-category" htmlFor="menu-sub" />
                      <ChoiceField
                        id="menu-sub"
                        value={field.value}
                        options={vm.subCategories}
                        placeholder="e.g. Non-veg biryani"
                        addLabel="Add new sub-category"
                        newPlaceholder="Type the new sub-category"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                  )}
                />
              </Box>
            </Box>
            <Controller
              control={control}
              name="foodType"
              render={({ field, fieldState }) => (
                <Box>
                  <Typography sx={SECTION_TITLE}>Food type</Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={field.value}
                    onChange={(_, value) => value && field.onChange(value)}
                    sx={{
                      gap: 1.5,
                      "& .MuiToggleButton-root": {
                        gap: 1,
                        height: 44,
                        fontWeight: 600,
                        textTransform: "none",
                        color: tokens.color.text,
                        border: `1.5px solid ${tokens.color.borderInput} !important`,
                        borderRadius: `${tokens.radius.input} !important`,
                        "& .food-mark": { m: 0 },
                        "&.Mui-selected, &.Mui-selected:hover": {
                          bgcolor: tokens.color.card,
                          borderColor: `${tokens.color.borderStrong} !important`,
                        },
                      },
                    }}
                  >
                    {menuFoodTypes.map((type) => (
                      <ToggleButton key={type} value={type}>
                        <FoodTypeMark type={type} />
                        {type}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  {fieldState.error && (
                    <FormHelperText error>{fieldState.error.message}</FormHelperText>
                  )}
                </Box>
              )}
            />
            <Controller
              control={control}
              name="preparationMinutes"
              render={({ field, fieldState }) => {
                const minutes = field.value ?? 15,
                  set = (next: number) =>
                    field.onChange(Math.min(240, Math.max(PREP_STEP, next)));
                return (
                  <Box>
                    <Typography sx={SECTION_TITLE}>Prep time</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 44,
                          borderRadius: tokens.radius.input,
                          border: `1.5px solid ${tokens.color.borderInput}`,
                        }}
                      >
                        <IconButton
                          aria-label="Less prep time"
                          onClick={() => set(minutes - PREP_STEP)}
                        >
                          <RemoveOutlined fontSize="small" />
                        </IconButton>
                        <Typography
                          sx={{ minWidth: 64, textAlign: "center", fontWeight: 600 }}
                        >
                          {minutes} min
                        </Typography>
                        <IconButton
                          aria-label="More prep time"
                          onClick={() => set(minutes + PREP_STEP)}
                        >
                          <AddOutlined fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography
                        sx={{ flex: 1, fontSize: 13, color: tokens.color.textMuted }}
                      >
                        Time to cook and pack one order. We use it to tell the
                        rider when to pick up.
                      </Typography>
                    </Box>
                    {fieldState.error && (
                      <FormHelperText error>{fieldState.error.message}</FormHelperText>
                    )}
                  </Box>
                );
              }}
            />
            <Controller
              control={control}
              name="available"
              render={({ field }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                    borderTop: `1px solid ${tokens.color.borderSubtle}`,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                      Available now
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                      Passengers can order this dish right away
                    </Typography>
                  </Box>
                  <Switch
                    checked={field.value ?? true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        bgcolor: tokens.color.success,
                        opacity: 1,
                      },
                    }}
                  />
                </Box>
              )}
            />
            <Box>
              <Typography sx={{ ...SECTION_TITLE, mb: 0.25 }}>
                Quantity and add-ons
              </Typography>
              <Typography
                sx={{ mb: 1.5, fontSize: 13, color: tokens.color.textMuted }}
              >
                How the dish is sold, and extras passengers can add
              </Typography>
              <Box sx={{ display: "grid", gap: 2.5 }}>
                <Controller
                  control={control}
                  name="qtyType"
                  render={({ field, fieldState }) => (
                    <div>
                      <FieldLabel text="Sold as" htmlFor="menu-qty-type" />
                      <ChoiceField
                        id="menu-qty-type"
                        value={field.value ?? ""}
                        options={vm.qtyOptions.length ? vm.qtyOptions : [...qtyTypes]}
                        placeholder="e.g. Plate, Half Plate"
                        addLabel="Add new quantity type"
                        newPlaceholder="Type how it is sold, e.g. Family pack"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                  )}
                />
                <AddOnsField
                  control={control}
                  addOns={vm.addOns}
                  onCreate={vm.createAddOn}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          px: 3,
          py: 2,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <CommonButton variant="text" onClick={vm.cancel} disabled={vm.submitting}>
          Cancel
        </CommonButton>
        <CommonButton
          type="submit"
          variant="contained"
          disabled={vm.submitting || vm.loading || !!vm.loadError}
          sx={{ flex: 1 }}
        >
          {vm.submitting
            ? "Saving…"
            : vm.editing
              ? "Save changes"
              : "Add to menu"}
        </CommonButton>
      </Box>
    </Box>
  );
}
