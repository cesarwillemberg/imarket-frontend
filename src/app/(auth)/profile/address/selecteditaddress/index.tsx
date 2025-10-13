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
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Region } from "react-native-maps";
import createStyles from "./styled";

export default function SelectEditAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);

  const router = useRouter();
  const { address } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // localização atual do usuário (GPS)
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);

  // localização escolhida pelo usuário no mapa
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // região atual visível no mapa
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const animationLoading = useRef<LottieView>(null);

  // geocodificação: converte endereço em coordenadas
  const getGeocode = async (address: string) => {
    try {
      const geocode = await geocodeAsync(address);
      return geocode;
    } catch (error) {
      console.error("Erro durante geocodificação:", error);
    }
  };

  // solicita permissão e pega localização atual
  async function handleRequestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setUserLocation(currentPosition);

      // define posição inicial do mapa se ainda não houver endereço
      if (!currentRegion) {
        setCurrentRegion({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } else {
      console.log("Permissão de localização negada");
    }
  }

  // se estiver editando um endereço, define como posição inicial
  async function handleSetLocationAddressToEdit(address: string) {
    if (!address) return;

    const geocode = await getGeocode(address);
    if (geocode && geocode.length > 0) {
      const { latitude, longitude } = geocode[0];
      const region = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setSelectedLocation({ latitude, longitude });
      setCurrentRegion(region);
    }
  }

  // carrega dados iniciais
  const fetchData = async () => {
    setIsLoading(true);
    await handleRequestLocationPermission();

    if (address) {
      await handleSetLocationAddressToEdit(address as string);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [address]);

  // acompanha mudanças de posição do usuário
  useEffect(() => {
    const startWatching = async () => {
      const subscription = await watchPositionAsync(
        {
          accuracy: LocationAccuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (response) => {
          setUserLocation(response);
        }
      );
      return () => subscription.remove();
    };

    startWatching();
  }, []);

  const handleRegionChangeComplete = (region: Region) => {
    setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    setCurrentRegion(region);
  };

  const handleConfirmAddress = async () => {
    if (!selectedLocation) return;
    try {
      router.push({
        pathname: "/(auth)/profile/address/confirmeditaddress/",
        params: {
          newAddress: JSON.stringify(selectedLocation),
          oldAddress: address
        },
      });
    } catch (error) {
      console.error("Erro ao confirmar endereço:", error);
    }
  };

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
