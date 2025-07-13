// components/Tile.tsx
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface TileProps {
  value: number;
  onPress: () => void;
  gridSize: number;
}

export default function Tile({ value, onPress, gridSize }: TileProps) {
  // Remove zoom animation on tap
  // Tile will fill its parent, so only font size needs to be dynamic
  const fontSize = Math.max(16, 80 / gridSize);

  return (
    <Pressable onPress={onPress} disabled={value === 0} style={{ flex: 1 }}>
      <Animated.View style={[styles.tile, { flex: 1 }]}>
        <Text style={[styles.text, { fontSize }]}>
          {value !== 0 ? value : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
  },
  text: {
    fontWeight: "bold",
  },
});
