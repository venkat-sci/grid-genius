import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface SidebarProps {
  visible: boolean;
  level: number;
  unlockedLevels: number[];
  numberOfLevels: number[];
  onSelectLevel: (lvl: number) => void;
}

const SIDEBAR_WIDTH = 150;

// Cross-platform best score storage
const bestScoreStorage = {
  async getItem(key: string) {
    if (typeof window !== "undefined" && window.localStorage) {
      return Promise.resolve(localStorage.getItem(key));
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
};

export default function Sidebar(props: SidebarProps) {
  const { visible, level, unlockedLevels, numberOfLevels, onSelectLevel } =
    props;
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  // Compute unlocked levels from both prop and persisted best scores
  const [persistedUnlocked, setPersistedUnlocked] =
    useState<number[]>(unlockedLevels);

  useEffect(() => {
    async function fetchUnlocked() {
      let bestScoresRaw = await bestScoreStorage.getItem(
        "numberGameBestScores"
      );
      let bestScores: { [key: number]: number } = {};
      if (bestScoresRaw) {
        try {
          bestScores = JSON.parse(bestScoresRaw);
        } catch {}
      }
      const unlockedFromScores = Object.keys(bestScores).map(Number);
      setPersistedUnlocked(
        Array.from(new Set([...unlockedLevels, ...unlockedFromScores]))
      );
    }
    fetchUnlocked();
  }, [unlockedLevels]);

  // Always use persistedUnlocked for unlocking and selection
  const handleSelectLevel = (lvl: number) => {
    if (persistedUnlocked.includes(lvl)) {
      onSelectLevel(lvl);
    }
  };

  return (
    <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
      <Text style={styles.sidebarTitle}>Select Grid</Text>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: 24,
        }}
      >
        {numberOfLevels.map((lvl) => {
          const unlocked = persistedUnlocked.includes(lvl);
          return (
            <TouchableOpacity
              key={lvl}
              onPress={() => handleSelectLevel(lvl)}
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
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lockedLevel: {
    opacity: 0.5,
    color: "#7b8794",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#16213e", // attractive deep blue
    paddingVertical: 24,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#0d1b2a",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#f6c700", // gold accent
    letterSpacing: 1,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#23395d", // muted blue
    fontWeight: "bold",
    fontSize: 17,
    color: "#f6c700",
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedLevel: {
    backgroundColor: "#f6c700",
    color: "#23395d",
  },
});
