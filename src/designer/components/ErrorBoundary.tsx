import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary yakaladi:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 520, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>Bir hata olustu</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: "monospace", wordBreak: "break-word" }}>
            {this.state.error.message}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
            Detaylar icin tarayici konsolunu kontrol edin.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Button variant="outlined" onClick={this.handleReset}>Tekrar Dene</Button>
            <Button variant="contained" onClick={this.handleReload}>Sayfayi Yenile</Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}
