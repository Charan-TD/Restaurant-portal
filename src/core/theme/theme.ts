import { createTheme } from "@mui/material/styles";
// Migrated unchanged from the original App.jsx theme.
export const theme = createTheme({
  palette: {
    primary: { main: "#303f36" },
    background: { default: "#f6f7f6" },
    text: { primary: "#202621", secondary: "#68706a" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: { fontWeight: 700, fontSize: 28 },
    h5: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: { MuiButton: { styleOverrides: { root: { minHeight: 44 } } } },
});
