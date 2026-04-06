import React from "react";
import ReactDOM from "react-dom/client";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import App from "./App";
import "./style.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#004d40",
      light: "#3a7d72",
      dark: "#00251a",
    },
    secondary: {
      main: "#bf360c",
    },
    background: {
      default: "#f4efe7",
      paper: "rgba(255, 251, 245, 0.82)",
    },
    text: {
      primary: "#1f2522",
      secondary: "#4c544e",
    },
  },
  shape: {
    borderRadius: 22,
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI Variable Text", sans-serif',
    h1: {
      fontFamily: '"Rockwell", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontFamily: '"Rockwell", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontFamily: '"Rockwell", "Georgia", serif',
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(18px)",
          boxShadow: "0 22px 60px rgba(38, 33, 23, 0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            minHeight: "100vh",
            background:
              "radial-gradient(circle at top left, rgba(214, 168, 102, 0.32), transparent 22%), radial-gradient(circle at right 20%, rgba(0, 77, 64, 0.14), transparent 18%), linear-gradient(135deg, #f7f1e7 0%, #efe4d0 48%, #efece6 100%)",
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
