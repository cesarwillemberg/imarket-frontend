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
import {
  getCurrentPositionAsync,
  LocationAccuracy,
  LocationObject,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import createStyles from "./styled";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function ConfirmEditAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user, updateAddress, checkDuplicity } = useSession();

  const router = useRouter();
  const { oldAddress, newAddress } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingButton, setIsLoadingButton] = useState<boolean>(false);
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

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
  const animationLoading = useRef<LottieView>(null);

  // --------- Helpers ---------
  const handleLettersOnlyChange = (text: string, setValue: (value: string) => void) => {
    const cleanText = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    setValue(cleanText);
  };

  const handleAddressChange = (text: string, setValue: (value: string) => void) => {
    const cleanText = text.replace(/[^a-zA-ZÀ-ÿ0-9\s\-,.º]/g, "");
    setValue(cleanText);
  };

  const handleNumbersOnlyChange = (text: string, setValue: (value: string) => void) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setValue(cleanText);
  };

  const handleUppercaseLettersChange = (text: string, setValue: (value: string) => void) => {
    const cleanText = text.replace(/[^A-Z]/g, "").toUpperCase();
    setValue(cleanText);
  };

  // --------- Safe parsing ---------
  const getCoordsFromParams = useCallback((): Coordinates | null => {
    if (!newAddress) return null;
    try {
      const parsed = JSON.parse(newAddress);
      if (parsed.latitude && parsed.longitude) {
        return parsed as Coordinates;
      }
      return null;
    } catch (error) {
      console.error("Erro ao parsear newAddress:", error);
      return null;
    }
  }, [newAddress]);

  // --------- Reverse Geocoding ---------
  const fetchReverseGeocode = useCallback(async (coords: Coordinates) => {
    try {
      const address = await reverseGeocodeAsync(coords);
      if (address.length > 0) {
        const info = address[0];
        setCity(info.city ?? "");
        setNeighborhood(info.district ?? "");
        setStreet(info.street ?? "");
        setStreetNumber(info.streetNumber ?? "");
        setState(info.region ?? "");
        setCountry(info.country ?? "");
        setPostalCode(info.postalCode ?? "");
      } else {
        console.warn("Nenhum endereço encontrado para estas coordenadas.");
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
    }
  }, []);

  const requestUserLocation = useCallback(async (): Promise<LocationObject | null> => {
    try {
      const { granted } = await requestForegroundPermissionsAsync();
      if (!granted) {
        console.warn("Permissao de localizacao negada pelo usuario.");
        return null;
      }

      const position = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.Highest,
      });
      setUserLocation(position);
      return position;
    } catch (error) {
      console.error("Erro ao obter localizacao do usuario:", error);
      return null;
    }
  }, []);

  // --------- Fetch Initial Data ---------
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                const position = await requestUserLocation();

                let coords = getCoordsFromParams();
                if (!coords && position) {
                    coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                }
                if (!coords) {
                    setIsLoading(false);
                    console.warn("Nenhum parâmetro de localização encontrado!");
                    return;
                }

                setSelectedLocation(coords);

                // 🔒 Faz parsing seguro do oldAddress
                let parsedOld: any = null;
                try {
                    if (oldAddress) {
                    parsedOld = JSON.parse(oldAddress);
                    }
                } catch (error) {
                    console.warn("Erro ao parsear oldAddress:", error);
                }

                // 🗺️ Busca endereço reverso (cidade, rua, etc)
                await fetchReverseGeocode(coords);

                // ✅ Define tipo de endereço após o carregamento
                if (parsedOld?.address_type) {
                    setAddressType(parsedOld.address_type);
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Erro no carregamento de dados:", err);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [getCoordsFromParams, fetchReverseGeocode, oldAddress, requestUserLocation]);

  // --------- Pull to refresh ---------
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      let coords = getCoordsFromParams();

      if (!coords) {
        const referenceLocation = userLocation ?? (await requestUserLocation());
        if (referenceLocation) {
          coords = {
            latitude: referenceLocation.coords.latitude,
            longitude: referenceLocation.coords.longitude,
          };
          setSelectedLocation(coords);
        }
      }

      if (coords) {
        await fetchReverseGeocode(coords);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // --------- Duplicity Check ---------
  const checkDuplicateAddress = async (inputAddress: any) => {
    if (!user) return false;
    if (!inputAddress) return false;
    try {
      const { data } = await checkDuplicity(inputAddress);
      return data && data.length > 0;
    } catch (error) {
      console.error("Erro ao verificar duplicatas:", error);
      return false;
    }
  };

  // --------- Save Address ---------
  const handleUpdateAddress = async () => {
    try {
      setIsLoadingButton(true);

      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        setIsLoadingButton(false);
        return;
      }

      if (!city.trim()) return Alert.alert("Erro", "O campo Cidade é obrigatório.");
      if (!neighborhood.trim()) return Alert.alert("Erro", "O campo Bairro é obrigatório.");
      if (!street.trim()) return Alert.alert("Erro", "O campo Rua é obrigatório.");
      if (!noHasNumber && !streetNumber.trim()) return Alert.alert("Erro", "Informe o número ou marque que não possui.");
      if (!stateAbbreviation.trim()) return Alert.alert("Erro", "O campo Sigla do Estado é obrigatório.");
      if (!postalCode.trim()) return Alert.alert("Erro", "O campo CEP é obrigatório.");
      if (!noHasComplement && !complement.trim()) return Alert.alert("Erro", "Informe o complemento ou marque que não possui.");
      if (!addressType.trim()) return Alert.alert("Erro", "Selecione um tipo de endereço.");
      if (!selectedLocation) return Alert.alert("Erro", "Localização não encontrada.");

      const { count } = await supabase
        .from("address")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const isFirstAddress = count === 0;

      const inputAddress = {
        address_id: oldAddress ? JSON.parse(oldAddress).address_id : undefined,
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

      const isDuplicate = await checkDuplicateAddress(inputAddress);
      if (isDuplicate) {
        Alert.alert(
          "Endereço já existe",
          "Este endereço já está cadastrado em sua conta."
        );
        setIsLoadingButton(false);
        return;
      }

      await handleSaveUpdateAddress(inputAddress);
    } catch (error) {
      console.error("Erro inesperado ao salvar endereço:", error);
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
      setIsLoadingButton(false);
    }
  };

  const handleSaveUpdateAddress = async (inputAddress: any) => {
    try {
      const { data, error } = await updateAddress(inputAddress);

      if (error) {
        console.error("Erro ao salvar endereço:", error);
        Alert.alert("Erro", "Falha ao atualizar o endereço. Tente novamente.");
        setIsLoadingButton(false);
        return;
      }

      setIsLoadingButton(false);

      Alert.alert("Sucesso", "Endereço atualizado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            router.dismissAll();
            router.push("/(auth)/profile/address");
          },
        },
      ]);
    } catch (error) {
      console.error("Erro inesperado ao salvar endereço:", error);
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
      setIsLoadingButton(false);
    }
  };

  // --------- Render ---------
  if (!newAddress) {
    return (
      <ScreenContainer>
        <HeaderScreen title="Erro" showButtonBack />
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Nenhuma localização foi selecionada. Volte e selecione um endereço no mapa.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Editar Endereço" showButtonBack />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            isLoading || refreshing
              ? styles.loadingContainer
              : styles.contentContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              title="Carregando..."
              colors={["#ff0000", "#00ff00", "#0000ff"]}
              tintColor="#ff0000"
              titleColor="#00ff00"
            />
          }
        >
          {isLoading || refreshing ? (
            <LoadingIcon
              autoPlay
              source={loadingCart}
              loop
              refAnimationLoading={animationLoading}
            />
          ) : (
            <View style={styles.formContainer}>
              {selectedLocation && (
                <View style={{ borderColor: theme.colors.primary, borderWidth: 2 }}>
                  <MapPicker
                    location={selectedLocation}
                    userLocation={
                      userLocation
                        ? {
                            latitude: userLocation.coords.latitude,
                            longitude: userLocation.coords.longitude,
                          }
                        : undefined
                    }
                    heading={userLocation?.coords.heading ?? undefined}
                    regionDelta={0.0010}
                    onLocationChange={(coords) => setSelectedLocation(coords)}
                    style={{ width: "100%", height: 120, alignSelf: "center" }}
                    readOnly
                    hideZoomControls
                  />
                </View>
              )}

              {/* Formulário */}
              <View style={styles.formInputs}>
                <View style={styles.input_group}>
                  <Label required>CIDADE</Label>
                  <Input
                    placeholder="CIDADE"
                    value={city}
                    onChangeText={(t) => handleLettersOnlyChange(t, setCity)}
                    maxLength={50}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.input_group}>
                  <Label required>BAIRRO</Label>
                  <Input
                    placeholder="BAIRRO"
                    value={neighborhood}
                    onChangeText={(t) => handleLettersOnlyChange(t, setNeighborhood)}
                    maxLength={50}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.input_group}>
                  <Label required>RUA</Label>
                  <Input
                    placeholder="RUA"
                    value={street}
                    onChangeText={(t) => handleAddressChange(t, setStreet)}
                    maxLength={100}
                    autoCapitalize="words"
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
                        onChangeText={(t) => handleNumbersOnlyChange(t, setStreetNumber)}
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
                        onChangeText={(t) => handleUppercaseLettersChange(t, setStateAbbreviation)}
                        maxLength={2}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                  <ThemedCheckbox
                    label="Este endereço não possui número."
                    checked={noHasNumber}
                    onChange={(checked) => setNoHasNumber(checked)}
                  />
                </View>

                <View style={styles.input_group}>
                  <Label required>CEP</Label>
                  <Input
                    placeholder="CEP"
                    value={postalCode}
                    onChangeText={(t) => handleNumbersOnlyChange(t, setPostalCode)}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                </View>

                <View style={styles.input_group}>
                  <Label required>COMPLEMENTO</Label>
                  <Input
                    placeholder="COMPLEMENTO"
                    value={complement}
                    editable={!noHasComplement}
                    style={noHasComplement ? styles.disabledInput : undefined}
                    onChangeText={(t) => handleAddressChange(t, setComplement)}
                    maxLength={255}
                    autoCapitalize="words"
                  />
                  <ThemedCheckbox
                    label="Este endereço não possui complemento."
                    checked={noHasComplement}
                    onChange={(checked) => setNoHasComplement(checked)}
                  />
                </View>

                <View style={styles.input_group}>
                  <Label>PONTO DE REFERÊNCIA</Label>
                  <Input
                    placeholder="PONTO DE REFERÊNCIA"
                    value={referencePoint}
                    onChangeText={(t) => handleAddressChange(t, setReferencePoint)}
                    maxLength={255}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Tipo de Endereço */}
              <View style={styles.addressTypeSection}>
                <Text style={styles.addressTypeTitle}>TIPO DE ENDEREÇO</Text>
                <AddressType addressType={addressType} setAddressType={setAddressType} />
              </View>

              {/* Botão */}
              <View style={styles.btn_group}>
                <Button
                  title="Salvar Endereço"
                  onPress={handleUpdateAddress}
                  disabled={isLoadingButton}
                  loading={isLoadingButton}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
