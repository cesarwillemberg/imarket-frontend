import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import { MapPicker } from "@/src/components/auth/MapPicker";
import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Subtitle } from "@/src/components/common/subtitle";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getCurrentPositionAsync,
  LocationAccuracy,
  LocationObject,
  LocationSubscription,
  requestForegroundPermissionsAsync,
  watchPositionAsync,
} from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Region } from "react-native-maps";
import createStyles from "./styled";

const DEFAULT_REGION_DELTA = 0.005;

type SelectAddressParams = {
  latitude?: string | string[];
  longitude?: string | string[];
};

type Coordinates = { latitude: number; longitude: number };

export default function SelectAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const router = useRouter();
  const params = useLocalSearchParams<SelectAddressParams>();
  

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const animationLoading = useRef<LottieView>(null);
  const lastAppliedParams = useRef<Coordinates | null>(null);

  const coordsFromParams = useMemo<Coordinates | null>(() => {
    const rawLat = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
    const rawLng = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;

    if (!rawLat || !rawLng) {
      return null;
    }

    const latitude = Number(rawLat);
    const longitude = Number(rawLng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }, [params.latitude, params.longitude]);

  const applyCoordsToState = useCallback((coords: Coordinates) => {
    const normalized = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    setSelectedLocation(normalized);
    setCurrentRegion({
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      latitudeDelta: DEFAULT_REGION_DELTA,
      longitudeDelta: DEFAULT_REGION_DELTA,
    });
  }, []);

  const handleRequestLocationPermission = useCallback(async () => {
    try {
      const { granted } = await requestForegroundPermissionsAsync();
      if (granted) {
        const currentPosition = await getCurrentPositionAsync();
        setLocation(currentPosition);
        setCurrentRegion({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          latitudeDelta: DEFAULT_REGION_DELTA,
          longitudeDelta: DEFAULT_REGION_DELTA,
        });
      } else {
        console.log("Location permission denied");
      }
      return granted;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await handleRequestLocationPermission();

      if (coordsFromParams) {
        applyCoordsToState(coordsFromParams);
        lastAppliedParams.current = { ...coordsFromParams };
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleRequestLocationPermission, coordsFromParams, applyCoordsToState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await handleRequestLocationPermission();
      if (coordsFromParams) {
        applyCoordsToState(coordsFromParams);
        lastAppliedParams.current = { ...coordsFromParams };
      }
    } finally {
      setRefreshing(false);
    }
  }, [handleRequestLocationPermission, coordsFromParams, applyCoordsToState]);

  useEffect(() => {
    if (!coordsFromParams) {
      lastAppliedParams.current = null;
      return;
    }

    const alreadyApplied =
      lastAppliedParams.current &&
      Math.abs(lastAppliedParams.current.latitude - coordsFromParams.latitude) < 1e-6 &&
      Math.abs(lastAppliedParams.current.longitude - coordsFromParams.longitude) < 1e-6;

    if (alreadyApplied) {
      return;
    }

    applyCoordsToState(coordsFromParams);
    lastAppliedParams.current = { ...coordsFromParams };
  }, [coordsFromParams, applyCoordsToState]);

  useEffect(() => {
    let isMounted = true;
    let subscription: LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        subscription = await watchPositionAsync(
          {
            accuracy: LocationAccuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (response) => {
            if (!isMounted) {
              return;
            }
            setLocation(response);
          }
        );
      } catch (error) {
        console.log("Unable to start location watcher:", error);
      }
    };

    startWatching();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  const handleConfirmAddress = async () => {
    if (!selectedLocation) return;
    try {
      router.push({
        pathname: "/(auth)/profile/address/registeraddress",
        params: {
          address: JSON.stringify(selectedLocation),
        },
      });
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const userLocationCoords = useMemo(() => {
    if (!location) {
      return undefined;
    }
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }, [location]);

  const mapLocation = useMemo<Coordinates | null>(() => {
    if (selectedLocation) {
      return selectedLocation;
    }

    if (currentRegion) {
      return {
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      };
    }

    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }

    return null;
  }, [selectedLocation, currentRegion, location]);

  return (
    <ScreenContainer>
      <HeaderScreen title="Meus Endereços" showButtonBack />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isLoading || refreshing ? { justifyContent: "center", alignItems: "center" } : {},
          ]}
          // refreshControl={
          //   <RefreshControl
          //     refreshing={refreshing}
          //     onRefresh={onRefresh}
          //     title="Carregando..."
          //     colors={["#ff0000", "#00ff00", "#0000ff"]}
          //     tintColor="#ff0000"
          //     titleColor="#00ff00"
          //   />
          // }
        >
          {isLoading || refreshing ? (
            <LoadingIcon
              autoPlay={true}
              source={loadingCart}
              loop={true}
              refAnimationLoading={animationLoading}
            />
          ) : (
            <View>
              <View style={{ marginVertical: 20 }}>
                <Subtitle align="center" style={{ fontSize: 20 }}>
                  Selecione um endereço no mapa
                </Subtitle>
              </View>
              <View
                style={{
                  marginHorizontal: 20,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                }}
              >
                {currentRegion && mapLocation && (
                  <MapPicker
                    location={mapLocation}
                    userLocation={userLocationCoords}
                    heading={location?.coords.heading ?? undefined}
                    onLocationChange={(coords) => {
                      setSelectedLocation(coords);
                      setCurrentRegion((prevRegion) =>
                        prevRegion
                          ? {
                              ...prevRegion,
                              latitude: coords.latitude,
                              longitude: coords.longitude,
                            }
                          : {
                              latitude: coords.latitude,
                              longitude: coords.longitude,
                              latitudeDelta: DEFAULT_REGION_DELTA,
                              longitudeDelta: DEFAULT_REGION_DELTA,
                            }
                      );
                    }}
                    style={{ width: "100%", height: 500 }}
                  />
                )}
              </View>
              <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <Button
                  title="Confirmar Endereço"
                  onPress={handleConfirmAddress}
                  disabled={!selectedLocation}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
