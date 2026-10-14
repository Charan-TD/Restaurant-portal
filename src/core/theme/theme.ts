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
    background: { default: "#f5f6f4" },
    text: { primary: "#202621", secondary: "#68706a" },
    divider: "#e6eae6",
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: { fontWeight: 800, fontSize: 28, letterSpacing: "-0.4px" },
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
    MuiTab: { styleOverrides: { root: { textTransform: "none" } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});
/** The signed-in portal uses compact inputs; sign-in and onboarding keep the roomier default. */
export const portalTheme = createTheme(theme, {
  components: { MuiTextField: { defaultProps: { size: "small" } } },
});
