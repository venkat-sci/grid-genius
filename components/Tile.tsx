// components/Tile.tsx
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface TileProps {
  value: number;
  onPress: () => void;
  gridSize: number;
  tileColor?: string;
}

export default function Tile({
  value,
  onPress,
  gridSize,
  tileColor,
}: TileProps) {
  // Remove zoom animation on tap
  // Tile will fill its parent, so only font size needs to be dynamic
  const fontSize = Math.max(16, 80 / gridSize);

  return (
    <Pressable onPress={onPress} disabled={value === 0} style={{ flex: 1 }}>
      <Animated.View
        style={[styles.tile, { flex: 1, backgroundColor: tileColor || "#eee" }]}
      >
        <Text style={[styles.text, { fontSize }]}>
          {value !== 0 ? value : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
  },
  text: {
    fontWeight: "bold",
  },
});
