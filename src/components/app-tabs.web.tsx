import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { StyleSheet, Text, View } from "react-native";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View style={styles.tabBar}>
          <TabTrigger name="index" href="/" style={styles.tab}>
            <Text style={styles.tabLabel}>Dashboard</Text>
          </TabTrigger>
          <TabTrigger name="checkins" href="/checkins" style={styles.tab}>
            <Text style={styles.tabLabel}>Check-ins</Text>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    boxShadow: "0px 2px 12px rgba(23, 43, 77, 0.14)",
  },
  tab: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  tabLabel: { color: "#172B4D", fontSize: 14, fontWeight: "600" },
});
