// components/Grid.tsx
import { StyleSheet, View } from "react-native";
import Tile from "./Tile";

interface GridProps {
  grid: number[];
  size: number;
  onTilePress: (value: number) => void;
}

export default function Grid({ grid, size, onTilePress }: GridProps) {
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
          <Tile value={num} onPress={() => onTilePress(num)} gridSize={size} />
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
