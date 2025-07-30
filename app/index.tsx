import { useAudioPlayer } from "expo-audio";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import Grid from "../components/Grid";
import Header from "../components/Header";
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
  const numberOfLevels = useMemo(() => [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []); // Add more levels if needed

  const [showHistory, setShowHistory] = useState(false);
  const [bestScores, setBestScores] = useState<{ [key: number]: number }>({});
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Start with 3, will update after loading best scores
  const [level, setLevel] = useState(3);
  const [grid, setGrid] = useState<number[]>([]);
  const [expected, setExpected] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isColorfulTiles, setIsColorfulTiles] = useState(false);
  const timerIdRef = useRef<number | null>(null);
  // No sound state needed for expo-audio
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState([3]);
  const [showHelp, setShowHelp] = useState(false);

  // Load best scores from storage on mount and set initial level
  useEffect(() => {
    (async () => {
      const stored = await bestScoreStorage.getItem(BEST_SCORES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBestScores(parsed);
          // Find all unlocked levels (including next unlockable)
          const unlocked = Object.keys(parsed).map(Number);
          let allUnlocked = [...unlocked];
          // Add next level if it should be unlocked
          unlocked.forEach((lvl) => {
            const nextLevel = lvl + 1;
            if (
              numberOfLevels.includes(nextLevel) &&
              !allUnlocked.includes(nextLevel)
            ) {
              allUnlocked.push(nextLevel);
            }
          });
          // Only keep allowed levels
          allUnlocked = allUnlocked.filter((lvl) =>
            numberOfLevels.includes(lvl)
          );
          const maxUnlocked =
            allUnlocked.length > 0 ? Math.max(...allUnlocked) : 3;
          setLevel(maxUnlocked);
          setUnlockedLevels((prev) => {
            const all = Array.from(new Set([...prev, ...allUnlocked])).sort(
              (a, b) => a - b
            );
            return all;
          });
        } catch {}
      }
    })();
  }, [numberOfLevels]);

  // Sync unlockedLevels with bestScores and next level after completion
  useEffect(() => {
    // Unlock all levels present in bestScores
    const unlockedFromScores = Object.keys(bestScores).map(Number);
    let levelsToUnlock = [...unlockedLevels];
    unlockedFromScores.forEach((lvl) => {
      if (!levelsToUnlock.includes(lvl)) levelsToUnlock.push(lvl);
      // Also unlock next level if score exists for current
      const nextLevel = lvl + 1;
      if (
        numberOfLevels.includes(nextLevel) &&
        !levelsToUnlock.includes(nextLevel)
      ) {
        levelsToUnlock.push(nextLevel);
      }
    });
    // Remove duplicates and sort
    levelsToUnlock = Array.from(new Set(levelsToUnlock)).sort((a, b) => a - b);
    if (
      levelsToUnlock.length !== unlockedLevels.length ||
      !levelsToUnlock.every((lvl, i) => unlockedLevels[i] === lvl)
    ) {
      setUnlockedLevels(levelsToUnlock);
    }
  }, [bestScores, numberOfLevels, unlockedLevels]);
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
    // Only play sound if enabled
    if (num !== expected) return;
    if (expected === 1) {
      const now = Date.now();
      setStartTime(now);
      setElapsed(0);
      timerIdRef.current = setInterval(() => {
        setElapsed(Date.now() - now);
      }, 100);
    }
    if (isSoundEnabled) {
      player.seekTo(0);
      await player.play();
    }

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
    <SafeAreaView style={styles.outerContainer}>
      {/* Remove LinearGradient background, revert to solid color */}
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
      {/* Custom header moved to Header component */}
      <Header
        onHamburgerPress={() => setSidebarVisible((v) => !v)}
        onHistoryPress={() => setShowHistory(true)}
        onHelpPress={() => setShowHelp(true)}
        title="Grid Genius"
      />
      {/* History modal */}
      {showHistory && (
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.historyTitle}>Best Scores</Text>
            <Text
              style={styles.closeIcon}
              onPress={() => setShowHistory(false)}
              accessibilityLabel="Close history"
            >
              ×
            </Text>
          </View>
          <View style={styles.historyScroll}>
            {numberOfLevels.map((sz) => {
              let score = bestScores[sz];
              let isLatest = false;
              const displayAll = typeof score === "number" && score > 0;
              if (sz === level && endTime && startTime) {
                score = endTime - startTime;
                isLatest = true;
              }
              if (!displayAll) {
                return null;
              }
              // For now, use current date as placeholder
              let dateStr = new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              return (
                <View key={sz} style={styles.historyRowEntry}>
                  <Text style={styles.historyRowLabel}>{`${sz}x${sz}`}</Text>
                  <Text style={styles.historyRowValue}>
                    {displayAll ? formatTime(score) : "--:--:--"}
                  </Text>
                  <Text style={styles.historyRowDate}>{dateStr}</Text>
                  {isLatest ? (
                    <Text style={styles.latestBadge}>Latest</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </SafeAreaView>
      )}
      {showHelp && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Overlay to catch outside touches */}
          <Text
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(20,30,50,0.96)",
              zIndex: 1,
            }}
            onPress={() => setShowHelp(false)}
            accessibilityLabel="Close help popup"
          />
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 28,
              maxWidth: 340,
              width: "100%",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 8,
              zIndex: 2,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "rgba(20,30,50,0.96)",
                marginBottom: 12,
              }}
            >
              How to Play Grid Genius
            </Text>
            <View style={{ marginBottom: 18, alignSelf: "stretch" }}>
              {[
                "Tap the numbers in order, starting from 1.",
                "Each grid has two sets of numbers. After finishing the first set, continue with the next.",
                "Complete the grid as fast as possible to set a best score!",
                "Unlock new levels by beating previous ones.",
                "Use the sidebar to switch levels, and toggles for sound/colorful tiles.",
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, color: "#1a2236", marginRight: 8 }}
                  >
                    •
                  </Text>
                  <Text style={{ fontSize: 16, color: "#333", flex: 1 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              style={{
                fontSize: 18,
                color: "#fff",
                backgroundColor: "rgba(20,30,50,0.96)",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 22,
                fontWeight: "bold",
                overflow: "hidden",
                marginTop: 8,
              }}
              onPress={() => setShowHelp(false)}
              accessibilityLabel="Close help"
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
            setLevel(lvl);
            setSidebarVisible(false);
          }}
        />
        <View style={styles.gameArea}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ marginRight: 8 }}>Sound</Text>
            <Switch
              value={isSoundEnabled}
              onValueChange={setIsSoundEnabled}
              thumbColor={isSoundEnabled ? "#1a2236" : "#ccc"}
              trackColor={{ false: "#e0e0e0", true: "#b3d1ff" }}
            />
            <Text style={{ marginLeft: 16, marginRight: 8 }}>Colorful</Text>
            <Switch
              value={isColorfulTiles}
              onValueChange={setIsColorfulTiles}
              thumbColor={isColorfulTiles ? "#1a2236" : "#ccc"}
              trackColor={{ false: "#e0e0e0", true: "#b3d1ff" }}
            />
          </View>
          <Text style={styles.level}>
            Level: {level}x{level}
          </Text>
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
            <Grid
              grid={grid}
              size={level}
              onTilePress={handleTap}
              isColorful={isColorfulTiles}
            />
          </View>
        </View>
      </View>
      <Footer onHelpPress={() => setShowHelp(true)} />
    </SafeAreaView>
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
    color: "#1a2236",
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
    backgroundColor: "#1a2236",
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 8,
    fontWeight: "bold",
    overflow: "hidden",
  },
  customHeader: {
    height: 60,
    backgroundColor: "#1a2236", // dark navy
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
  fullScreenModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a2236",
    zIndex: 1000,
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: "#232b3e",
    borderBottomWidth: 1,
    borderBottomColor: "#232b3e",
  },
  closeIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "left",
  },
  historyScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: "#1a2236",
  },
  historyRowEntry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#232b3e",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  historyRowLabel: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    flex: 1,
  },
  historyRowValue: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
    marginLeft: 12,
    flex: 1,
    textAlign: "center",
  },
  historyRowDate: {
    fontSize: 15,
    color: "#b0b8c1",
    marginLeft: 12,
    flex: 1,
    textAlign: "right",
  },
  latestBadge: {
    fontSize: 13,
    color: "#fff",
    backgroundColor: "#1a2236",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
    fontWeight: "bold",
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
    backgroundColor: "#f5f7fa", // fallback, gradient overlays
  },
  header: {
    height: 60,
    backgroundColor: "#1a2236",
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
    color: "#1a2236",
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
    color: "#1a2236",
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  selectedLevel: {
    backgroundColor: "#1a2236",
    color: "#fff",
  },
  level: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a2236",
  },
  timer: { fontSize: 20, marginBottom: 16, color: "#333", fontWeight: "bold" },
  footer: {
    height: 48,
    backgroundColor: "#0d1b2a", // deep navy blue
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1a2236",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
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
    color: "#1a2236",
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
