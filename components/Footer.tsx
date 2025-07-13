import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>© 2025 Number Game</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
