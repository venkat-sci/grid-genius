import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  onHamburgerPress: () => void;
}

export default function Header({ onHamburgerPress }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>Grid Genius</Text>
      <TouchableOpacity style={styles.hamburger} onPress={onHamburgerPress}>
        <Text style={styles.hamburgerIcon}>&#9776;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: "#1a2236",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    position: "relative",
  },
  headerText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  hamburger: {
    position: "absolute",
    right: 18,
    top: 12,
    zIndex: 10,
  },
  hamburgerIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    padding: 4,
  },
});
