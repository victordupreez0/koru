import { createTheme } from "@mui/material/styles";

/*
 * Chart colours mirror the Koru tokens in the `@theme` block of src/index.css.
 * MUI X Charts paints SVG and builds gradients from these values, so they are
 * kept as hex literals here. Change the token and this map together.
 */
export const koruChartColors = {
  primary: "#3c0078", // koru-primary
  primaryContainer: "#eadcff", // koru-primary-container
  accent: "#ff8731", // koru-accent
  success: "#146c2e", // koru-success
  warning: "#8f4c00", // koru-warning
  error: "#b3261e", // koru-error
  info: "#0b57d0", // koru-info
  onSurface: "#1b1b1f", // koru-on-surface
  onSurfaceVariant: "#45464f", // koru-on-surface-variant
  outline: "#767680", // koru-outline
  outlineVariant: "#d0d4df", // koru-outline-variant
  outlineFaint: "#eceef4", // koru-outline-faint
  surface: "#ffffff", // koru-surface-container-lowest
};

/* Categorical series order: the koru-stat-* tokens, led by the brand primary. */
export const koruSeriesPalette = [
  "#3c0078", // koru-primary
  "#0f8fe8", // koru-stat-sky
  "#f27a1a", // koru-stat-orange
  "#1e9e57", // koru-stat-green
  "#6d3df5", // koru-stat-violet
  "#5a5d6b", // koru-stat-slate
];

export const koruChartTheme = createTheme({
  palette: {
    primary: { main: koruChartColors.primary },
    error: { main: koruChartColors.error },
    warning: { main: koruChartColors.warning },
    success: { main: koruChartColors.success },
    info: { main: koruChartColors.info },
    text: {
      primary: koruChartColors.onSurface,
      secondary: koruChartColors.onSurfaceVariant,
    },
    divider: koruChartColors.outlineVariant,
    background: { paper: koruChartColors.surface },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "inherit" },
});
