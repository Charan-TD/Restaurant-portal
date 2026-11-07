import { createTheme } from "@mui/material/styles";
// Primary is the Train Dhaba logo orange.
export const theme = createTheme({
  palette: {
    primary: {
      main: "#f26a2e",
      light: "#f58a5c",
      dark: "#d9531a",
      contrastText: "#ffffff",
    },
    // One secondary colour, a deep charcoal green, pairs with the orange.
    secondary: { main: "#26332b", contrastText: "#ffffff" },
    background: { default: "#ffffff" },
    text: { primary: "#202621", secondary: "#68706a" },
    divider: "#e6eae6",
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    // Smaller than the 14px default; every variant scales with it.
    fontSize: 13,
    h4: { fontWeight: 800, fontSize: 24, letterSpacing: "-0.4px" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 10 },
        contained: {
          "&:hover": { boxShadow: "0 6px 16px -6px rgba(242,106,46,.55)" },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 250, enterNextDelay: 100 },
      styleOverrides: {
        tooltip: {
          backgroundColor: "#26332b",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.4,
          padding: "7px 12px",
          borderRadius: 8,
          maxWidth: 260,
          boxShadow: "0 6px 18px rgba(16,24,40,.18)",
        },
        arrow: { color: "#26332b" },
      },
    },
    // One look for the chosen row of every dropdown (the Restaurant type one):
    // a soft primary tint, a little deeper under the pointer.
    // The Select menu and the Autocomplete list share one panel and one row
    // size, so Restaurant type and Cuisines open looking the same.
    MuiMenu: {
      styleOverrides: {
        paper: {
          marginTop: 4,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        },
        list: { paddingTop: 8, paddingBottom: 8 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&&": { minHeight: 44, paddingLeft: 20, paddingRight: 20 },
          "&.Mui-selected": { backgroundColor: "rgba(242, 106, 46, 0.08)" },
          "&.Mui-selected:hover, &.Mui-selected.Mui-focusVisible": {
            backgroundColor: "rgba(242, 106, 46, 0.12)",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          marginTop: 4,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        },
        listbox: { paddingTop: 8, paddingBottom: 8 },
        option: {
          "&&": { minHeight: 44, paddingLeft: 20, paddingRight: 20 },
          '&[aria-selected="true"]': { backgroundColor: "rgba(242, 106, 46, 0.08)" },
          '&[aria-selected="true"].Mui-focused, &[aria-selected="true"]:hover': {
            backgroundColor: "rgba(242, 106, 46, 0.12)",
          },
        },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: "none" } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});
/** The signed-in portal uses compact inputs; sign-in and onboarding keep the roomier default. */
export const portalTheme = createTheme(theme, {
  components: {
    MuiTextField: { defaultProps: { size: "small" } },
    MuiButton: { styleOverrides: { root: { minHeight: 38 } } },
  },
});
