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
  getCurrentPositionAsync,
  LocationAccuracy,
  LocationObject,
  requestForegroundPermissionsAsync,
  watchPositionAsync
} from 'expo-location';
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Region } from 'react-native-maps';
import createStyles from "./styled";

export default function SelectAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);

  const router = useRouter();

  const [isAddressRegistered, setAddressRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const animationLoading = useRef<LottieView>(null);



  // const mapRef = useRef<MapView | null>(null);

  // const handleGetInfoUser = async () => {}

  const fetchData = async () => {
    setIsLoading(true);
    // await handleGetInfoUser();
    await handleRequestLocationPermission();
    setIsLoading(false);
  };

  useEffect(()=>{
    fetchData();
  },[])

  const onRefresh = async () => {
    setRefreshing(true);
    // await handleGetInfoUser();
    await handleRequestLocationPermission();
    setRefreshing(false);
  };



  async function handleRequestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      setCurrentRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

    } else {
      // Handle permission denied case
      console.log('Location permission denied');
    }

  }

  // useEffect(() => {
    
  // },[])

  useEffect(() => {
    const subscription = watchPositionAsync({
      accuracy: LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1,
    }, (response) => {
      setLocation(response);
    });

    return () => {
      subscription.then(sub => sub.remove());
    };
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
        pathname: '/(auth)/profile/address/registeraddress',
        params: {
          address: JSON.stringify(selectedLocation)
        }
      })
    } catch (error) {
      console.error('Error fetching address:', error);
    }

  }



  return (
    <ScreenContainer>
      <HeaderScreen title="Meus Endereços" showButtonBack />
      <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.container, isLoading || refreshing ? { justifyContent: "center", alignItems: "center" } : {}]}
        // scrollEnabled={false}
        refreshControl={
          <RefreshControl   
            refreshing={refreshing}
            onRefresh={onRefresh}
            title="Carregando..."
            colors={['#ff0000', '#00ff00', '#0000ff']}
            tintColor="#ff0000"
            titleColor="#00ff00" 
          />
        }
      >
          {
            isLoading || refreshing ? (
              <LoadingIcon 
                autoPlay={true} 
                source={loadingCart} 
                loop={true}
                refAnimationLoading={animationLoading}
              />
            ) : (
              <View>
                <View style={{ marginVertical: 20}}>
                  <Subtitle align="center" style={{ fontSize: 20 }}>Selecione um endereço no mapa</Subtitle>
                </View>
                <View style={{
                  marginHorizontal: 20,
                  borderWidth: 2,
                  borderColor: theme.colors.primary
                }}>
                  {
                    location && currentRegion && 
                    <>
                      <MapPicker
                        location={selectedLocation ?? { latitude: location.coords.latitude, longitude: location.coords.longitude }}
                        heading={location?.coords.heading ?? undefined}
                        onLocationChange={(coords) => setSelectedLocation(coords)}
                        style={{ width: "100%", height: 500 }}
                      />
                    </>
                  }
                </View>
                <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                  <Button
                    title="Confirmar Endereço"
                    onPress={handleConfirmAddress}
                    disabled={!selectedLocation}
                  />
                </View>
              </View>
            )
          }

        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

