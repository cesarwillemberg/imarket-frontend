import { Icon } from "@/src/components/common/Icon";
import { useTheme } from "@/src/themes/ThemeContext";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";
import createStyles from "./styles";

const DEV_LOG_ENABLED = typeof __DEV__ !== "undefined" ? __DEV__ : true;
const mapPickerLog = (...args: unknown[]) => {
  if (DEV_LOG_ENABLED) {
    console.log("[MapPicker]", ...args);
  }
};

export type MapPickerProps = {
  location: { latitude: number; longitude: number }; // centro atual do mapa
  userLocation?: { latitude: number; longitude: number }; // posição real do usuário
  heading?: number;
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  style?: object;
  readOnly?: boolean;
  hideZoomControls?: boolean;
  regionDelta?: number;
};

export const MapPicker: React.FC<MapPickerProps> = ({
  location,
  userLocation,
  heading,
  onLocationChange,
  style,
  readOnly = false,
  regionDelta,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const mapRef = useRef<MapView | null>(null);
  const DEFAULT_DELTA = 0.005;

  const [currentRegion, setCurrentRegion] = useState<Region>(() => ({
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: regionDelta ?? DEFAULT_DELTA,
    longitudeDelta: regionDelta ?? DEFAULT_DELTA,
  }));

  useEffect(() => {
    mapPickerLog("Props update", { location, userLocation, heading, readOnly, regionDelta });
  }, [location, userLocation, heading, readOnly, regionDelta]);

  // 🚀 Atualiza o mapa quando o "location" mudar de fato (novo endereço, não apenas zoom)
  useEffect(() => {
    if (!mapRef.current) return;

    const desiredDelta =
      regionDelta !== undefined ? regionDelta : currentRegion.latitudeDelta ?? DEFAULT_DELTA;
    const newRegion: Region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: desiredDelta,
      longitudeDelta: desiredDelta,
    };

    const hasLatitudeChanged = Math.abs(newRegion.latitude - currentRegion.latitude) > 0.0001;
    const hasLongitudeChanged = Math.abs(newRegion.longitude - currentRegion.longitude) > 0.0001;
    const hasDeltaChanged =
      regionDelta !== undefined &&
      Math.abs(newRegion.latitudeDelta - currentRegion.latitudeDelta) > 0.0001;

    if (hasLatitudeChanged || hasLongitudeChanged || hasDeltaChanged) {
      mapPickerLog("Syncing region with new props", { newRegion, currentRegion });
      setCurrentRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 400);
    }
  }, [currentRegion, location, regionDelta]);

  // Quando o usuário movimenta o mapa manualmente
  const handleRegionChangeComplete = (region: Region) => {
    mapPickerLog("Region change complete", region);
    setCurrentRegion(region);
    onLocationChange?.({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  const handleMapReady = () => {
    mapPickerLog("Map ready", currentRegion);
  };

  return (
    <View style={[style, { position: "relative" }]}>
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        initialRegion={currentRegion}
        region={currentRegion} // ✅ mantém o zoom estável
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={handleMapReady}
        scrollEnabled={!readOnly}
        zoomEnabled={!readOnly}
        rotateEnabled={!readOnly}
        pitchEnabled={!readOnly}
        showsUserLocation={false}
      >
        {/* Mostra posição real do usuário */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={20}
              fillColor="rgba(0, 122, 255, 0.3)"
              strokeColor="rgba(0, 122, 255, 1)"
              strokeWidth={2}
            />
            <Circle
              center={userLocation}
              radius={4}
              fillColor="rgba(0, 122, 255, 1)"
              strokeColor="white"
              strokeWidth={2}
            />
            {heading !== undefined && heading >= 0 && (
              <Marker coordinate={userLocation} rotation={heading} flat anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowPointer}>
                    <View style={styles.arrowTriangle} />
                  </View>
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Marcador fixo no centro */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.markerFixed}>
          <Icon type="MaterialCommunityIcons" name="map-marker" size={40} color="#FF5252" />
        </View>
      </View>
    </View>
  );
};
