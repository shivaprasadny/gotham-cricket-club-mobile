import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  quote: string;
};

const HomeHeroCard = ({ quote }: Props) => {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroTitle}>Gotham Cricket Club</Text>
      <Text style={styles.heroSub}>One club. One standard.</Text>
      <Text style={styles.heroQuote}>{quote}</Text>
    </View>
  );
};

export default HomeHeroCard;

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#3a0a57",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSub: {
    color: "#da9306",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  heroQuote: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },
});