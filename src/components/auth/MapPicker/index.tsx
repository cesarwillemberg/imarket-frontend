import { Icon } from "@/src/components/common/Icon";
import { useTheme } from "@/src/themes/ThemeContext";
import React, { useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";
import createStyles from "./styles";

export type MapPickerProps = {
  location: { latitude: number; longitude: number };
  heading?: number;
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  style?: object;
  zoomStep?: number;
  readOnly?: boolean;
  hideZoomControls?: boolean;
};

export const MapPicker: React.FC<MapPickerProps> = ({
  location,
  heading,
  onLocationChange,
  style,
  zoomStep = 1.5,
  readOnly = false,
  hideZoomControls = false,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const mapRef = useRef<MapView | null>(null);
    const [currentRegion, setCurrentRegion] = React.useState<Region>({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
    });

    const handleRegionChangeComplete = (region: Region) => {
        setCurrentRegion(region);
        onLocationChange?.({
            latitude: region.latitude,
            longitude: region.longitude,
        });
    };

    const zoomIn = () => {
        if (mapRef.current) {
            const newRegion = {
                ...currentRegion,
                latitudeDelta: currentRegion.latitudeDelta / zoomStep,
                longitudeDelta: currentRegion.longitudeDelta / zoomStep,
            };
            mapRef.current.animateToRegion(newRegion, 200);
        }
    };

  const zoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta * zoomStep,
        longitudeDelta: currentRegion.longitudeDelta * zoomStep,
      };
      mapRef.current.animateToRegion(newRegion, 200);
    }
  };

  return (
    <View style={[style, { position: "relative" }]}>
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        initialRegion={currentRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled={!readOnly}
        zoomEnabled={!readOnly}
        rotateEnabled={!readOnly}
        pitchEnabled={!readOnly}
      >
        {/* Círculos */}
        <Circle
          center={location}
          radius={20}
          fillColor="rgba(0, 122, 255, 0.3)"
          strokeColor="rgba(0, 122, 255, 1)"
          strokeWidth={2}
        />
        <Circle
          center={location}
          radius={4}
          fillColor="rgba(0, 122, 255, 1)"
          strokeColor="white"
          strokeWidth={2}
        />

        {/* Marker com seta */}
        {heading !== undefined && heading >= 0 && (
          <Marker coordinate={location} rotation={heading} flat anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.arrowContainer}>
              <View style={styles.arrowPointer}>
                <View style={styles.arrowTriangle} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Marcador fixo no centro */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.markerFixed}>
          <Icon type="MaterialCommunityIcons" name="map-marker" size={40} color="#FF5252" />
        </View>
      </View>

      {/* Controles de Zoom */}
      {!hideZoomControls && (
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={zoomIn} style={{ marginBottom: 8 }}>
            <Icon type="MaterialCommunityIcons" name="plus" color="#000" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={zoomOut}>
            <Icon type="MaterialCommunityIcons" name="minus" color="#000" size={24} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};