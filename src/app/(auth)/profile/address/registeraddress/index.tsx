import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import AddressType from "@/src/components/auth/AddressType";
import { MapPicker } from "@/src/components/auth/MapPicker";
import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Input } from "@/src/components/common/Input";
import Label from "@/src/components/common/Label";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import ThemedCheckbox from "@/src/components/common/ThemedCheckbox";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { LocationObject, reverseGeocodeAsync } from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
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
    const { user, getInfoUser, postAddress } = useSession();

    const router = useRouter();

    const { address: addressParam } = useLocalSearchParams<RegisterAddressParams>();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const [country, setCountry] = useState<string>("");
    const [state, setState] = useState<string>("");
    const [stateAbbreviation, setStateAbbreviation] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [neighborhood, setNeighborhood] = useState<string>("");
    const [street, setStreet] = useState<string>("");
    const [streetNumber, setStreetNumber] = useState<string>("");
    const [complement, setComplement] = useState<string>("");
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

    const handleLettersOnlyChange = (text: string, setValue: (value: string) => void) => {
        const cleanText = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        setValue(cleanText);
    };

    const handleAddressChange = (text: string, setValue: (value: string) => void) => {
        const cleanText = text.replace(/[^a-zA-ZÀ-ÿ0-9\s\-,.º]/g, '');
        setValue(cleanText);
    };

    const handleNumbersOnlyChange = (text: string, setValue: (value: string) => void) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        setValue(cleanText);
    };

    const handleUppercaseLettersChange = (text: string, setValue: (value: string) => void) => {
        const cleanText = text.replace(/[^A-Z]/g, '').toUpperCase();
        setValue(cleanText);
    };


    const getCoordsFromParams = (): Coordinates | null => {
        if (!addressParam) return null;
        try {
            return JSON.parse(addressParam) as Coordinates;
        } catch (error) {
            console.error("Erro ao parsear addressParam:", error);
            return null;
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        const coords = getCoordsFromParams();
        if (!coords) {
            setIsLoading(false);
            console.warn("Nenhum parâmetro address encontrado!");
            return;
        }
        setSelectedLocation({
            latitude: coords.latitude,
            longitude: coords.longitude
        });
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
        setCurrentRegion(coords);
        setRefreshing(true);
        await handleConfirmAddress(coords)
        setRefreshing(false);
    };

    const handleConfirmAddress = async (selectedLocation: Coordinates) => {
        try {
            const address = await reverseGeocodeAsync(selectedLocation);
            if(address.length > 0) {
                setCity(address[0].city ?? "");
                setNeighborhood(address[0].district ?? "");
                setStreet(address[0].street ?? "");
                setStreetNumber(address[0].streetNumber ?? "");
                setState(address[0].region ?? "");
                setCountry(address[0].country ?? "");
                setPostalCode(address[0].postalCode ?? "");
            } else {
                console.log('No address found for these coordinates');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    }

    const handleSaveAddress = async () => {
        try {
            setIsLoading(true);
            if (!user) {
                Alert.alert("Erro", "Usuário não autenticado.");
                setIsLoading(false);
                return;
            } else if (!city.trim()) {
                Alert.alert("Erro", "O campo Cidade é obrigatório.");
                return;
            } else if (!neighborhood.trim()) {
                Alert.alert("Erro", "O campo Bairro é obrigatório.");
                return;
            } else if (!street.trim()) {
                Alert.alert("Erro", "O campo Rua é obrigatório.");
                return;
            } else if (!noHasNumber && !streetNumber.trim()) {
                Alert.alert("Erro", "O campo Número é obrigatório ou marque que não possui número.");
                return;
            } else if (!stateAbbreviation.trim()) {
                Alert.alert("Erro", "O campo Sigla do Estado é obrigatório.");
                return;
            } else if (!postalCode.trim()) {
                Alert.alert("Erro", "O campo CEP é obrigatório.");
                return;
            } else if (!noHasComplement && !complement.trim()) {
                Alert.alert("Erro", "O campo Complemento é obrigatório ou marque que não possui complemento.");
                return;
            } else if (!addressType.trim()) {
                Alert.alert("Erro", "Selecione um tipo de endereço.");
                return;
            } else if (!selectedLocation) {
                Alert.alert("Erro", "Localização não encontrada. Tente novamente.");
                return;
            }

            const { count } = await supabase
                .from('address')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const isFirstAddress = count === 0;

            const inputAddress = {
                user_id: user.id,
                is_default: isFirstAddress,
                country: country.trim(),
                state: state.trim(),
                state_acronym: stateAbbreviation.trim().toUpperCase(),
                city: city.trim(),
                neighborhood: neighborhood.trim(),
                street: street.trim(),
                street_number: noHasNumber ? "" : streetNumber.trim(),
                address_type: addressType.trim(),
                reference: referencePoint.trim() || "",
                complement: noHasComplement ? "" : complement.trim(),
                postal_code: postalCode.trim(),
            };

            const { data, error } = await postAddress(inputAddress);

            if (error) {
                console.error('Erro ao salvar endereço:', error);
                Alert.alert("Erro", "Falha ao salvar o endereço. Tente novamente.");
                setIsLoading(false);
                return;
            }

            setIsLoading(false);
            
            Alert.alert(
                "Sucesso", 
                "Endereço salvo com sucesso!",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.dismissAll();
                            router.push('/(auth)/profile/address');
                        }

                    }
                ]
            );
        } catch (error) {
            console.error('Erro inesperado ao salvar endereço:', error);
            Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <ScreenContainer>
            <View style={styles.container}>
                <HeaderScreen title="Registrar Endereço" showButtonBack />
                <ScrollView
                    style={styles.scrollView} 
                    contentContainerStyle={[
                        styles.scrollViewContent, 
                        isLoading || refreshing ? styles.loadingContainer : styles.contentContainer
                    ]}
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
                                <View style={styles.formContainer}>
                                    <View>
                                        <View style={{borderColor: theme.colors.primary, borderWidth: 2}}>
                                            <MapPicker
                                                location={selectedLocation}
                                                heading={location?.coords.heading ?? undefined}
                                                onLocationChange={(coords) => setSelectedLocation(coords)}
                                                style={{ width: "100%", height: 120, alignSelf: "center" }}
                                                readOnly={true}
                                                hideZoomControls={true}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.formInputs}>
                                        <View style={styles.input_group}>
                                            <Label required>CIDADE</Label>
                                            <Input 
                                                placeholder="CIDADE" 
                                                value={city} 
                                                onChangeText={
                                                    (text) => handleLettersOnlyChange(text, setCity)
                                                }
                                                maxLength={50}
                                                autoCapitalize="words"
                                                inputMode="text"
                                            />
                                        </View>
                                        <View style={styles.input_group}>
                                            <Label required>BAIRRO</Label>
                                            <Input 
                                                placeholder="BAIRRO" 
                                                value={neighborhood} 
                                                onChangeText={
                                                    (text) => handleLettersOnlyChange(text, setNeighborhood)
                                                }
                                                maxLength={50}
                                                autoCapitalize="words"
                                                inputMode="text"
                                            />
                                        </View>
                                        <View style={styles.input_group}>
                                            <Label required>RUA</Label>
                                            <Input 
                                                placeholder="RUA" 
                                                value={street} 
                                                onChangeText={
                                                    (text) => handleAddressChange(text, setStreet)
                                                }
                                                maxLength={100}
                                                autoCapitalize="words"
                                                inputMode="text"
                                            />
                                        </View>
                                        <View style={styles.input_group}>
                                            <View style={styles.inputRow}>
                                                <View style={styles.inputHalf}>
                                                    <Label required>NÚMERO</Label>
                                                    <Input 
                                                        placeholder="NÚMERO" 
                                                        style={noHasNumber ? styles.disabledInput : undefined}
                                                        value={streetNumber} 
                                                        onChangeText={
                                                            (text) => handleNumbersOnlyChange(text, setStreetNumber)
                                                        }
                                                        editable={!noHasNumber}
                                                        maxLength={6}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={styles.inputHalf}>
                                                    <Label required>SIGLA</Label>
                                                    <Input 
                                                        placeholder="SIGLA" 
                                                        value={stateAbbreviation} 
                                                        onChangeText={
                                                            (text) => handleUppercaseLettersChange(text, setStateAbbreviation)
                                                        }
                                                        maxLength={2}
                                                        autoCapitalize="characters"
                                                        inputMode="text"
                                                    />
                                                </View>
                                            </View>
                                            <View style={styles.checkbox_container}>
                                                <ThemedCheckbox
                                                    label="Este endereço não possui número."
                                                    checked={noHasNumber}
                                                    onChange={(checked) => setNoHasNumber(checked)}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.input_group}>
                                            <Label required>CEP</Label>
                                            <Input 
                                                placeholder="CEP" 
                                                value={postalCode} 
                                                onChangeText={
                                                    (text) => handleNumbersOnlyChange(text, setPostalCode)
                                                }
                                                keyboardType="numeric"
                                                maxLength={9}
                                            />
                                        </View>
                                        <View style={styles.input_group}>
                                            <View>
                                                <Label required>COMPLEMENTO</Label>
                                                <Input 
                                                    placeholder="COMPLEMENTO" 
                                                    value={complement} 
                                                    editable={!noHasComplement}
                                                    style={noHasComplement ? styles.disabledInput : undefined}
                                                    onChangeText={
                                                        (text) => handleAddressChange(text, setComplement)
                                                    }
                                                    maxLength={255}
                                                    autoCapitalize="words"
                                                    inputMode="text"
                                                    keyboardType="default"
                                                />
                                            </View>
                                            <View style={styles.checkbox_container}>
                                                <ThemedCheckbox
                                                    label="Este endereço não possui complemento."
                                                    checked={noHasComplement}
                                                    onChange={(checked) => setNoHasComplement(checked)}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.input_group} >
                                            <Label>PONTO DE REFERÊNCIA</Label>
                                            <Input 
                                                placeholder="PONTO DE REFERENCIA" 
                                                value={referencePoint} 
                                                onChangeText={
                                                    (text) => handleAddressChange(text, setReferencePoint)
                                                }
                                                maxLength={255}
                                                autoCapitalize="words"
                                                inputMode="text"
                                                keyboardType="default"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.addressTypeSection}>
                                        <Text style={styles.addressTypeTitle}>
                                            TIPO DE ENDEREÇO
                                        </Text>
                                        <AddressType addressType={addressType} setAddressType={setAddressType} />
                                    </View>
                                    <View style={styles.btn_group}>
                                        <Button 
                                            title="Salvar Endereço" 
                                            onPress={handleSaveAddress} 
                                        />
                                    </View>
                                </View>
                            )
                        }
                    </>
                </ScrollView>
            </View>
        </ScreenContainer>
    )
}