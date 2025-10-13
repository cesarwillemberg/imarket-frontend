import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  geocodeAsync,
  LocationGeocodedAddress,
  LocationGeocodedLocation,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

type SearchResult = {
  coords: LocationGeocodedLocation;
  address: LocationGeocodedAddress | null;
};

const RESULTS_LIMIT = 6;

export default function SearchAddressByName() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const animationLoading = useRef<LottieView>(null);
  const searchRequestId = useRef<number>(0);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const { granted } = await requestForegroundPermissionsAsync();
        setHasPermission(granted);

        if (!granted) {
          setErrorMessage("Permissao de localizacao negada. Ative-a para buscar enderecos.");
        }
      } catch (error) {
        console.error("Erro ao solicitar permissao de localizacao:", error);
        setHasPermission(false);
        setErrorMessage("Nao foi possivel verificar a permissao de localizacao.");
      } finally {
        setIsLoading(false);
      }
    };

    requestPermission();
  }, []);

  const performSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setErrorMessage(null);
        setIsSearching(false);
        return;
      }

      const requestId = ++searchRequestId.current;

      try {
        const geocodedLocations = await geocodeAsync(trimmed);
        const limited = geocodedLocations.slice(0, RESULTS_LIMIT);

        const detailedResults = await Promise.all(
          limited.map(async (coords) => {
            try {
              const [address] = await reverseGeocodeAsync({
                latitude: coords.latitude,
                longitude: coords.longitude,
              });

              return { coords, address: address ?? null };
            } catch (error) {
              console.error("Erro ao detalhar endereco:", error);
              return { coords, address: null };
            }
          })
        );

        if (searchRequestId.current !== requestId) {
          return;
        }

        setResults(detailedResults);
        setErrorMessage(null);
      } catch (error) {
        console.error("Erro ao buscar enderecos:", error);

        if (searchRequestId.current !== requestId) {
          return;
        }

        setResults([]);
        setErrorMessage("Nao foi possivel buscar enderecos.");
      } finally {
        if (searchRequestId.current === requestId) {
          setIsSearching(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const trimmed = query.trim();

    if (hasPermission === false) {
      searchRequestId.current += 1;
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (hasPermission !== true) {
      return;
    }

    if (trimmed.length < 3) {
      searchRequestId.current += 1;
      setResults([]);
      if (!trimmed.length) {
        setErrorMessage(null);
      }
      setIsSearching(false);
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);
    const handler = setTimeout(() => {
      performSearch(trimmed);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [hasPermission, performSearch, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const trimmed = query.trim();
      if (hasPermission && trimmed.length >= 3) {
        setErrorMessage(null);
        setIsSearching(true);
        await performSearch(trimmed);
      }
    } finally {
      setRefreshing(false);
    }
  }, [hasPermission, performSearch, query]);

  const handleAddressPress = useCallback(
    (result: SearchResult) => {
      const { latitude, longitude } = result.coords;

      router.push({
        pathname: "/(auth)/profile/address/selectaddress/",
        params: {
          latitude: String(latitude),
          longitude: String(longitude),
        },
      });
    },
    [router]
  );

  const handleGoToMap = useCallback(() => {
    router.push("/(auth)/profile/address/selectaddress/");
  }, [router]);

  const buildPrimaryLine = useCallback((result: SearchResult) => {
    const address = result.address;
    if (!address) {
      return `Lat ${result.coords.latitude.toFixed(4)}, Lon ${result.coords.longitude.toFixed(4)}`;
    }

    const streetParts = [address.street, address.streetNumber].filter(Boolean).join(", ");
    if (streetParts) {
      return streetParts;
    }

    if (address.name) {
      return address.name;
    }

    return `Lat ${result.coords.latitude.toFixed(4)}, Lon ${result.coords.longitude.toFixed(4)}`;
  }, []);

  const buildSecondaryLine = useCallback((result: SearchResult) => {
    const address = result.address;
    if (!address) {
      return "";
    }

    const locality = [address.district, address.city].filter(Boolean).join(", ");
    const region = [address.region, address.country].filter(Boolean).join(", ");
    const postal = address.postalCode ?? "";

    return [locality, region, postal].filter(Boolean).join(" - ");
  }, []);

  const emptyStateMessage = useMemo(() => {
    if (hasPermission === false) {
      return "Ative as permissoes de localizacao para buscar enderecos.";
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return "Digite um endereco para iniciar a busca.";
    }
    if (trimmed.length < 3) {
      return "Digite ao menos 3 caracteres.";
    }

    return "Nenhum endereco encontrado para sua busca.";
  }, [hasPermission, query]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Locations" showButtonBack />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            isLoading ? styles.loadingContainer : styles.contentContainer,
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
          {isLoading ? (
            <LoadingIcon
              autoPlay
              source={loadingCart}
              loop
              refAnimationLoading={animationLoading}
            />
          ) : (
            <View style={styles.contentWrapper}>
              <View style={styles.mainContent}>
                <View style={styles.searchContainer}>
                  <View style={styles.searchIconWrapper}>
                    <Icon
                      name="magnify"
                      type="MaterialCommunityIcons"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search..."
                    placeholderTextColor={theme.colors.disabled}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {isSearching && (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                      style={styles.searchSpinner}
                    />
                  )}
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : results.length > 0 ? (
                  <View style={styles.resultsContainer}>
                    {results.map((result, index) => (
                      <TouchableOpacity
                        key={`${result.coords.latitude}-${result.coords.longitude}-${index}`}
                        style={[
                          styles.resultItem,
                          index === results.length - 1 && styles.resultItemLast,
                        ]}
                        onPress={() => handleAddressPress(result)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.resultIconWrapper}>
                          <Icon
                            name="map-marker"
                            type="MaterialCommunityIcons"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.resultTextContainer}>
                          <Text style={styles.resultTitle} numberOfLines={1}>
                            {buildPrimaryLine(result)}
                          </Text>
                          <Text style={styles.resultSubtitle} numberOfLines={1}>
                            {buildSecondaryLine(result)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : !isSearching ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>{emptyStateMessage}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Nao encontrou o endereco?</Text>
                <TouchableOpacity onPress={handleGoToMap} activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Ir ao mapa.</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
