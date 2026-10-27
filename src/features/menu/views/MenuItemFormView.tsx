"use client";
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
  createFilterOptions,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import EnergySavingsLeafOutlined from "@mui/icons-material/EnergySavingsLeafOutlined";
import EggOutlined from "@mui/icons-material/EggOutlined";
import SetMealOutlined from "@mui/icons-material/SetMealOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FieldLabel } from "@/shared/components/form/FormField";
import {
  ITEM_IMAGE_TYPES,
  menuFoodTypes,
  qtyTypes,
  type MenuFoodType,
  type MenuItemForm,
} from "../models/menuItem";
import { formatRupees } from "@/shared/utils/format";
import { menuImageUrl } from "../services/menuItemApi";
import type { RestaurantAddOn } from "../services/addOnApi";
import { useMenuItemFormViewModel } from "../viewmodels/useMenuItemFormViewModel";
type NumberName =
  "price" | "discountedPrice" | "taxRate" | "preparationMinutes";
const foodStyle: Record<MenuFoodType, { icon: ReactNode; color: string }> = {
  Veg: {
    icon: <EnergySavingsLeafOutlined fontSize="small" />,
    color: "#2e7d32",
  },
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
          width: 32,
          display: { xs: "none", sm: "flex" },
          justifyContent: "center",
          pt: 0.5,
          color: "primary.main",
          flexShrink: 0,
          "& svg": { fontSize: 28 },
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

/** Inline box to create an add-on while filling in the item. */
function NewAddOn({
  onCreate,
}: {
  /** Resolves to an error message, or "" once the add-on is saved and ticked. */
  onCreate: (name: string, price: number) => Promise<string>;
}) {
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [price, setPrice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const close = () => {
    setOpen(false);
    setName("");
    setPrice("");
    setError("");
  };
  const save = async () => {
    if (!name.trim()) return setError("Enter the add-on name.");
    if (price === "") return setError("Enter the price (0 if free).");
    setBusy(true);
    const problem = await onCreate(name.trim(), Number(price));
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
          sx={{ minHeight: 0, px: 0.5, fontWeight: 600 }}
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
        gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr auto" },
      }}
    >
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
  onCreate: (name: string, price: number) => Promise<string>;
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

/** The in / out of stock switch and optional add-ons. */
function AvailabilityFields({
  control,
  addOns,
  qtyOptions,
  onCreateAddOn,
}: {
  control: Control<MenuItemForm>;
  qtyOptions: string[];
  addOns: RestaurantAddOn[];
  onCreateAddOn: (name: string, price: number) => Promise<string>;
}) {
  return (
    <>
      <Controller
        control={control}
        name="available"
        render={({ field }) => (
          <Box sx={{ gridColumn: { md: "1 / -1" } }}>
            <Tooltip title="Turn off to show this item as out of stock.">
              <FormControlLabel
                sx={{
                  m: 0,
                  gap: 1,
                  px: 1.5,
                  py: 0.25,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: "10px",
                }}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={field.value ?? true}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>
                    Available for orders
                  </Typography>
                }
              />
            </Tooltip>
          </Box>
        )}
      />
      <Controller
        control={control}
        name="qtyType"
        render={({ field, fieldState }) => (
          <div>
            <FieldLabel text="Sold as" htmlFor="menu-qty-type" />
            <ChoiceField
              id="menu-qty-type"
              value={field.value ?? ""}
              options={qtyOptions.length ? qtyOptions : [...qtyTypes]}
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

      <AddOnsField control={control} addOns={addOns} onCreate={onCreateAddOn} />
    </>
  );
}
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
/**
 * Picture upload: tap or drop a photo, see it large straight away, and
 * replace or remove it. Wrong types or big files are refused on the spot.
 */
/** The description box and the picture box beside it are this tall. */
const PICTURE_HEIGHT = 140;
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
    [problem, setProblem] = useState(""),
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
      return setProblem("Please choose a JPG or WEBP picture.");
    if (file.size > MAX_PICTURE_BYTES)
      return setProblem(
        `That picture is ${fileSize(file.size)}. Please keep it under 2 MB.`,
      );
    setProblem("");
    onChange(file);
  };
  const shown = preview ?? currentUrl ?? null,
    message = problem || error;
  const chooser = (
    <input
      ref={input}
      hidden
      aria-label="Dish picture"
      type="file"
      accept={`${ITEM_IMAGE_TYPES.join(",")},.jpg,.jpeg,.webp`}
      onChange={(e) => {
        pick(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );
  return (
    <Box>
      <FieldLabel text="Dish picture" />
      {shown ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            height: PICTURE_HEIGHT,
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: "14px",
            bgcolor: "#fcfcfb",
          }}
        >
          <Box
            component="img"
            src={shown}
            alt="Dish preview"
            sx={{
              width: 110,
              height: "100%",
              flexShrink: 0,
              objectFit: "cover",
              borderRadius: "12px",
              display: "block",
            }}
          />
          <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {value ? "Looks good!" : "Current picture"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere", mb: 2 }}
            >
              {value
                ? `${value.name} · ${fileSize(value.size)}`
                : "This is what customers see now."}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <CommonButton
                size="small"
                variant="outlined"
                startIcon={<FileUploadOutlined />}
                onClick={() => input.current?.click()}
              >
                {value ? "Change picture" : "Replace picture"}
              </CommonButton>
              {value && (
                <CommonButton
                  size="small"
                  color="inherit"
                  startIcon={<CloseOutlined />}
                  onClick={() => {
                    setProblem("");
                    onChange(null);
                  }}
                >
                  Remove
                </CommonButton>
              )}
            </Box>
          </Box>
          {chooser}
        </Box>
      ) : (
        <Box
          role="button"
          tabIndex={0}
          aria-label="Add a dish picture"
          onClick={() => input.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              input.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 2,
            height: PICTURE_HEIGHT,
            textAlign: "center",
            cursor: "pointer",
            border: "2px dashed",
            borderColor:
              over || message
                ? message
                  ? "error.main"
                  : "primary.main"
                : "#d9ded9",
            bgcolor: over ? "rgba(242,106,46,.06)" : "#fcfcfb",
            borderRadius: "14px",
            transition: "border-color .15s, background-color .15s",
            "&:hover, &:focus-visible": {
              borderColor: "primary.main",
              bgcolor: "rgba(242,106,46,.04)",
              outline: "none",
            },
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              color: "primary.main",
            }}
          >
            <AddPhotoAlternateOutlined sx={{ fontSize: 34 }} />
          </Box>
          <Typography sx={{ fontWeight: 700 }}>
            {over ? "Drop it here" : "Add a photo of your dish"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drag &amp; drop, or{" "}
            <Box
              component="span"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              browse your files
            </Box>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            JPG or WEBP, up to 2 MB. A bright, close-up photo sells best.
          </Typography>
          {chooser}
        </Box>
      )}
      {message && <FormHelperText error>{message}</FormHelperText>}
    </Box>
  );
}
export function MenuItemFormView({ id }: { id?: string }) {
  const vm = useMenuItemFormViewModel(id),
    { control, setValue } = vm.form;
  return (
    <>
      <PageHeader
        eyebrow="Menu"
        title={vm.editing ? vm.item?.name || "Edit item" : "Add a menu item"}
        subtitle={
          vm.editing
            ? "Change the price, photo or details of this dish."
            : "Create a new dish customers can order."
        }
      />
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
        <CommonCard className="profile-card">
          <form noValidate onSubmit={vm.submit}>
            <Section
              icon={<DescriptionOutlined />}
              title="Basic details"
              subtitle="Name, description and food type."
            >
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
                    <FieldLabel text="Sub category" htmlFor="menu-sub" />
                    <ChoiceField
                      id="menu-sub"
                      value={field.value}
                      options={vm.subCategories}
                      placeholder="e.g. Chicken Biryani"
                      addLabel="Add new subcategory"
                      newPlaceholder="Type the new subcategory"
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
                name="description"
                render={({ field, fieldState }) => (
                  <Box>
                    <FieldLabel text="Description" htmlFor="menu-description" />
                    <CommonTextField
                      {...field}
                      id="menu-description"
                      placeholder="Describe your dish, ingredients, taste, etc..."
                      multiline
                      rows={4}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: PICTURE_HEIGHT,
                          alignItems: "flex-start",
                        },
                        "& textarea": { height: "100% !important" },
                      }}
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
            <Section
              icon={<Inventory2Outlined />}
              title="Availability"
              subtitle="Whether it is in stock, how it is sold and which add-ons go with it."
            >
              <AvailabilityFields
                control={control}
                addOns={vm.addOns}
                qtyOptions={vm.qtyOptions}
                onCreateAddOn={vm.createAddOn}
              />
            </Section>
            <Section
              icon={<CurrencyRupee />}
              title="Pricing & preparation"
              subtitle="Price, discount and how long it takes to make."
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
