import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface HeaderProps {
  onHamburgerPress: () => void;
  onHistoryPress: () => void;
  onHelpPress?: () => void;
  title?: string;
}

export default function Header({
  onHamburgerPress,
  onHistoryPress,
  onHelpPress,
  title = "Grid Genius",
}: HeaderProps) {
  return (
    <View style={styles.customHeader}>
      <View style={styles.headerLeft}>
        <Text
          style={styles.hamburger}
          onPress={onHamburgerPress}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar"
        >
          ☰
        </Text>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {onHelpPress && (
          <Text
            style={styles.helpBtn}
            onPress={onHelpPress}
            accessibilityRole="button"
            accessibilityLabel="Show how to play"
          >
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
          </Text>
        )}
        <Text
          style={styles.historyBtn}
          onPress={onHistoryPress}
          accessibilityRole="button"
          accessibilityLabel="Show best scores"
        >
          🏆
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    height: 60,
    backgroundColor: "#1a2236",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#232b3e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  hamburger: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
    paddingVertical: 4,
  },
  headerRight: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  historyBtn: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
    marginLeft: 8,
  },
  helpBtn: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
    marginRight: 8,
  },
});
