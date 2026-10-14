"use client";
import {
  Autocomplete,
  InputAdornment,
  createFilterOptions,
} from "@mui/material";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { CommonTextField } from "../form/CommonTextField";
export interface SearchOption {
  label: string;
  href: string;
  /** Heading the option is listed under, e.g. "Orders" or "Payments". */
  group: string;
}
const filter = createFilterOptions<SearchOption>({
  stringify: (option) => `${option.label} ${option.group}`,
  limit: 12,
});
export function UniversalSearch({
  options,
  onSelect,
}: {
  options: SearchOption[];
  onSelect: (option: SearchOption) => void;
}) {
  return (
    <Autocomplete
      options={options}
      groupBy={(option) => option.group}
      filterOptions={filter}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.href === b.href && a.label === b.label}
      value={null}
      blurOnSelect
      autoHighlight
      clearOnBlur
      popupIcon={null}
      noOptionsText="No matches"
      onChange={(_, option) => option && onSelect(option)}
      sx={{ flex: 1, minWidth: 0, maxWidth: 440 }}
      renderInput={(params) => (
        <CommonTextField
          {...params}
          size="small"
          placeholder="Search orders, menu, payments…"
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": "Search the portal",
            },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 999,
                bgcolor: "action.hover",
                "& fieldset": { borderColor: "transparent" },
              },
            },
          }}
        />
      )}
    />
  );
}
