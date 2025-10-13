import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { MapPicker } from "@/src/components/auth/MapPicker";
import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Subtitle } from "@/src/components/common/subtitle";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  geocodeAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
  LocationObject,
  requestForegroundPermissionsAsync,
  watchPositionAsync,
} from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Region } from "react-native-maps";
import createStyles from "./styled";

type Coordinates = { latitude: number; longitude: number };

const DEFAULT_DELTA = 0.005;

export default function SelectEditAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);

  const router = useRouter();
  const { address: addressParam } = useLocalSearchParams<{ address?: string | string[] }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const animationLoading = useRef<LottieView>(null);

  const rawAddressValue = useMemo(() => {
    if (!addressParam) return null;
    return Array.isArray(addressParam) ? addressParam[0] : addressParam;
  }, [addressParam]);

  const formattedAddressForGeocode = useMemo(() => {
    if (!rawAddressValue) return null;

    try {
      const parsed = JSON.parse(rawAddressValue);
      if (parsed && typeof parsed === "object") {
        const {
          street,
          street_number,
          neighborhood,
          city,
          state_acronym,
          state,
          country,
          postal_code,
        } = parsed as Record<string, string | undefined>;

        const parts = [
          [street, street_number].filter(Boolean).join(", "),
          neighborhood,
          city,
          state_acronym || state,
          country,
          postal_code,
        ].filter((value) => Boolean(value && value.toString().trim().length));

        if (parts.length > 0) {
          return parts.join(", ");
        }
      }
    } catch (error) {
      console.warn("Nao foi possivel interpretar endereco para geocode:", error);
    }

    return rawAddressValue;
  }, [rawAddressValue]);

  const getGeocode = useCallback(async (address: string) => {
    try {
      const geocode = await geocodeAsync(address);
      return geocode;
    } catch (error) {
      console.error("Erro durante geocodificacao:", error);
      return null;
    }
  }, []);

  const handleRequestLocationPermission = useCallback(async () => {
    try {
      const { granted } = await requestForegroundPermissionsAsync();
      if (granted) {
        const currentPosition = await getCurrentPositionAsync();
        setUserLocation(currentPosition);
        setCurrentRegion((previousRegion) => {
          if (previousRegion) {
            return previousRegion;
          }

          return {
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          };
        });
      } else {
        console.log("Permissao de localizacao negada");
      }
      return granted;
    } catch (error) {
      console.error("Erro ao solicitar permissao de localizacao:", error);
      return false;
    }
  }, []);

  const handleSetLocationAddressToEdit = useCallback(
    async (addressToLocate: string) => {
      if (!addressToLocate || !addressToLocate.trim()) return;

      const geocode = await getGeocode(addressToLocate);
      if (geocode && geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        const region = {
          latitude,
          longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        };
        setSelectedLocation({ latitude, longitude });
        setCurrentRegion(region);
      } else {
        console.warn("Nao foi possivel localizar o endereco informado.");
      }
    },
    [getGeocode]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await handleRequestLocationPermission();

      if (formattedAddressForGeocode) {
        await handleSetLocationAddressToEdit(formattedAddressForGeocode);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formattedAddressForGeocode, handleRequestLocationPermission, handleSetLocationAddressToEdit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let isMounted = true;
    const startWatching = async () => {
      const subscription = await watchPositionAsync(
        {
          accuracy: LocationAccuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (response) => {
          if (!isMounted) return;
          setUserLocation(response);
        }
      );
      return () => {
        subscription.remove();
      };
    };

    const subscriptionPromise = startWatching().catch((error) => {
      console.log("Erro ao iniciar monitoramento de localizacao:", error);
      return undefined;
    });

    return () => {
      isMounted = false;
      subscriptionPromise
        .then((unsubscribe) => unsubscribe && unsubscribe())
        .catch((error) => console.log("Erro ao encerrar monitoramento de localizacao:", error));
    };
  }, []);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    setCurrentRegion(region);
  }, []);

  const handleConfirmAddress = useCallback(async () => {
    if (!selectedLocation) return;
    try {
      router.push({
        pathname: "/(auth)/profile/address/confirmeditaddress/",
        params: {
          newAddress: JSON.stringify(selectedLocation),
          oldAddress: rawAddressValue ?? "",
        },
      });
    } catch (error) {
      console.error("Erro ao confirmar endereco:", error);
    }
  }, [rawAddressValue, router, selectedLocation]);

  return (
    <ScreenContainer>
      <HeaderScreen title="Editar Endereço" showButtonBack />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isLoading ? { justifyContent: "center", alignItems: "center" } : {},
          ]}
        >
          {isLoading ? (
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
                {currentRegion && (
                  <MapPicker
                    location={
                      selectedLocation ?? {
                        latitude: currentRegion.latitude,
                        longitude: currentRegion.longitude,
                      }
                    }
                    userLocation={
                      userLocation
                        ? {
                            latitude: userLocation.coords.latitude,
                            longitude: userLocation.coords.longitude,
                          }
                        : undefined
                    }
                    heading={userLocation?.coords.heading ?? undefined}
                    onLocationChange={handleRegionChangeComplete}
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
