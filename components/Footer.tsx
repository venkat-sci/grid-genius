import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Footer({ onHelpPress }: { onHelpPress?: () => void }) {
  return (
    <View style={styles.footer}>
      <View style={{ flex: 1, alignItems: "flex-start", paddingLeft: 16 }}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={onHelpPress}
          accessibilityLabel="Show how to play"
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.footerText}>© 2025 Grid Genius</Text>
      <View style={{ flex: 1, alignItems: "flex-end", paddingRight: 16 }}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => Linking.openURL("https://github.com/venkat-sci")}
          accessibilityLabel="Visit my GitHub profile"
        >
          <Ionicons name="logo-github" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 44,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
