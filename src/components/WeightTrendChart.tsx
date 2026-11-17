import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";
import { WeightTrendChartProps } from "@/interfaces/components";

const CHART_HEIGHT = 164;
const INSET_X = 12;
const INSET_Y = 18;

function shortDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WeightTrendChart({ checkIns }: WeightTrendChartProps) {
  const [width, setWidth] = useState(0);
  const values = checkIns.map((checkIn) => checkIn.weight);
  const minWeight = Math.min(...values);
  const maxWeight = Math.max(...values);
  const points = useMemo(() => {
    if (width <= 0 || checkIns.length === 0) return [];

    const innerWidth = Math.max(width - INSET_X * 2, 1);
    const weightPadding = Math.max((maxWeight - minWeight) * 0.2, Math.abs(maxWeight) * 0.015, 0.25);
    const plotMin = minWeight - weightPadding;
    const plotMax = maxWeight + weightPadding;
    const plotHeight = CHART_HEIGHT - INSET_Y * 2;
    const plotRange = plotMax - plotMin;

    return checkIns.map((checkIn, index) => ({
      x:
        INSET_X +
        (checkIns.length === 1 ? innerWidth / 2 : (index / (checkIns.length - 1)) * innerWidth),
      y: INSET_Y + ((plotMax - checkIn.weight) / plotRange) * plotHeight,
    }));
  }, [checkIns, maxWeight, minWeight, width]);

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`
    : "";

  return (
    <View
      accessible
      accessibilityLabel={`Weight trend from ${values[0]?.toFixed(1)} kilograms to ${values[values.length - 1]?.toFixed(1)} kilograms`}
    >
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeValue}>Low {minWeight.toFixed(1)} kg</Text>
        <Text style={styles.rangeValue}>High {maxWeight.toFixed(1)} kg</Text>
      </View>

      <View onLayout={handleLayout} style={styles.plot}>
        {width > 0 && (
          <Svg
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="weightTrendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#1675D1" stopOpacity="0.18" />
                <Stop offset="1" stopColor="#1675D1" stopOpacity="0.01" />
              </LinearGradient>
            </Defs>

            {[0, 1, 2, 3].map((line) => {
              const y = INSET_Y + ((CHART_HEIGHT - INSET_Y * 2) / 3) * line;
              return (
                <Line
                  key={`grid-${line}`}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#E5ECF4"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
              );
            })}

            {points.length > 1 && (
              <>
                <Path d={areaPath} fill="url(#weightTrendFill)" />
                <Path
                  d={linePath}
                  fill="none"
                  stroke="#1675D1"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {points.map((point, index) => (
              <Circle
                key={checkIns[index].id}
                cx={point.x}
                cy={point.y}
                r={5}
                fill="#FFFFFF"
                stroke="#1675D1"
                strokeWidth={3}
              />
            ))}
          </Svg>
        )}
      </View>

      <View style={styles.dateLabels}>
        <Text style={styles.axisLabel}>{shortDate(checkIns[0].createdAt)}</Text>
        <Text style={styles.axisLabel}>
          {shortDate(checkIns[checkIns.length - 1].createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rangeValue: { color: "#7A8699", fontSize: 11, fontWeight: "600" },
  plot: {
    width: "100%",
    height: CHART_HEIGHT,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#FAFCFF",
  },
  dateLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  axisLabel: { color: "#7A8699", fontSize: 11 },
});
