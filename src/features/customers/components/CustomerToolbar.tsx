"use client";

import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

export const dateRanges = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
] as const;
export type DateRange = (typeof dateRanges)[number];

const trigger = {
  height: 44,
  px: 2,
  fontWeight: 500,
  textTransform: "none",
  whiteSpace: "nowrap",
} as const;

function DropdownButton({
  label,
  icon,
  active,
  outlinedPrimary,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  outlinedPrimary?: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Button
      variant="outlined"
      color={outlinedPrimary ? "primary" : "inherit"}
      startIcon={icon}
      endIcon={active ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={active}
      sx={{
        ...trigger,
        ...(!outlinedPrimary && {
          borderColor: "divider",
          color: "text.primary",
        }),
      }}
    >
      {label}
    </Button>
  );
}

/** Search box, date range and "Filter by" menu shared by the customer screens. */
export function CustomerToolbar<T extends string>({
  search,
  onSearch,
  placeholder,
  range,
  onRange,
  filter,
  onFilter,
  filters,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  range: DateRange;
  onRange: (value: DateRange) => void;
  filter: T | null;
  onFilter: (value: T) => void;
  filters: FilterOption<T>[];
}) {
  const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null),
    [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <TextField
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        size="small"
        slotProps={{
          htmlInput: { "aria-label": placeholder },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          flex: "1 1 280px",
          maxWidth: 610,
          "& .MuiOutlinedInput-root": {
            height: 44,
            bgcolor: "#f3f4f2",
            borderRadius: "12px",
          },
          "& fieldset": { border: 0 },
        }}
      />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <DropdownButton
          label={range}
          icon={<CalendarTodayOutlined />}
          active={Boolean(rangeAnchor)}
          onClick={(e) => setRangeAnchor(e.currentTarget)}
        />
        <DropdownButton
          outlinedPrimary
          label="Filter by"
          icon={<FilterAltOutlined />}
          active={Boolean(filterAnchor)}
          onClick={(e) => setFilterAnchor(e.currentTarget)}
        />
      </Box>
      <Menu
        anchorEl={rangeAnchor}
        open={Boolean(rangeAnchor)}
        onClose={() => setRangeAnchor(null)}
      >
        {dateRanges.map((r) => (
          <MenuItem
            key={r}
            selected={r === range}
            onClick={() => {
              onRange(r);
              setRangeAnchor(null);
            }}
          >
            {r}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        {filters.map((f) => (
          <MenuItem
            key={f.value}
            selected={f.value === filter}
            onClick={() => {
              onFilter(f.value);
              setFilterAnchor(null);
            }}
          >
            <ListItemIcon>{f.icon}</ListItemIcon>
            <ListItemText>{f.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
