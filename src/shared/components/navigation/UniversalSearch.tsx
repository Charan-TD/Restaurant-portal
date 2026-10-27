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
  /** Already matched by the server, so it is never filtered again here. */
  remote?: boolean;
}
const pageFilter = createFilterOptions<SearchOption>({
  stringify: (option) => `${option.label} ${option.group}`,
  limit: 12,
});
/** Pages are matched here; results the server found are all kept. */
const filter = (
  options: SearchOption[],
  state: Parameters<typeof pageFilter>[1],
) => [
  ...pageFilter(
    options.filter((o) => !o.remote),
    state,
  ),
  ...options.filter((o) => o.remote),
];
export function UniversalSearch({
  options,
  onSelect,
  onQuery,
  loading,
}: {
  options: SearchOption[];
  onSelect: (option: SearchOption) => void;
  /** Called with the text as it is typed, so results can be fetched. */
  onQuery?: (text: string) => void;
  loading?: boolean;
}) {
  return (
    <Autocomplete
      options={options}
      groupBy={(option) => option.group}
      filterOptions={filter}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.href === b.href && a.label === b.label}
      value={null}
      loading={loading}
      onInputChange={(_, text, reason) => {
        if (reason !== "reset") onQuery?.(text);
      }}
      blurOnSelect
      autoHighlight
      clearOnBlur
      popupIcon={null}
      noOptionsText="No matches"
      loadingText="Searching…"
      onChange={(_, option) => option && onSelect(option)}
      sx={{
        flex: 1,
        // Takes all the room between the greeting and the buttons.
        ml: { md: 2 },
        minWidth: 0,
      }}
      renderInput={(params) => (
        <CommonTextField
          {...params}
          placeholder="Search orders, customers, items…"
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
                  <SearchOutlined />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "12px",
                bgcolor: "background.paper",
                fontSize: 15,
                minHeight: 44,
                "& fieldset": { borderColor: "divider" },
              },
            },
          }}
        />
      )}
    />
  );
}
