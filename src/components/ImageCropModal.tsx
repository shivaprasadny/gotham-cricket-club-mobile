/**
 * ImageCropModal
 *
 * Full-screen circular crop UI built on React Native's Animated + PanResponder.
 * No react-native-gesture-handler worklets — runs entirely on the JS thread,
 * which avoids all "runtime not ready / Exception in HostFunction" crashes.
 *
 * Flow:  pick image → this modal → crop + resize → onComplete(uri)
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const { width: SW, height: SH } = Dimensions.get("window");

// Crop circle: 84% of screen width, max 320 px
const CROP_SIZE = Math.min(Math.round(SW * 0.84), 320);
const CROP_RADIUS = CROP_SIZE / 2;
const CROP_LEFT = (SW - CROP_SIZE) / 2;

// Space for header and bottom hint
const HEADER_H = Platform.OS === "ios" ? 100 : 80;
const HINT_H = 60;

// Vertical centre of the crop circle
const CROP_CENTER_Y =
  HEADER_H + (SH - HEADER_H - HINT_H - CROP_SIZE) / 2 + CROP_RADIUS;

// Overlay strip heights
const OVERLAY_TOP_H = CROP_CENTER_Y - CROP_RADIUS;
const OVERLAY_BOTTOM_H = SH - CROP_CENTER_Y - CROP_RADIUS;

// ── Types ──────────────────────────────────────────────────────────────────────

type ImgLayout = {
  displayW: number;
  displayH: number;
  renderScale: number; // displayPixels / originalPixels
  imgW: number;
  imgH: number;
  minGs: number;       // gesture scale below which the circle would show a gap
};

type Props = {
  visible: boolean;
  imageUri: string | null;
  onComplete: (croppedUri: string) => void;
  onCancel: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dist(t0: { pageX: number; pageY: number }, t1: { pageX: number; pageY: number }) {
  const dx = t0.pageX - t1.pageX;
  const dy = t0.pageY - t1.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageCropModal({
  visible,
  imageUri,
  onComplete,
  onCancel,
}: Props) {
  const [imgLayout, setImgLayout] = useState<ImgLayout | null>(null);
  const [processing, setProcessing] = useState(false);

  // Current transform values (plain numbers, updated in onPanResponderMove)
  const gsRef = useRef(1);      // gesture scale
  const txRef = useRef(0);      // translateX
  const tyRef = useRef(0);      // translateY

  // Animated values for smooth rendering
  const animScale = useRef(new Animated.Value(1)).current;
  const animX     = useRef(new Animated.Value(0)).current;
  const animY     = useRef(new Animated.Value(0)).current;

  // Pinch tracking
  const pinchInitDist  = useRef(0);
  const pinchInitScale = useRef(1);

  // ── Load image size ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!visible || !imageUri) {
      setImgLayout(null);
      setProcessing(false);
      return;
    }
    setImgLayout(null);
    setProcessing(false);

    Image.getSize(
      imageUri,
      (imgW, imgH) => {
        const renderScale = Math.min(SW / imgW, SH / imgH);
        const displayW    = imgW * renderScale;
        const displayH    = imgH * renderScale;
        const minGs       = Math.max(CROP_SIZE / displayW, CROP_SIZE / displayH);
        const initGs      = Math.max(minGs, 1.0);

        // Reset animated + raw values
        gsRef.current = initGs;
        txRef.current = 0;
        tyRef.current = 0;
        animScale.setValue(initGs);
        animX.setValue(0);
        animY.setValue(0);

        setImgLayout({ displayW, displayH, renderScale, imgW, imgH, minGs });
      },
      () => {
        Alert.alert("Error", "Could not load the image.");
        onCancel();
      }
    );
  }, [visible, imageUri]);

  // ── Clamp helper (uses current imgLayout) ────────────────────────────────────

  const clampTranslate = (tx: number, ty: number, gs: number, layout: ImgLayout) => {
    const maxX = Math.max(0, (layout.displayW * gs - CROP_SIZE) / 2);
    const maxY = Math.max(0, (layout.displayH * gs - CROP_SIZE) / 2);
    return { tx: clamp(tx, -maxX, maxX), ty: clamp(ty, -maxY, maxY) };
  };

  // ── PanResponder ─────────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          // Starting a pinch: snapshot current distance and scale
          pinchInitDist.current  = dist(touches[0], touches[1]);
          pinchInitScale.current = gsRef.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        // Access layout via closure — it's captured when panResponder is created,
        // but we store a ref below that stays current.
        const layout = layoutRef.current;
        if (!layout) return;

        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          // ── Pinch to zoom ──────────────────────────────────────────────────
          const d = dist(touches[0], touches[1]);
          const newGs = Math.max(
            layout.minGs,
            pinchInitScale.current * (d / Math.max(1, pinchInitDist.current))
          );
          gsRef.current = newGs;
          animScale.setValue(newGs);

          // Re-clamp translate so image still covers the circle
          const { tx, ty } = clampTranslate(txRef.current, tyRef.current, newGs, layout);
          txRef.current = tx;
          tyRef.current = ty;
          animX.setValue(tx);
          animY.setValue(ty);
        } else {
          // ── Single-finger pan ──────────────────────────────────────────────
          // gestureState.dx/dy are cumulative from the grant point of this gesture,
          // so rawTx = committed position + delta from this touch sequence.
          const rawTx = txRef.current + gestureState.dx;
          const rawTy = tyRef.current + gestureState.dy;
          const clamped = clampTranslate(rawTx, rawTy, gsRef.current, layout);
          animX.setValue(clamped.tx);
          animY.setValue(clamped.ty);
          pendingTxRef.current = clamped.tx;
          pendingTyRef.current = clamped.ty;
        }
      },
      onPanResponderRelease: () => {
        // Commit the clamped position so the next gesture starts from here
        txRef.current = pendingTxRef.current;
        tyRef.current = pendingTyRef.current;
      },
      onPanResponderTerminate: () => {
        txRef.current = pendingTxRef.current;
        tyRef.current = pendingTyRef.current;
      },
    })
  ).current;

  // Refs used inside PanResponder callbacks (re-created once, close over refs)
  const layoutRef    = useRef<ImgLayout | null>(null);
  const pendingTxRef = useRef(0);
  const pendingTyRef = useRef(0);

  // Keep layoutRef current whenever imgLayout state changes
  useEffect(() => {
    layoutRef.current = imgLayout;
  }, [imgLayout]);

  // ── Crop + upload ─────────────────────────────────────────────────────────────

  const handleDone = async () => {
    if (!imageUri || !imgLayout || processing) return;
    setProcessing(true);

    try {
      const { renderScale, imgW, imgH } = imgLayout;
      const gs = gsRef.current;
      const tx = txRef.current;
      const ty = tyRef.current;
      const totalScale = renderScale * gs; // displayPx → originalPx ratio

      // Crop circle centre relative to image centre: (-tx, -ty) screen px.
      // Convert to original image pixels and derive crop square.
      const originX = imgW / 2 - tx / totalScale - CROP_RADIUS / totalScale;
      const originY = imgH / 2 - ty / totalScale - CROP_RADIUS / totalScale;
      const cropPx  = CROP_SIZE / totalScale;

      const safeX    = Math.max(0, Math.min(Math.round(originX), imgW - 1));
      const safeY    = Math.max(0, Math.min(Math.round(originY), imgH - 1));
      const safeSize = Math.max(
        1,
        Math.round(Math.min(cropPx, imgW - safeX, imgH - safeY))
      );

      let result: ImageManipulator.ImageResult;
      try {
        result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { crop: { originX: safeX, originY: safeY, width: safeSize, height: safeSize } },
            { resize: { width: 512, height: 512 } },
          ],
          { format: ImageManipulator.SaveFormat.WEBP, compress: 0.85 }
        );
      } catch {
        result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { crop: { originX: safeX, originY: safeY, width: safeSize, height: safeSize } },
            { resize: { width: 512, height: 512 } },
          ],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.85 }
        );
      }

      onComplete(result.uri);
    } catch {
      Alert.alert("Crop Failed", "Could not process the image. Please try again.");
      setProcessing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const layout = imgLayout;
  const imgTop  = layout ? CROP_CENTER_Y - layout.displayH / 2 : 0;
  const imgLeft = layout ? SW / 2 - layout.displayW / 2 : 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>

        {/* ── Image + gesture capture area ── */}
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          {layout && (
            <Animated.Image
              source={{ uri: imageUri! }}
              style={[
                {
                  width: layout.displayW,
                  height: layout.displayH,
                  position: "absolute",
                  top: imgTop,
                  left: imgLeft,
                },
                {
                  transform: [
                    { translateX: animX },
                    { translateY: animY },
                    { scale: animScale },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          )}
          {!layout && !processing && (
            <ActivityIndicator size="large" color="#da9306" style={styles.loader} />
          )}
        </View>

        {/* ── Semi-transparent overlays around the crop circle ── */}
        <View pointerEvents="none" style={[styles.overlay, { top: 0, left: 0, right: 0, height: OVERLAY_TOP_H }]} />
        <View pointerEvents="none" style={[styles.overlay, { bottom: 0, left: 0, right: 0, height: OVERLAY_BOTTOM_H }]} />
        <View pointerEvents="none" style={[styles.overlay, { top: OVERLAY_TOP_H, left: 0, width: CROP_LEFT, height: CROP_SIZE }]} />
        <View pointerEvents="none" style={[styles.overlay, { top: OVERLAY_TOP_H, right: 0, width: CROP_LEFT, height: CROP_SIZE }]} />

        {/* ── White circle border ── */}
        <View
          pointerEvents="none"
          style={[
            styles.cropBorder,
            { top: OVERLAY_TOP_H, left: CROP_LEFT, width: CROP_SIZE, height: CROP_SIZE, borderRadius: CROP_RADIUS },
          ]}
        />

        {/* ── Header: Cancel · title · Done ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Move and Scale</Text>

          <TouchableOpacity
            onPress={() => void handleDone()}
            disabled={!layout || processing}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#da9306" />
            ) : (
              <Text style={[styles.doneText, !layout && { opacity: 0.4 }]}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Bottom hint ── */}
        <View style={styles.hintRow} pointerEvents="none">
          <Text style={styles.hintText}>Pinch to zoom  ·  Drag to reposition</Text>
        </View>

      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loader: {
    position: "absolute",
    alignSelf: "center",
    top: SH / 2 - 20,
  },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  cropBorder: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
  },
  doneText: {
    color: "#da9306",
    fontSize: 16,
    fontWeight: "800",
  },
  hintRow: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 36 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});
