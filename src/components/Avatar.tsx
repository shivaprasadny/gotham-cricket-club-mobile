import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// =========================
// SIZE MAP
// =========================
const SIZE_MAP = {
  small: 24,
  medium: 36,
  large: 44,
  xlarge: 80,
} as const;

// =========================
// PALETTE — dark enough for white text, fits Gotham purple/dark theme
// =========================
const PALETTE = [
  "#4B1D6B", // deep purple (primary brand)
  "#0d7377", // dark teal
  "#312e81", // indigo
  "#155724", // deep green
  "#92400e", // amber/burnt
  "#7c1d3c", // crimson
  "#1e3a5f", // slate blue
  "#7c3100", // burnt orange
  "#1a4a3a", // forest green
  "#4a1942", // dark magenta
];

// =========================
// TYPES
// =========================
type AvatarSize = "small" | "medium" | "large" | "xlarge";

type AvatarProps = {
  name?: string;
  imageUrl?: string | null;
  size?: AvatarSize | number;
  userId?: number | string;
  isAnonymous?: boolean;
};

// =========================
// HELPERS
// =========================

/**
 * Extract initials from a full name:
 * "Shiva Prasad"       → "SP"
 * "Amit Kumar Patel"   → "AP" (first + last word)
 * "Rahul K. Sharma"    → "RS"
 * "John"               → "J"
 * empty / null         → "?"
 */
function getInitials(name?: string): string {
  if (!name || !name.trim()) return "?";

  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  const first = words[0].charAt(0);
  const last = words[words.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
}

/**
 * Generate a consistent palette color from a userId or name string.
 * Same input always maps to same color.
 */
function getColor(userId?: number | string, name?: string): string {
  const seed = userId != null ? String(userId) : (name ?? "?");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    // Simple djb2-style hash
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

// =========================
// COMPONENT
// =========================
const Avatar = ({
  name,
  imageUrl,
  size = "medium",
  userId,
  isAnonymous = false,
}: AvatarProps): React.ReactElement => {
  const resolvedSize =
    typeof size === "number" ? size : SIZE_MAP[size];

  const borderRadius = resolvedSize / 2;
  // 0.35x gives two letters comfortable room inside the circle without overflow clipping
  const rawFontSize = resolvedSize * 0.35;
  const fontSize = Math.min(Math.max(rawFontSize, 9), 26);

  const circleStyle = {
    width: resolvedSize,
    height: resolvedSize,
    borderRadius,
  };

  // Anonymous — always show "?" in grey
  if (isAnonymous) {
    return (
      <View
        style={[styles.circle, circleStyle, { backgroundColor: "#6b7280" }]}
        accessibilityLabel="Anonymous user"
      >
        <Text style={[styles.initials, { fontSize }]} numberOfLines={1}>?</Text>
      </View>
    );
  }

  // Image — show if provided and non-null/empty
  if (imageUrl) {
    return (
      <View
        style={[styles.circle, circleStyle]}
        accessibilityLabel={name ?? "User avatar"}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: resolvedSize, height: resolvedSize }}
          resizeMode="cover"
          accessibilityLabel={name ?? "User avatar"}
        />
      </View>
    );
  }

  // Initials fallback
  const initials = getInitials(name);
  const backgroundColor = getColor(userId, name);

  return (
    <View
      style={[styles.circle, circleStyle, { backgroundColor }]}
      accessibilityLabel={name ?? "User avatar"}
    >
      {/* numberOfLines={1} prevents wrap-clipping on small circles */}
      <Text style={[styles.initials, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit>
        {initials}
      </Text>
    </View>
  );
};

export default Avatar;

// =========================
// TAPPABLE AVATAR
// =========================
type TappableAvatarProps = AvatarProps & {
  onPress?: () => void;
};

export const TappableAvatar = ({ onPress, ...avatarProps }: TappableAvatarProps) => {
  if (!onPress) return <Avatar {...avatarProps} />;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Avatar {...avatarProps} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
});
