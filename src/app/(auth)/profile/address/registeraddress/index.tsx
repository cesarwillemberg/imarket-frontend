import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import { MapPicker } from "@/src/components/auth/MapPicker";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { LocationObject, reverseGeocodeAsync } from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import MapView, { Region } from "react-native-maps";
import createCommonStyles from "../../chats/styled";
import createStyles from "./styled";

type RegisterAddressParams = {
    address?: string;
}

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function RegisterAddress() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const commonStyles = createCommonStyles(theme);

    const router = useRouter();

    const { address: addressParam } = useLocalSearchParams<RegisterAddressParams>();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const [country, setCountry] = useState<string>("");
    const [state, setState] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [neighborhood, setNeighborhood] = useState<string>("");
    const [street, setStreet] = useState<string>("");
    const [postalCode, setPostalCode] = useState<string>("");
    const [referencePoint, setReferencePoint] = useState<string>("");
    const [addressType, setAddressType] = useState<string>("");

    const [noHasNumber, setNoHasNumber] = useState<boolean>(false);
    const [noHasComplement, setNoHasComplement] = useState<boolean>(false);


    const [location, setLocation] = useState<LocationObject | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [currentRegion, setCurrentRegion] = useState<Region | null>(null);



    const mapRef = useRef<MapView | null>(null);

    
    const animationLoading = useRef<LottieView>(null);

    const getCoordsFromParams = (): Coordinates | null => {
        if (!addressParam) return null;
        try {
            return JSON.parse(addressParam) as Coordinates;
        } catch (error) {
            console.error("Erro ao parsear addressParam:", error);
            return null;
        }
    };

    const handleGetInfoUser = async () => {}

    const fetchData = async () => {
        const coords = getCoordsFromParams();
        if (!coords) {
            console.warn("Nenhum parâmetro address encontrado!");
            return;
        }
        setSelectedLocation(coords);
        setIsLoading(true);
        // await handleGetInfoUser();
        // await handleRequestLocationPermission();
        await handleConfirmAddress(coords)
        setIsLoading(false);
    };

    useEffect(()=>{
        fetchData();
    },[])

    const onRefresh = async () => {
        const coords = getCoordsFromParams();
        if (!coords) {
            console.warn("Nenhum parâmetro address encontrado!");
            return;
        }
        console.log(coords);
        
        setCurrentRegion(coords);
        setRefreshing(true);
        // await handleGetInfoUser();
        // await handleRequestLocationPermission();
        await handleConfirmAddress(coords)
        setRefreshing(false);
    };

     const handleConfirmAddress = async (selectedLocation: Coordinates) => {
        try {
          const address = await reverseGeocodeAsync(selectedLocation);
          if(address.length > 0) {
            const addr = address[0];
            console.log(addr);
            
          } else {
            console.log('No address found for these coordinates');
          }
        } catch (error) {
          console.error('Error fetching address:', error);
        }
    }

    return (
        <ScreenContainer>
            <View style={styles.container}>
                <HeaderScreen title="Registrar Endereço" showButtonBack />
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
                    <>
                        {
                            isLoading || refreshing ? (
                                <LoadingIcon 
                                    autoPlay={true} 
                                    source={loadingCart} 
                                    loop={true}
                                    refAnimationLoading={animationLoading}
                                />
                            ) : (
                                <>
                                    <View>
                                        <View style={{margin: 20, borderColor: theme.colors.primary, borderWidth: 2}}>
                                            <MapPicker
                                                location={selectedLocation ?? { latitude: location?.coords.latitude, longitude: location?.coords.longitude }}
                                                heading={location?.coords.heading ?? undefined}
                                                onLocationChange={(coords) => setSelectedLocation(coords)}
                                                style={{ width: "100%", height: 120, alignSelf: "center" }}
                                                readOnly={true}
                                                hideZoomControls={true}
                                            />
                                        </View>
                                    </View>
                                </>
                            )
                        }
                    </>
                </ScrollView>
            </View>
        </ScreenContainer>
    )
}