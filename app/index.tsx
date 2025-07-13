// app/index.tsx
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Footer from "../components/Footer";
import Grid from "../components/Grid";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { formatTime } from "../utils/formatTime";
import { generateNumberPairs } from "../utils/generateNumbers";

export default function HomeScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [level, setLevel] = useState(3);
  const [grid, setGrid] = useState<number[]>([]);
  const [expected, setExpected] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [timerId, setTimerId] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState([3]);

  useEffect(() => {
    let isMounted = true;
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/tap.mp3")
      );
      if (isMounted) setSound(sound);
    };
    loadSound();

    return () => {
      isMounted = false;
      if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const { initial } = generateNumberPairs(level);
    setGrid(initial);
    setExpected(1);
    setStartTime(null);
    setEndTime(null);
    setElapsed(0);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [level]);

  const handleTap = async (num: number) => {
    if (num !== expected) return;

    if (expected === 1) {
      const now = Date.now();
      setStartTime(now);
      setElapsed(0);
      const id = setInterval(() => {
        setElapsed(Date.now() - now);
      }, 100);
      setTimerId(id);
    }
    if (sound) await sound.replayAsync();

    const index = grid.indexOf(num);
    const newGrid = [...grid];
    newGrid[index] =
      expected + level * level <= level * level * 2
        ? expected + level * level
        : 0;

    setGrid(newGrid);
    setExpected(expected + 1);

    if (expected + 1 > level * level * 2) {
      setEndTime(Date.now());
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      setShowConfetti(true); // trigger confetti
      const nextLevel = level + 1;
      setTimeout(() => {
        setShowConfetti(false);
        // Unlock next level if available
        if (
          [3, 4, 5, 6].includes(nextLevel) &&
          !unlockedLevels.includes(nextLevel)
        ) {
          setUnlockedLevels((prev) => {
            // Unlock and auto-load next level after 5s
            const updated = [...prev, nextLevel];
            setTimeout(() => {
              setLevel(nextLevel);
            }, 5000);
            return updated;
          });
        }
      }, 1500);
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
      <Header onHamburgerPress={() => setSidebarVisible((v) => !v)} />
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
          <Text style={styles.level}>
            Level: {level}x{level}
          </Text>
          <Text style={styles.timer}>
            {startTime && !endTime
              ? `Time: ${formatTime(elapsed)}`
              : endTime && startTime
              ? `Time: ${formatTime(endTime - startTime)}`
              : "Tap 1 to start"}
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
    elevation: 4,
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
});
