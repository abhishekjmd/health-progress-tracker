import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { CheckIn } from "@/interfaces/checkIn";

const PLOT_HEIGHT = 148;
const PLOT_INSET = 12;

function shortDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Props = {
  checkIns: CheckIn[];
};

export function WeightTrendChart({ checkIns }: Props) {
  const [width, setWidth] = useState(0);
  const values = checkIns.map((checkIn) => checkIn.weight);
  const minWeight = Math.min(...values);
  const maxWeight = Math.max(...values);
  const weightRange = maxWeight - minWeight;
  const innerWidth = Math.max(0, width - PLOT_INSET * 2);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const points = checkIns.map((checkIn, index) => {
    const x =
      PLOT_INSET +
      (checkIns.length <= 1 ? innerWidth / 2 : (index / (checkIns.length - 1)) * innerWidth);
    const y =
      weightRange === 0
        ? PLOT_HEIGHT / 2
        : PLOT_INSET +
          ((maxWeight - checkIn.weight) / weightRange) * (PLOT_HEIGHT - PLOT_INSET * 2);
    return { x, y };
  });

  return (
    <View
      accessible
      accessibilityLabel={`Weight trend from ${values[0]?.toFixed(1)} kilograms to ${values[values.length - 1]?.toFixed(1)} kilograms`}
    >
      <View onLayout={handleLayout} style={styles.plot}>
        {[0, 1, 2, 3].map((line) => (
          <View
            key={line}
            style={[styles.gridLine, { top: (PLOT_HEIGHT / 3) * line }]}
          />
        ))}

        {points.slice(1).map((point, index) => {
          const previous = points[index];
          const deltaX = point.x - previous.x;
          const deltaY = point.y - previous.y;
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX);

          return (
            <View
              key={`segment-${checkIns[index + 1].id}`}
              style={[
                styles.segment,
                {
                  left: previous.x,
                  top: previous.y - 1.5,
                  width: length,
                  transform: [{ rotate: `${angle}rad` }],
                },
              ]}
            />
          );
        })}

        {points.map((point, index) => (
          <View
            key={checkIns[index].id}
            style={[styles.point, { left: point.x - 6, top: point.y - 6 }]}
          />
        ))}
      </View>
      <View style={styles.dateLabels}>
        <Text style={styles.axisLabel}>{shortDate(checkIns[0].createdAt)}</Text>
        <Text style={styles.axisLabel}>
          {shortDate(checkIns[checkIns.length - 1].createdAt)}
        </Text>
      </View>
      <View style={styles.rangeLabels}>
        <Text style={styles.axisLabel}>{minWeight.toFixed(1)} kg</Text>
        <Text style={styles.axisLabel}>{maxWeight.toFixed(1)} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    height: PLOT_HEIGHT,
    position: "relative",
    overflow: "visible",
  },
  gridLine: {
    position: "absolute",
    left: PLOT_INSET,
    right: PLOT_INSET,
    height: 1,
    backgroundColor: "#E9EEF5",
  },
  segment: {
    position: "absolute",
    height: 3,
    backgroundColor: "#1675D1",
    borderRadius: 2,
  },
  point: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#1675D1",
    backgroundColor: "#FFFFFF",
  },
  dateLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  axisLabel: { color: "#7A8699", fontSize: 11 },
});
