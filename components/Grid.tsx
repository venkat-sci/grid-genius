// components/Grid.tsx
import { StyleSheet, View } from "react-native";
import Tile from "./Tile";

interface GridProps {
  grid: number[];
  size: number;
  onTilePress: (value: number) => void;
  isColorful?: boolean;
}

export default function Grid({
  grid,
  size,
  onTilePress,
  isColorful,
}: GridProps) {
  // Colorful tile logic
  const getTileColor = (value: number) => {
    if (!isColorful || value === 0) return "#eee";
    // Simple color palette based on value
    const colors = [
      "#FFB6C1",
      "#FFD700",
      "#90EE90",
      "#87CEFA",
      "#FFA07A",
      "#DDA0DD",
      "#00CED1",
      "#FF69B4",
      "#B0E0E6",
      "#F08080",
    ];
    return colors[(value - 1) % colors.length];
  };

  return (
    <View
      style={[
        styles.grid,
        { aspectRatio: 1, width: "100%", maxWidth: 400, padding: 6 },
      ]}
    >
      {grid.map((num, i) => (
        <View
          key={i}
          style={{ width: `${100 / size}%`, aspectRatio: 1, padding: 3 }}
        >
          <Tile
            value={num}
            onPress={() => onTilePress(num)}
            gridSize={size}
            tileColor={getTileColor(num)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
