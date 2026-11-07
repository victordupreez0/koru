import { ThemeProvider } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { koruChartColors as c, koruChartTheme, koruSeriesPalette } from "./koruChartTheme";

const tickLabelStyle = { fontSize: 11, fontWeight: 600, fill: c.outline };

/* Shared axis/grid styling so every chart reads as one system. */
const baseSx = {
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: c.outlineVariant },
  "& .MuiChartsGrid-line": { stroke: c.outlineFaint },
};

export function KoruChartsProvider({ children }) {
  return <ThemeProvider theme={koruChartTheme}>{children}</ThemeProvider>;
}

/**
 * Area line chart for a single trend over time (e.g. monthly grade average).
 * `data` is an array of numbers, `labels` the matching x-axis labels.
 */
export function KoruTrendChart({
  data,
  labels,
  label = "Value",
  color = c.primary,
  height = 200,
  valueFormatter = v => (v == null ? "—" : `${v}%`),
  yMax = 100,
}) {
  return (
    <KoruChartsProvider>
      <LineChart
        height={height}
        series={[
          {
            data,
            label,
            color,
            area: true,
            curve: "monotoneX",
            showMark: false,
            valueFormatter,
          },
        ]}
        xAxis={[{ scaleType: "point", data: labels, tickLabelStyle, disableLine: true, disableTicks: true }]}
        yAxis={[{ min: 0, max: yMax, width: 44, tickLabelStyle, disableLine: true, disableTicks: true, tickNumber: 4, valueFormatter: v => `${v}%` }]}
        grid={{ horizontal: true }}
        hideLegend
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
        sx={{
          ...baseSx,
          "& .MuiLineChart-line": { strokeWidth: 2.5 },
          "& .MuiLineChart-area": { fillOpacity: 0.12 },
        }}
      />
    </KoruChartsProvider>
  );
}

/**
 * Horizontal bar chart for a short list of categories.
 * `items` = [{ label, value, color? }]. Bars fall back to the Koru palette.
 */
export function KoruBarList({
  items,
  label = "Count",
  color,
  rowHeight = 34,
  labelWidth = 64,
  valueFormatter = v => `${v ?? 0}`,
  xMax,
}) {
  // Leave headroom past the longest bar so its outside label isn't clipped.
  const domainMax = Math.max(xMax ?? 0, ...items.map(it => it.value ?? 0), 1) * 1.18;
  const colors = items.map((it, i) => it.color || color || koruSeriesPalette[i % koruSeriesPalette.length]);
  return (
    <KoruChartsProvider>
      <BarChart
        layout="horizontal"
        height={items.length * rowHeight + 8}
        dataset={items}
        series={[{ dataKey: "value", label, valueFormatter, barLabel: item => `${item.value ?? 0}`, barLabelPlacement: "outside" }]}
        yAxis={[
          {
            scaleType: "band",
            dataKey: "label",
            width: labelWidth,
            tickLabelStyle: { ...tickLabelStyle, fill: c.onSurfaceVariant },
            disableLine: true,
            disableTicks: true,
            categoryGapRatio: 0.35,
            colorMap: { type: "ordinal", values: items.map(it => it.label), colors },
          },
        ]}
        xAxis={[{ min: 0, max: domainMax, position: "none" }]}
        borderRadius={6}
        hideLegend
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        sx={{
          ...baseSx,
          "& .MuiBarChart-label": { fontSize: 12, fontWeight: 700, fill: c.onSurface },
        }}
      />
    </KoruChartsProvider>
  );
}

/** Circular percentage gauge with the value in the centre. */
export function KoruGauge({ value, size = 56, color = c.primary, thickness = "82%" }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <KoruChartsProvider>
      <Gauge
        width={size}
        height={size}
        value={safe}
        valueMin={0}
        valueMax={100}
        innerRadius={thickness}
        outerRadius="100%"
        cornerRadius="50%"
        text={({ value: v }) => `${Math.round(v ?? 0)}`}
        margin={0}
        aria-label={`${Math.round(safe)} percent`}
        sx={{
          [`& .${gaugeClasses.valueArc}`]: { fill: color },
          [`& .${gaugeClasses.referenceArc}`]: { fill: c.outlineFaint },
          [`& .${gaugeClasses.valueText} text`]: {
            fontSize: Math.round(size * 0.25),
            fontWeight: 800,
            fill: c.onSurface,
          },
        }}
      />
    </KoruChartsProvider>
  );
}
