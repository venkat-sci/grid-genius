import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

interface SidebarProps {
  visible: boolean;
  level: number;
  unlockedLevels: number[];
  numberOfLevels: number[];
  onSelectLevel: (lvl: number) => void;
}

const SIDEBAR_WIDTH = 150;

export default function Sidebar({
  visible,
  level,
  unlockedLevels,
  numberOfLevels,
  onSelectLevel,
}: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
      <Text style={styles.sidebarTitle}>Select Grid</Text>
      {numberOfLevels.map((lvl) => {
        const unlocked = unlockedLevels.includes(lvl);
        return (
          <TouchableOpacity
            key={lvl}
            onPress={() => unlocked && onSelectLevel(lvl)}
            disabled={!unlocked}
          >
            <Text
              style={[
                styles.levelButton,
                level === lvl && styles.selectedLevel,
                !unlocked && styles.lockedLevel,
              ]}
            >
              {lvl}x{lvl} {unlocked ? "🔓" : "🔒"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lockedLevel: {
    opacity: 0.5,
    color: "#999",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#eaf0fb",
    paddingVertical: 24,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#d0d7e5",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#007AFF",
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#e0e7ff",
    fontWeight: "bold",
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  selectedLevel: {
    backgroundColor: "#007AFF",
    color: "#fff",
  },
});
