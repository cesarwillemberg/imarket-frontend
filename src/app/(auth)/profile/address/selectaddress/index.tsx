import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Subtitle } from "@/src/components/common/subtitle";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getCurrentPositionAsync,
  LocationAccuracy,
  LocationObject,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
  watchPositionAsync
} from 'expo-location';
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, Region } from 'react-native-maps';
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



  const mapRef = useRef<MapView | null>(null);

  const handleGetInfoUser = async () => {}

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

  useEffect(() => {
    
  },[])

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
      const address = await reverseGeocodeAsync(selectedLocation);
      if(address.length > 0) {
        const addr = address[0];

        router.push({
          pathname: '/(auth)/profile/address/addaddress',
          params: {
            address: JSON.stringify(addr)
          }
        })
      } else {
        console.log('No address found for these coordinates');
      }
      console.log('Selected Location:', selectedLocation);
      console.log('Address:', address);
    } catch (error) {
      console.error('Error fetching address:', error);
    }

  }

  const zoomIn = () => {
    if (mapRef.current && currentRegion) {
      const newRegion = {
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta / 1.5, // Zoom in factor (adjust as needed)
        longitudeDelta: currentRegion.longitudeDelta / 1.5,
      };
      mapRef.current.animateToRegion(newRegion, 200); // Animate with 200ms duration
    }
  };

  const zoomOut = () => {
    if (mapRef.current && currentRegion) {
      const newRegion = {
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta * 1.5, // Zoom out factor (adjust as needed)
        longitudeDelta: currentRegion.longitudeDelta * 1.5,
      };
      mapRef.current.animateToRegion(newRegion, 200);
    }
  };



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
                      <MapView
                        ref={mapRef}
                        style={{ width: '100%', height: 500 }}
                        initialRegion={{
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        onRegionChangeComplete={handleRegionChangeComplete}
                      >
                        {/* Círculo externo (aura) */}
                        <Circle
                          center={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                          }}
                          radius={20}
                          fillColor="rgba(0, 122, 255, 0.3)"
                          strokeColor="rgba(0, 122, 255, 1)"
                          strokeWidth={2}
                        />
                        
                        {/* Círculo interno */}
                        <Circle
                          center={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                          }}
                          radius={4}
                          fillColor="rgba(0, 122, 255, 1)"
                          strokeColor="white"
                          strokeWidth={2}
                        />
                        
                        {/* Seta indicando direção */}
                        {location.coords.heading !== null && 
                        location.coords.heading !== undefined && 
                        location.coords.heading >= 0 && (
                          <Marker
                            coordinate={{
                              latitude: location.coords.latitude,
                              longitude: location.coords.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}
                            rotation={location.coords.heading}
                            flat={true}
                            zIndex={1000}
                          >
                            <View style={styles.arrowContainer}>
                              <View style={styles.arrowPointer}>
                                <View style={styles.arrowTriangle} />
                              </View>
                            </View>
                          </Marker>
                        )}
                      </MapView>
                      <View style={StyleSheet.absoluteFillObject} pointerEvents="auto" >
                        <View style={styles.markerFixed}>
                          <Icon 
                            type="MaterialCommunityIcons" 
                            name="map-marker" 
                            size={40} 
                            color="#FF5252" 
                          />
                        </View>
                      </View>
                      <View style={{
                        position: 'absolute',
                        bottom: 14,
                        right: 14,
                        backgroundColor: 'white',
                        borderRadius: 8,
                        padding: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                      }}>
                        <TouchableOpacity onPress={zoomIn} style={{ marginBottom: 8 }}>
                          <Icon type="MaterialCommunityIcons" name="plus" color="#000" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={zoomOut}>
                          <Icon type="MaterialCommunityIcons" name="minus" color="#000" size={24} />
                        </TouchableOpacity>
                      </View>

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

