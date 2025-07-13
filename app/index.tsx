// app/index.tsx
import { useAudioPlayer } from "expo-audio";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Footer from "../components/Footer";
import Grid from "../components/Grid";
import Sidebar from "../components/Sidebar";
import { formatTime } from "../utils/formatTime";
import { generateNumberPairs } from "../utils/generateNumbers";

const audioSource = require("../assets/tap.mp3");

// Cross-platform best score storage
const bestScoreStorage = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      return Promise.resolve(localStorage.getItem(key));
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  },
};

export default function HomeScreen() {
  // Helper to persist and load best scores
  const BEST_SCORES_KEY = "numberGameBestScores";
  const numberOfLevels = [3, 4, 5, 6, 7]; // Add more levels if needed

  // Load best scores from storage on mount
  useEffect(() => {
    (async () => {
      const stored = await bestScoreStorage.getItem(BEST_SCORES_KEY);
      if (stored) {
        try {
          setBestScores(JSON.parse(stored));
        } catch {}
      }
    })();
  }, []);
  const [showHistory, setShowHistory] = useState(false);
  const [bestScores, setBestScores] = useState<{ [key: number]: number }>({});
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [level, setLevel] = useState(3);
  const [grid, setGrid] = useState<number[]>([]);
  const [expected, setExpected] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const timerIdRef = useRef<number | null>(null);
  // No sound state needed for expo-audio
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState([3]);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    const { initial } = generateNumberPairs(level);
    setGrid(initial);
    setExpected(1);
    setStartTime(null);
    setEndTime(null);
    setElapsed(0);
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    // Cleanup timer on unmount
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [level]);

  const handleTap = async (num: number) => {
    // Always play tap sound, reset if needed

    if (num !== expected) return;

    if (expected === 1) {
      const now = Date.now();
      setStartTime(now);
      setElapsed(0);
      timerIdRef.current = setInterval(() => {
        setElapsed(Date.now() - now);
      }, 100);
    }

    player.seekTo(0);
    await player.play();

    const index = grid.indexOf(num);
    const newGrid = [...grid];
    newGrid[index] =
      expected + level * level <= level * level * 2
        ? expected + level * level
        : 0;

    setGrid(newGrid);
    setExpected(expected + 1);

    if (expected + 1 > level * level * 2) {
      // Calculate new score
      const newScore = Date.now() - (startTime ?? Date.now());
      setEndTime(Date.now());
      // Update best score for this grid size and persist
      setBestScores((prev) => {
        const prevScore = prev[level];
        let updated = prev;
        if (!prevScore || (newScore > 0 && newScore < prevScore)) {
          updated = { ...prev, [level]: newScore };
          bestScoreStorage.setItem(BEST_SCORES_KEY, JSON.stringify(updated));
        }
        return updated;
      });
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      setShowConfetti(true); // trigger confetti
      setShowEndOptions(true); // show next/replay buttons
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Confetti overlay - covers entire screen, always on top */}
      {showConfetti && confettiOrigin && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          <ConfettiCannon count={200} origin={confettiOrigin} fadeOut={false} />
        </View>
      )}
      {/* End of game options */}
      {showEndOptions && (
        <View style={styles.endOptionsOverlay}>
          <View style={styles.endOptionsBox}>
            <Text style={styles.endOptionsTitle}>Level Complete!</Text>
            <Text style={styles.endOptionsScore}>
              Your Time:{" "}
              {formatTime(endTime && startTime ? endTime - startTime : 0)}
            </Text>
            <View style={styles.endOptionsButtons}>
              <Text
                style={styles.endOptionsBtn}
                onPress={() => {
                  // Next level
                  setShowEndOptions(false);
                  setShowConfetti(false);
                  const nextLevel = level + 1;
                  if (
                    numberOfLevels.includes(nextLevel) &&
                    !unlockedLevels.includes(nextLevel)
                  ) {
                    setUnlockedLevels((prev) => [...prev, nextLevel]);
                  }
                  setLevel(nextLevel);
                }}
              >
                Next
              </Text>
              <Text
                style={styles.endOptionsBtn}
                onPress={() => {
                  // Replay
                  setShowEndOptions(false);
                  setShowConfetti(false);
                  setEndTime(null);
                  setStartTime(null);
                  setElapsed(0);
                  setExpected(1);
                  const { initial } = generateNumberPairs(level);
                  setGrid(initial);
                }}
              >
                Replay
              </Text>
            </View>
          </View>
        </View>
      )}
      {/* Custom header with hamburger left and history right */}
      <View style={styles.customHeader}>
        <View style={styles.headerLeft}>
          <Text
            style={styles.hamburger}
            onPress={() => setSidebarVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Open sidebar"
          >
            ☰
          </Text>
        </View>
        <Text style={styles.headerTitle}>Number Grid Game</Text>
        <View style={styles.headerRight}>
          <Text
            style={styles.historyBtn}
            onPress={() => setShowHistory(true)}
            accessibilityRole="button"
            accessibilityLabel="Show best scores"
          >
            🏆
          </Text>
        </View>
      </View>
      {/* History modal */}
      {showHistory && (
        <View style={styles.historyModal}>
          <View style={styles.historyContent}>
            <Text style={styles.historyTitle}>Best Scores</Text>
            {numberOfLevels.map((sz) => {
              let score = bestScores[sz];
              let isLatest = false;
              if (sz === level && endTime && startTime) {
                score = endTime - startTime;
                isLatest = true;
              }
              return (
                <Text key={sz} style={styles.historyRow}>
                  {`${sz}x${sz}: `}
                  {typeof score === "number" && score > 0
                    ? formatTime(score)
                    : "--:--:--"}
                  {isLatest ? " (Latest)" : ""}
                </Text>
              );
            })}
            <Text
              style={styles.closeHistoryBtn}
              onPress={() => setShowHistory(false)}
            >
              Close
            </Text>
          </View>
        </View>
      )}
      <View style={styles.mainContent}>
        {sidebarVisible && (
          <Text
            style={styles.overlay}
            onPress={() => setSidebarVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close sidebar"
          />
        )}
        <Sidebar
          numberOfLevels={numberOfLevels}
          visible={sidebarVisible}
          level={level}
          unlockedLevels={unlockedLevels}
          onSelectLevel={(lvl: number) => {
            if (unlockedLevels.includes(lvl)) {
              setLevel(lvl);
              setSidebarVisible(false);
            }
          }}
        />
        <View style={styles.gameArea}>
          {/* Time section in a styled box */}
          <View style={styles.timeBox}>
            <Text style={styles.timeBoxValue}>
              {startTime && !endTime
                ? formatTime(elapsed)
                : endTime && startTime
                ? formatTime(endTime - startTime)
                : "00:00:00"}
            </Text>
          </View>
          <Text style={styles.level}>
            Level: {level}x{level}
          </Text>
          <View
            style={styles.gridWrapper}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setConfettiOrigin({
                x: x + width / 2,
                y: y + height / 2,
              });
            }}
          >
            <Grid grid={grid} size={level} onTilePress={handleTap} />
          </View>
        </View>
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  endOptionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 1001,
    justifyContent: "center",
    alignItems: "center",
  },
  endOptionsBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    minWidth: 220,
    alignItems: "center",
    boxShadow: "0px 2px 8px rgba(0, 122, 255, 0.12)",
  },
  endOptionsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 10,
  },
  endOptionsScore: {
    fontSize: 18,
    color: "#333",
    marginBottom: 18,
  },
  endOptionsButtons: {
    flexDirection: "row",
    gap: 18,
  },
  endOptionsBtn: {
    fontSize: 18,
    color: "#fff",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 8,
    fontWeight: "bold",
    overflow: "hidden",
  },
  customHeader: {
    height: 60,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    boxShadow: "0px 2px 8px rgba(0, 122, 255, 0.12)",
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
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  historyBtn: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
  },
  historyModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  historyContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    minWidth: 240,
    alignItems: "center",
    boxShadow: "0px 2px 8px rgba(0, 122, 255, 0.12)",
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
  },
  historyRow: {
    fontSize: 18,
    color: "#333",
    marginBottom: 6,
  },
  closeHistoryBtn: {
    marginTop: 18,
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eaf0fb",
    overflow: "hidden",
  },
  confettiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: "none",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.01)",
    zIndex: 15,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    height: 60,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 110,
    backgroundColor: "#eaf0fb",
    paddingVertical: 24,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#d0d7e5",
    alignItems: "center",
    gap: 10,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#007AFF",
  },
  gameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  gridWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    boxShadow: "0px 2px 8px rgba(0, 122, 255, 0.12)",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    maxWidth: 400,
    alignSelf: "center",
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
  level: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#007AFF",
  },
  timer: { fontSize: 20, marginBottom: 16, color: "#333", fontWeight: "bold" },
  footer: {
    height: 44,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  timeBox: {
    width: 200,
    backgroundColor: "#eaf0fb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    boxShadow: "0px 2px 8px rgba(0, 122, 255, 0.12)",
    borderWidth: 1,
    borderColor: "#d0d7e5",
    flexDirection: "row",
    gap: 8,
  },
  timeBoxLabel: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  timeBoxValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
});
