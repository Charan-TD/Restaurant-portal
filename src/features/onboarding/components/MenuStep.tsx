"use client";
import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import {
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
} from "@mui/material";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonUpload } from "@/shared/components/form/CommonUpload";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { useMenuViewModel } from "../viewmodels/useMenuViewModel";
import { itemTypes, type MenuItem } from "../models/registration";
function MenuItemRow({
  item,
  onRemove,
}: {
  item: MenuItem;
  onRemove: () => void;
}) {
  const thumb = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!item.image || !thumb.current) return;
    const url = URL.createObjectURL(item.image);
    thumb.current.style.backgroundImage = `url("${url}")`;
    return () => URL.revokeObjectURL(url);
  }, [item.image]);
  return (
    <div className="review-row">
      <div className="menu-thumb" ref={thumb} role="img" aria-label={item.name}>
        {!item.image && <RestaurantMenuOutlined />}
      </div>
      <div className="grow">
        <strong className="menu-item-name">
          <FoodTypeMark type={item.type} />
          {item.name}
        </strong>
        <small>{item.description}</small>
      </div>
      <span>₹{item.price}</span>
      <CommonButton onClick={onRemove}>Remove</CommonButton>
    </div>
  );
}
export function MenuStep() {
  const vm = useMenuViewModel();
  return (
    <>
      <Typography variant="h6">Add a menu item</Typography>
      <div className="form-grid menu-form">
        <Controller
          control={vm.menuForm.control}
          name="type"
          render={({ field, fieldState }) => (
            <div className="full">
              <Typography variant="subtitle2" gutterBottom>
                Item type *
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={field.value}
                disabled={vm.vegOnly}
                onChange={(_, value) => value && field.onChange(value)}
              >
                {itemTypes.map((type) => (
                  <ToggleButton key={type} value={type}>
                    <FoodTypeMark type={type} />
                    {type}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <FormHelperText error={!!fieldState.error}>
                {fieldState.error?.message ||
                  (vm.vegOnly
                    ? "Your restaurant is veg, so every item is veg."
                    : undefined)}
              </FormHelperText>
            </div>
          )}
        />
        <Controller
          control={vm.menuForm.control}
          name="name"
          render={({ field, fieldState }) => (
            <CommonTextField
              label="Item name"
              required
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={vm.menuForm.control}
          name="price"
          render={({ field, fieldState }) => (
            <CommonTextField
              label="Price (₹)"
              required
              type="number"
              value={field.value || ""}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          )}
        />
        <Controller
          control={vm.menuForm.control}
          name="description"
          render={({ field, fieldState }) => (
            <CommonTextField
              className="full"
              label="Item description"
              required
              multiline
              minRows={2}
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={vm.menuForm.control}
          name="image"
          render={({ field, fieldState }) => (
            <CommonUpload
              label="Item picture"
              accept="image"
              value={field.value}
              onChange={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <div className="menu-add-action">
          <CommonButton variant="outlined" onClick={() => void vm.add()}>
            Add item
          </CommonButton>
        </div>
      </div>
      {vm.items.length > 0 && (
        <Typography variant="h6" sx={{ mt: 3 }}>
          Your menu ({vm.items.length})
        </Typography>
      )}
      {vm.items.map((item, i) => (
        <MenuItemRow
          key={`${item.name}-${i}`}
          item={item}
          onRemove={() => vm.remove(i)}
        />
      ))}
      {vm.form.formState.errors.menuItems && (
        <FormHelperText error>
          {vm.form.formState.errors.menuItems.message ||
            vm.form.formState.errors.menuItems.root?.message ||
            "Check your menu items."}
        </FormHelperText>
      )}
    </>
  );
}
