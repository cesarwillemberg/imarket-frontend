import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchBar from "@/src/components/common/SearchBar";
import { useSession } from "@/src/providers/SessionContext/Index";
import { Theme, useTheme } from "@/src/themes/ThemeContext";
import {
  geocodeAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
  requestForegroundPermissionsAsync,
} from "expo-location";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import createStyles from "./styled";
// Removed dependency on mockStores.ts; define local defaults and lightweight types
const DEFAULT_FILTERS = {
  state: "RS",
  city: "Ijui",
  radiusKm: 5,
  favoritesOnly: false,
} as const;

const EMPTY_FILTERS = {
  state: null,
  city: null,
  radiusKm: null,
  favoritesOnly: false,
} as const;

type StoreInfoBlock = { label: string; value: string };
type StorePromotion = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  unit: string;
  image: string;
  priceValue?: number | null;
  originalPriceValue?: number | null;
  discountValue?: number | null;
};
// Minimal Store shape used throughout this screen
type Store = {
  id: string;
  name: string;
  description: string;
  category: string;
  distance: string;
  deliveryTime: string;
  rating: number;
  isOpen: boolean;
  promotion?: string;
  brandColor: string;
  city?: string;
  state?: string;
  bannerImage?: string;
  logo?: string;
  about?: string;
  info?: StoreInfoBlock[];
  workingHours?: StoreInfoBlock[];
  promotions?: StorePromotion[];
};

type Coordinates = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

const calculateDistanceKm = (from: Coordinates, to: Coordinates) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const originLatRad = toRadians(from.latitude);
  const targetLatRad = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(originLatRad) *
      Math.cos(targetLatRad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

const normalizeForComparison = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const BRAZIL_STATE_ALIASES: Record<string, string> = {
  ac: "ac",
  acre: "ac",
  al: "al",
  alagoas: "al",
  ap: "ap",
  amapa: "ap",
  am: "am",
  amazonas: "am",
  ba: "ba",
  bahia: "ba",
  ce: "ce",
  ceara: "ce",
  df: "df",
  "distritofederal": "df",
  es: "es",
  "espiritosanto": "es",
  go: "go",
  goias: "go",
  ma: "ma",
  maranhao: "ma",
  mt: "mt",
  "matogrosso": "mt",
  ms: "ms",
  "matogrossodosul": "ms",
  mg: "mg",
  "minasgerais": "mg",
  pa: "pa",
  para: "pa",
  pb: "pb",
  paraiba: "pb",
  pr: "pr",
  parana: "pr",
  pe: "pe",
  pernambuco: "pe",
  pi: "pi",
  piaui: "pi",
  rj: "rj",
  "riodejaneiro": "rj",
  rn: "rn",
  "riograndedonorte": "rn",
  rs: "rs",
  "riograndedosul": "rs",
  ro: "ro",
  rondonia: "ro",
  rr: "rr",
  roraima: "rr",
  sc: "sc",
  "santacatarina": "sc",
  sp: "sp",
  "saopaulo": "sp",
  se: "se",
  sergipe: "se",
  to: "to",
  tocantins: "to",
};

const normalizeStateKey = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = normalizeForComparison(value).replace(/\s+/g, "");
  return BRAZIL_STATE_ALIASES[normalized] ?? normalized;
};

type SimpleState = { id: number; sigla: string; nome: string };
const AVAILABLE_STATES: SimpleState[] = [
  { id: 43, sigla: "RS", nome: "Rio Grande do Sul" },
];
const LOCKED_STATE = AVAILABLE_STATES[0];

const IJUI_REGION_CITIES = [
  "Ajuricaba",
  "Alegria",
  "Augusto Pestana",
  "Boa Vista do Cadeado",
  "Boa Vista do Incra",
  "Bozano",
  "Chiapetta",
  "Catuípe",
  "Condor",
  "Coronel Barros",
  "Coronel Bicaco",
  "Ijuí",
  "Inhacorá",
  "Nova Ramada",
  "Panambi",
  "Pejuçara",
  "Santo Augusto",
  "São Martinho",
  "São Valério do Sul",
  "Sede Nova",
  "Tenente Portela",
  "Crissiumal",
] as const;

const FALLBACK_BRAND_COLORS = [
  "#FEE9EA",
  "#FFEAEA",
  "#E9F6FF",
  "#FFF3E9",
  "#EAF8F0",
  "#F3E9FF",
];

const pickFallbackBrandColor = (identifier: string): string => {
  if (!identifier) {
    return FALLBACK_BRAND_COLORS[0];
  }

  let hash = 0;
  for (let index = 0; index < identifier.length; index += 1) {
    hash = (hash << 5) - hash + identifier.charCodeAt(index);
    hash |= 0;
  }

  const paletteIndex = Math.abs(hash) % FALLBACK_BRAND_COLORS.length;
  return FALLBACK_BRAND_COLORS[paletteIndex];
};

const FAVORITE_STORE_ID_KEYS = ["store_id", "id_store", "storeId", "idStore", "store"] as const;

const extractFavoriteStoreId = (row: Record<string, unknown>): string | null => {
  for (const key of FAVORITE_STORE_ID_KEYS) {
    const rawValue = row[key];
    if (typeof rawValue === "string" && rawValue.trim().length) {
      return rawValue.trim();
    }
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return String(rawValue);
    }
  }

  const fallbackId = row?.id;
  if (typeof fallbackId === "string" && fallbackId.trim().length) {
    return fallbackId.trim();
  }

  return null;
};


type StoreFilters = {
  state: string | null;
  city: string | null;
  radiusKm: number | null;
  favoritesOnly: boolean;
};

export default function StoreScreen() {
  const {
    session,
    getStores,
    getStoreRatingsAverage,
    getAddressesStore,
    getFavoriteStoresByUser,
    addStoreToFavorites,
    removeStoreFromFavorites,
  } = useSession();
  const userId = session?.user?.id ?? null;

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storeRatings, setStoreRatings] = useState<Record<string, number>>({});
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [storeDistances, setStoreDistances] = useState<Record<string, number>>({});
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [storeLocationMeta, setStoreLocationMeta] = useState<
    Record<string, { city: string | null; state: string | null }>
  >({});

  const animationLoading = useRef<LottieView>(null);

  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Record<string, boolean>>({});

  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  const [filters, setFilters] = useState<StoreFilters>({
    state: EMPTY_FILTERS.state,
    city: EMPTY_FILTERS.city,
    radiusKm: EMPTY_FILTERS.radiusKm,
    favoritesOnly: EMPTY_FILTERS.favoritesOnly,
  });

  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const isMountedRef = useRef(true);
  const geocodedStoreCoordsRef = useRef<Record<string, Coordinates>>({});
  const storeLocationMetaRef = useRef(storeLocationMeta);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    storeLocationMetaRef.current = storeLocationMeta;
  }, [storeLocationMeta]);


  useEffect(() => {
    let cancelled = false;

    const requestLocationPermission = async () => {
      setIsRequestingLocation(true);
      try {
        const { status } = await requestForegroundPermissionsAsync();

        if (cancelled) {
          return;
        }

        const granted = status === "granted";
        setHasLocationPermission(granted);

        if (!granted) {
          console.warn("StoreScreen: permissao de localizacao nao concedida.");
          setUserLocation(null);
          setFilters((current) => ({
            state: EMPTY_FILTERS.state,
            city: EMPTY_FILTERS.city,
            radiusKm: EMPTY_FILTERS.radiusKm,
            favoritesOnly: current.favoritesOnly,
          }));
          return;
        }

        setFilters((current) => {
          if (current.state || current.city || current.radiusKm !== null) {
            return current;
          }

          return {
            state: DEFAULT_FILTERS.state,
            city: DEFAULT_FILTERS.city,
            radiusKm: DEFAULT_FILTERS.radiusKm,
            favoritesOnly: current.favoritesOnly,
          };
        });

        const position = await getCurrentPositionAsync({
          accuracy: LocationAccuracy.Balanced,
        });

        if (!cancelled) {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch (error) {
        console.error("StoreScreen: erro ao obter localizacao do usuario:", error);
      } finally {
        if (!cancelled) {
          setIsRequestingLocation(false);
        }
      }
    };

    requestLocationPermission();

    return () => {
      cancelled = true;
    };
  }, []);


  const locationLabel = filters.city && filters.state
    ? `${filters.city} - ${filters.state}`
    : filters.state ?? "Selecionar local";

  const hasFilterOverrides = useMemo(() => {
    const expectedState = hasLocationPermission ? DEFAULT_FILTERS.state : EMPTY_FILTERS.state;
    const expectedCity = hasLocationPermission ? DEFAULT_FILTERS.city : EMPTY_FILTERS.city;
    const expectedRadius = hasLocationPermission ? DEFAULT_FILTERS.radiusKm : EMPTY_FILTERS.radiusKm;
    const expectedFavoritesOnly = EMPTY_FILTERS.favoritesOnly;

    return (
      (filters.state ?? null) !== expectedState ||
      (filters.city ?? null) !== expectedCity ||
      (filters.radiusKm ?? null) !== expectedRadius ||
      filters.favoritesOnly !== expectedFavoritesOnly
    );
  }, [filters, hasLocationPermission]);

  const hasVisibleFilters = useMemo(
    () =>
      Boolean(
        (filters.state && filters.state.length) ||
          (filters.city && filters.city.length) ||
          filters.radiusKm !== null ||
          filters.favoritesOnly
      ),
    [filters.city, filters.favoritesOnly, filters.radiusKm, filters.state]
  );

  const mapStoreFromApi = useCallback(
    (raw: any): Store => {
      const ensureString = (value: unknown, fallback = ""): string => {
        if (typeof value === "string") return value;
        if (value === null || value === undefined) return fallback;
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value);
        }
        return fallback;
      };

      const ensureNumber = (value: unknown, fallback = 0): number => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const parseBoolean = (value: unknown, fallback = true): boolean => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
          const normalized = value.trim().toLowerCase();
          if (["true", "1", "sim"].includes(normalized)) return true;
          if (["false", "0", "nao", "não"].includes(normalized)) return false;
        }
        return fallback;
      };

      const parseArray = <T,>(value: unknown): T[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value as T[];
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as T[]) : [];
          } catch (error) {
            console.warn("StoreScreen: falha ao converter campo em array", error);
            return [];
          }
        }
        return [];
      };

      const rawDistance = raw?.distance ?? raw?.distance_km ?? raw?.distanceKm;
      const distanceLabel =
        typeof rawDistance === "number" && Number.isFinite(rawDistance)
          ? `${rawDistance.toFixed(1)} km`
          : ensureString(rawDistance, "Distância não informada");

      const minDelivery =
        raw?.delivery_time_min ??
        raw?.min_delivery_time ??
        raw?.deliveryTimeMin ??
        raw?.minDeliveryTime;
      const maxDelivery =
        raw?.delivery_time_max ??
        raw?.max_delivery_time ??
        raw?.deliveryTimeMax ??
        raw?.maxDeliveryTime;

      let deliveryTime = ensureString(
        raw?.delivery_time ?? raw?.deliveryTime ?? raw?.delivery_duration,
        ""
      );

      if (!deliveryTime.trim()) {
        const minValue = Number(minDelivery);
        const maxValue = Number(maxDelivery);
        if (Number.isFinite(minValue) && Number.isFinite(maxValue)) {
          deliveryTime = `${Math.round(minValue)} - ${Math.round(maxValue)} min`;
        } else if (Number.isFinite(minValue)) {
          deliveryTime = `${Math.round(minValue)} min`;
        } else if (Number.isFinite(maxValue)) {
          deliveryTime = `${Math.round(maxValue)} min`;
        } else {
          deliveryTime = "Tempo não informado";
        }
      }

      const promotion = ensureString(raw?.promotion ?? raw?.promo, "").trim();

      const brandColor =
        ensureString(
          raw?.brand_color ??
            raw?.brandColor ??
            raw?.accent_color ??
            raw?.accentColor,
          ""
        ) ||
        pickFallbackBrandColor(ensureString(raw?.id ?? raw?.name, "")) ||
        theme.colors.secondary;

      const normalizedState = ensureString(
        raw?.state ?? raw?.state_acronym ?? raw?.stateAcronym ?? raw?.uf,
        ""
      )
        .trim()
        .toUpperCase();

      const normalizedCity = ensureString(
        raw?.city ?? raw?.city_name ?? raw?.cityName,
        ""
      ).trim();

      return {
        id: ensureString(raw?.id, "").trim(),
        name: ensureString(raw?.name, "Loja"),
        description: ensureString(raw?.description, "Descrição não informada."),
        category: ensureString(raw?.category ?? raw?.segment, "Categoria"),
        distance: distanceLabel,
        deliveryTime,
        rating: Math.max(0, Math.min(5, ensureNumber(raw?.rating, 0))),
        isOpen: parseBoolean(raw?.is_open ?? raw?.isOpen ?? raw?.open, true),
        promotion: promotion || undefined,
        brandColor,
        city: normalizedCity,
        state: normalizedState,
        bannerImage: ensureString(
          raw?.banner_image ??
            raw?.banner_url ??
            raw?.bannerUrl ??
            raw?.bannerImage ??
            raw?.banner,
          ""
        ),
        logo: ensureString(
          raw?.logo ??
            raw?.logo_url ??
            raw?.logoUrl ??
            raw?.profile_picture_url ??
            raw?.profilePictureUrl,
          ""
        ),
        about: ensureString(
          raw?.about ?? raw?.long_description ?? raw?.longDescription ?? raw?.description,
          ""
        ),
        info: parseArray<StoreInfoBlock>(
          raw?.info ?? raw?.information ?? raw?.info_blocks ?? raw?.infoBlocks
        ),
        workingHours: parseArray<StoreInfoBlock>(
          raw?.working_hours ??
            raw?.workingHours ??
            raw?.schedule ??
            raw?.business_hours ??
            raw?.businessHours
        ),
        promotions: parseArray<StorePromotion>(
          raw?.promotions ??
            raw?.highlighted_products ??
            raw?.highlightedProducts ??
            raw?.products
        ),
      };
    },
    [theme.colors.secondary]
  );

  const loadStores = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoadingStores(true);
    setLoadError(null);

    try {
      const { data, error } = await getStores();


      if (!isMountedRef.current) return;

      if (error) {
        console.error("StoreScreen: erro ao carregar lojas:", error);
        setLoadError("Nao foi possivel carregar as lojas. Tente novamente.");
        setStores([]);
        return;
      }

      const mappedStoresRaw = Array.isArray(data)
        ? data.filter(Boolean).map(mapStoreFromApi)
        : [];

      const seenIds = new Set<string>();
      const dedupedStores: Store[] = [];

      for (const store of mappedStoresRaw) {
        const id = store.id.trim();
        if (!id || seenIds.has(id)) {
          continue;
        }
        seenIds.add(id);
        dedupedStores.push(store);
      }

      dedupedStores.sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
      );

      setStores(dedupedStores);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("StoreScreen: erro inesperado ao carregar lojas:", error);
      setLoadError("Nao foi possivel carregar as lojas. Tente novamente.");
      setStores([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingStores(false);
      }
    }
  }, [getStores, mapStoreFromApi]);

  const syncFavoriteStores = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    if (!userId) {
      setFavoriteStoreIds((current) => {
        if (Object.keys(current).length === 0) {
          return current;
        }
        return {};
      });
      return;
    }

    try {
      const { data, error } = await getFavoriteStoresByUser(userId);

      if (!isMountedRef.current) {
        return;
      }

      if (error) {
        console.warn("StoreScreen: falha ao buscar lojas favoritas:", error);
        return;
      }

      const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
      const favoriteIds = new Set<string>();

      for (const entry of rows) {
        if (entry && typeof entry === "object") {
          const storeId = extractFavoriteStoreId(entry);
          if (storeId) {
            favoriteIds.add(storeId);
          }
        }
      }

      setFavoriteStoreIds((current) => {
        const next: Record<string, boolean> = { ...current };
        let hasChanged = false;

        favoriteIds.forEach((storeId) => {
          if (next[storeId] !== true) {
            next[storeId] = true;
            hasChanged = true;
          }
        });

        Object.keys(next).forEach((storeId) => {
          if (!favoriteIds.has(storeId) && next[storeId]) {
            next[storeId] = false;
            hasChanged = true;
          }
        });

        return hasChanged ? next : current;
      });
    } catch (error) {
      if (isMountedRef.current) {
        console.error("StoreScreen: erro inesperado ao buscar lojas favoritas:", error);
      }
    }
  }, [getFavoriteStoresByUser, userId]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    syncFavoriteStores();
  }, [syncFavoriteStores]);

  useEffect(() => {
    if (!stores.length) {
      return;
    }

    setFavoriteStoreIds((current) => {
      const next: Record<string, boolean> = { ...current };
      let hasChanged = false;

      for (const store of stores) {
        if (!Object.prototype.hasOwnProperty.call(next, store.id)) {
          next[store.id] = false;
          hasChanged = true;
        }
      }

      return hasChanged ? next : current;
    });
  }, [stores]);

  useEffect(() => {
    let cancelled = false;

    const computeStoreDistances = async () => {
      if (!stores.length) {
        geocodedStoreCoordsRef.current = {};
        setStoreDistances({});
        setStoreLocationMeta({});
        return;
      }

      setIsLoadingDistances(true);

      const shouldComputeDistances = Boolean(userLocation);

      const ids = stores
        .map((store) => store.id.trim())
        .filter((id) => id.length > 0);

      const storeById = new Map(
        stores.map((store) => [store.id.trim(), store])
      );

      const idSet = new Set(ids);
      for (const cachedId of Object.keys(geocodedStoreCoordsRef.current)) {
        if (!idSet.has(cachedId)) {
          delete geocodedStoreCoordsRef.current[cachedId];
        }
      }

      const nextDistances: Record<string, number> = {};
      const nextLocations: Record<string, { city: string | null; state: string | null }> = {};

      for (const storeId of ids) {
        try {
          let coordinates = geocodedStoreCoordsRef.current[storeId];

          if (!coordinates) {
            const { data, error } = await getAddressesStore(storeId);

            if (error) {
              console.error(
                `StoreScreen: erro ao buscar endereço da loja ${storeId}:`,
                error
              );
              continue;
            }

            let addresses: any[] | undefined;

            if (Array.isArray(data)) {
              addresses = data;
            } else if (data && Array.isArray((data as any).logAddress)) {
              addresses = (data as any).logAddress;
            }

            const primaryAddress = addresses?.[0];

            if (primaryAddress) {
              const normalizedCity =
                typeof primaryAddress?.city === "string"
                  ? primaryAddress.city.trim()
                  : "";
              const normalizedStateAcronym =
                typeof primaryAddress?.state_acronym === "string"
                  ? primaryAddress.state_acronym.trim().toUpperCase()
                  : "";
              const normalizedStateName =
                typeof primaryAddress?.state === "string"
                  ? primaryAddress.state.trim().toUpperCase()
                  : "";

              nextLocations[storeId] = {
                city: normalizedCity || null,
                state:
                  normalizedStateAcronym ||
                  normalizedStateName ||
                  null,
              };

              if (
                typeof primaryAddress?.latitude === "number" &&
                typeof primaryAddress?.longitude === "number"
              ) {
                const coords: Coordinates = {
                  latitude: primaryAddress.latitude,
                  longitude: primaryAddress.longitude,
                };
                coordinates = coords;
                geocodedStoreCoordsRef.current[storeId] = coords;
              }

              if (!coordinates) {
                const addressParts = [
                  [primaryAddress.street, primaryAddress.street_number]
                    .filter(Boolean)
                    .join(", ")
                    .trim(),
                  primaryAddress.neighborhood,
                  primaryAddress.city,
                  primaryAddress.state_acronym ?? primaryAddress.state,
                  primaryAddress.country ?? "Brasil",
                ]
                  .filter((part: string | null | undefined) => {
                    if (typeof part !== "string") return false;
                    return part.trim().length > 0;
                  })
                  .map((part: string) => part.trim());

                if (addressParts.length) {
                  const formattedAddress = addressParts.join(", ");

                  if (formattedAddress) {
                    const geocodedResults = await geocodeAsync(formattedAddress);

                    const firstValid = geocodedResults.find(
                      (entry) =>
                        typeof entry?.latitude === "number" &&
                        typeof entry?.longitude === "number"
                    );

                    if (firstValid) {
                      const coords: Coordinates = {
                        latitude: firstValid.latitude,
                        longitude: firstValid.longitude,
                      };

                      geocodedStoreCoordsRef.current[storeId] = coords;
                      coordinates = coords;
                    }
                  }
                }
              }
            }
          }

          if (!nextLocations[storeId]) {
            const previousMeta = storeLocationMetaRef.current[storeId];
            if (previousMeta) {
              nextLocations[storeId] = {
                city: previousMeta.city ?? null,
                state: previousMeta.state ?? null,
              };
            } else {
              const fallbackStore = storeById.get(storeId);
              if (fallbackStore) {
                const fallbackCity = fallbackStore.city?.trim() || null;
                const fallbackState = fallbackStore.state?.trim() || null;
                if (fallbackCity || fallbackState) {
                  nextLocations[storeId] = {
                    city: fallbackCity,
                    state: fallbackState,
                  };
                }
              }
            }
          } else {
            const fallbackStore = storeById.get(storeId);
            if (fallbackStore) {
              const meta = nextLocations[storeId];
              if (!meta.city && fallbackStore.city) {
                meta.city = fallbackStore.city.trim();
              }
              if (!meta.state && fallbackStore.state) {
                meta.state = fallbackStore.state.trim();
              }
            }
          }

          if (
            shouldComputeDistances &&
            userLocation &&
            coordinates &&
            Number.isFinite(coordinates.latitude) &&
            Number.isFinite(coordinates.longitude)
          ) {
            const distanceKm = calculateDistanceKm(userLocation, coordinates);
            nextDistances[storeId] = distanceKm;
          }
        } catch (error) {
          console.error(
            `StoreScreen: erro ao calcular distância para a loja ${storeId}:`,
            error
          );
        }
      }

      if (!cancelled) {
        setStoreLocationMeta((current) => {
          const updated: Record<string, { city: string | null; state: string | null }> = {};

          for (const id of ids) {
            if (nextLocations[id]) {
              updated[id] = nextLocations[id];
            } else if (current[id]) {
              updated[id] = current[id];
            }
          }

          return updated;
        });

        if (shouldComputeDistances) {
          setStoreDistances((current) => {
            const updated: Record<string, number> = {};

            for (const id of ids) {
              if (nextDistances[id] !== undefined) {
                updated[id] = nextDistances[id];
              } else if (current[id] !== undefined) {
                updated[id] = current[id];
              }
            }

            return updated;
          });
        } else {
          setStoreDistances({});
        }
      }
    };

    computeStoreDistances()
      .catch((error) =>
        console.error(
          "StoreScreen: erro inesperado ao calcular distâncias:",
          error
        )
      )
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDistances(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getAddressesStore, stores, userLocation]);

  useEffect(() => {
    let isCancelled = false;

    const fetchRatings = async () => {
      const storeIds = stores.map((store) => store.id.trim()).filter(Boolean);

      if (!storeIds.length) {
        if (!isCancelled) {
          setStoreRatings({});
          setIsLoadingRatings(false);
        }
        return;
      }

      setIsLoadingRatings(true);
      const ratingsAcc: Record<string, number> = {};

      try {
        await Promise.all(
          storeIds.map(async (storeId) => {
            try {
              const { data, error } = await getStoreRatingsAverage(storeId);
              if (error) {
                console.error(
                  `StoreScreen: erro ao buscar avaliacoes da loja ${storeId}:`,
                  error
                );
                return;
              }

              if (!data) {
                return;
              }

              const averageValue = Number(data?.average);
              const ratingsCount = Number(data?.count ?? 0);

              if (!Number.isFinite(averageValue) || ratingsCount <= 0) {
                return;
              }

              ratingsAcc[storeId] = Math.max(0, Math.min(5, averageValue));
            } catch (error) {
              console.error(
                `StoreScreen: erro inesperado ao buscar avaliacoes da loja ${storeId}:`,
                error
              );
            }
          })
        );

        if (!isCancelled) {
          setStoreRatings(ratingsAcc);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRatings(false);
        }
      }
    };

    fetchRatings();

    return () => {
      isCancelled = true;
    };
  }, [getStoreRatingsAverage, stores]);

  const parseDistance = useCallback((distance: string) => {
    const normalized = distance.replace(",", ".").replace(/[^\d.]/g, "");
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? Infinity : parsed;
  }, []);

  const filteredStores = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return stores.filter((store) => {
      const matchesSearch =
        !normalized ||
        store.name.toLowerCase().includes(normalized) ||
        store.description.toLowerCase().includes(normalized) ||
        store.category.toLowerCase().includes(normalized);

      if (!matchesSearch) {
        return false;
      }

      const locationMeta = storeLocationMeta[store.id];
      const stateCandidate = (locationMeta?.state ?? store.state ?? "").trim();
      const cityCandidate = (locationMeta?.city ?? store.city ?? "").trim();

      const shouldApplyStateFilter = Boolean(filters.city && filters.state);
      const normalizedFilterState = shouldApplyStateFilter
        ? normalizeStateKey(filters.state)
        : null;
      const normalizedStoreState = normalizeStateKey(stateCandidate);

      if (
        normalizedFilterState &&
        (!normalizedStoreState ||
          normalizedStoreState !== normalizedFilterState)
      ) {
        return false;
      }

      const normalizedFilterCity = filters.city
        ? normalizeForComparison(filters.city)
        : null;
      const normalizedStoreCity = cityCandidate
        ? normalizeForComparison(cityCandidate)
        : null;

      if (
        normalizedFilterCity &&
        (!normalizedStoreCity || normalizedStoreCity !== normalizedFilterCity)
      ) {
        return false;
      }

      if (filters.radiusKm !== null) {
        const computedDistance = storeDistances[store.id];
        const hasComputedDistance =
          typeof computedDistance === "number" && Number.isFinite(computedDistance);

        if (hasComputedDistance) {
          if (computedDistance > filters.radiusKm) {
            return false;
          }
        } else {
          const fallbackDistance = parseDistance(store.distance);

          if (
            Number.isFinite(fallbackDistance) &&
            fallbackDistance > filters.radiusKm
          ) {
            return false;
          }
        }
      }

      if (filters.favoritesOnly && !favoriteStoreIds[store.id]) {
        return false;
      }

      return true;
    });
  }, [
    favoriteStoreIds,
    filters.city,
    filters.favoritesOnly,
    filters.radiusKm,
    filters.state,
    parseDistance,
    searchTerm,
    storeDistances,
    storeLocationMeta,
    stores,
  ]);

  const handleOpenFilters = () => {
    setFilterModalVisible(true);
  };

  const handleStorePress = (store: Store) => {
    router.push({
      pathname: "/(auth)/store/[id_store]",
      params: { id_store: store.id },
    });
  };

  const toggleFavorite = useCallback(
    async (storeId: string) => {
      if (!storeId) {
        return;
      }

      if (!userId) {
        console.warn("StoreScreen: usuario nao autenticado ao modificar favoritos de loja.");
        return;
      }

      let nextValue = false;

      setFavoriteStoreIds((current) => {
        const currentValue = Boolean(current[storeId]);
        nextValue = !currentValue;
        return {
          ...current,
          [storeId]: nextValue,
        };
      });

      try {
        if (nextValue) {
          const { error } = await addStoreToFavorites(userId, storeId);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await removeStoreFromFavorites(userId, storeId);
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error("StoreScreen: erro ao atualizar favorito da loja:", error);
        setFavoriteStoreIds((current) => ({
          ...current,
          [storeId]: !nextValue,
        }));
      }
    },
    [addStoreToFavorites, removeStoreFromFavorites, userId]
  );

  const handleApplyFilters = (nextFilters: StoreFilters) => {
    setFilters(nextFilters);
    setFilterModalVisible(false);
  };

  const handleCancelFilters = () => {
    setFilterModalVisible(false);
  };

  const handleClearLocation = () => {
    setFilters((current) => ({
      ...current,
      state: null,
      city: null,
    }));
  };

  const handleClearRadius = () => {
    setFilters((current) => ({
      ...current,
      radiusKm: null,
    }));
  };

  const handleClearFavoritesOnly = () => {
    setFilters((current) => ({
      ...current,
      favoritesOnly: false,
    }));
  };

  const handleResetFilters = useCallback(() => {
    setFilters({
      state: EMPTY_FILTERS.state,
      city: EMPTY_FILTERS.city,
      radiusKm: EMPTY_FILTERS.radiusKm,
      favoritesOnly: EMPTY_FILTERS.favoritesOnly,
    });
  }, []);

  const renderListHeader = useCallback(() => {
    const filterIconColor = theme.colors.primary;

    return (
      <View style={styles.listHeader}>
        <View style={styles.searchRow}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Pesquisar..."
          />
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              onPress={handleOpenFilters}
              style={styles.filterShortcut}
              accessibilityRole="button"
              activeOpacity={0.7}
              accessibilityLabel="Abrir filtros"
            >
              <Icon type="feather" name="sliders" size={18} color={filterIconColor} />
            </TouchableOpacity>

            {hasVisibleFilters ? (
              <TouchableOpacity onPress={handleResetFilters} style={styles.clearFiltersButton} activeOpacity={0.7}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="broom"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.clearFiltersText}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterChipsWrapper}>
            {filters.city || filters.state ? (
              <View style={styles.filterChip}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="map-marker"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.filterChipText}>{locationLabel}</Text>
                <TouchableOpacity
                  onPress={handleClearLocation}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar localidade"
                  style={styles.filterChipRemove}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            {filters.radiusKm !== null ? (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.radiusKm} km</Text>
                <TouchableOpacity
                  onPress={handleClearRadius}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar raio"
                  style={styles.filterChipRemove}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            {filters.favoritesOnly ? (
              <View style={styles.filterChip}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="heart"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.filterChipText}>Favoritas</Text>
                <TouchableOpacity
                  onPress={handleClearFavoritesOnly}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar filtro de favoritas"
                  style={styles.filterChipRemove}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }, [
    filters.city,
    filters.favoritesOnly,
    filters.radiusKm,
    filters.state,
    handleClearLocation,
    handleClearFavoritesOnly,
    handleClearRadius,
    handleOpenFilters,
    handleResetFilters,
    hasFilterOverrides,
    hasVisibleFilters,
    locationLabel,
    searchTerm,
    setSearchTerm,
    styles,
    theme.colors.onPrimary,
    theme.colors.primary,
  ]);

  const renderEmptyState = () => {
    if (loadError) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Icon
              type="MaterialCommunityIcons"
              name="alert-circle-outline"
              size={48}
              color={theme.colors.danger}
            />
          </View>
          <Text style={styles.emptyStateText}>{loadError}</Text>
          <Button
            title="Tentar novamente"
            onPress={() => {
              loadStores();
            }}
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Icon
            type="MaterialCommunityIcons"
            name="store-off"
            size={48}
            color={theme.colors.disabled}
          />
        </View>
        <Text style={styles.emptyStateText}>
          Nenhuma loja encontrada para a sua busca.
        </Text>
      </View>
    );
  };

  const renderStore = ({ item }: ListRenderItemInfo<Store>) => {
    const isFavorite = favoriteStoreIds[item.id];
    const hasRemoteRating = Object.prototype.hasOwnProperty.call(
      storeRatings,
      item.id
    );
    const isRatingLoading = isLoadingRatings && !hasRemoteRating;
    const ratingValue = hasRemoteRating
      ? storeRatings[item.id]
      : item.rating;
    const ratingLabel = Number.isFinite(ratingValue)
      ? ratingValue.toFixed(2)
      : item.rating.toFixed(2);
    const distanceValue = storeDistances[item.id];
    const hasComputedDistance =
      typeof distanceValue === "number" && Number.isFinite(distanceValue);
    const distanceLabel = hasComputedDistance
      ? `${distanceValue.toFixed(2)} km`
      : isLoadingDistances || isRequestingLocation
      ? "Calculando..."
      : item.distance || "Distância indisponível";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.storeCard}
        onPress={() => handleStorePress(item)}
      >
        <View style={[styles.storeAvatar, { backgroundColor: item.brandColor }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.storeLogo} />
          ) : (
            <Text style={styles.avatarInitials}>
              {item.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0))
                .join("")
                .toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.storeDetails}>
          <View style={styles.cardHeader}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.name}
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Favoritar ${item.name}`}
              onPress={() => toggleFavorite(item.id)}
              activeOpacity={0.7}
              style={[
                styles.favoriteButton,
                // isFavorite && styles.favoriteButtonActive,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                type="MaterialCommunityIcons"
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {!item.isOpen && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Fechada</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="star"
                  size={16}
                  color={theme.colors.star}
                />
                <Text style={[styles.metaText, styles.metaTextWithIcon]}>
                  {isRatingLoading ? "..." : ratingLabel}
                </Text>
            </View>
            <View style={styles.metaSeparator} />
            <Text style={styles.metaText}>{item.category}</Text>
            <View style={styles.metaSeparator} />    
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="map-marker"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.metaText, styles.metaTextWithIcon]}>
                {distanceLabel}
              </Text>
            </View>
          </View>

          {item.promotion ? (
            <View style={styles.promoPill}>
              <Icon
                type="MaterialCommunityIcons"
                name="tag-heart"
                size={16}
                color={theme.colors.success}
              />
              <Text style={styles.promoText} numberOfLines={1}>
                {item.promotion}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const listContentStyle = filteredStores.length
    ? styles.listContent
    : [styles.listContent, styles.listContentEmpty];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Lojas" />
        <View style={styles.content}>
          {isLoadingStores ? (
            <>
              {renderListHeader()}
              <View style={styles.loadingWrapper}>
                <LoadingIcon
                  autoPlay
                  loop
                  refAnimationLoading={animationLoading}
                  style={{ width: 150, height: 150 }}
                />
              </View>
            </>
          ) : (
            <FlatList
              data={filteredStores}
              keyExtractor={(item) => item.id}
              renderItem={renderStore}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={listContentStyle}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyState()}
              refreshing={isLoadingStores}
              onRefresh={() => {
                loadStores();
                syncFavoriteStores();
              }}
            />
          )}
        </View>
      </View>
      <FilterModal
        visible={isFilterModalVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        theme={theme}
        styles={styles}
        bottomInset={insets.bottom}
      />
    </ScreenContainer>
  );
}

const SliderComponent = (() => {
  try {
    const sliderModule = require("@react-native-community/slider");
    return sliderModule?.default ?? sliderModule;
  } catch (error) {
    return null;
  }
})();

type DistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  disabled?: boolean;
};

const DistanceSlider = ({
  value,
  onChange,
  min = 1,
  max = 20,
  theme,
  styles,
  disabled = false,
}: DistanceSliderProps) => {
  if (SliderComponent) {
    return (
      <SliderComponent
        value={value}
        onValueChange={(next: number) => onChange(Math.round(next))}
        minimumValue={min}
        maximumValue={max}
        step={1}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.disabled}
        thumbTintColor={theme.colors.primary}
        style={styles.slider}
        disabled={disabled}
      />
    );
  }

  const handleIncrement = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta));
    onChange(next);
  };

  return (
    <View
      style={[
        styles.sliderFallback,
        disabled && styles.sliderDisabled,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.sliderFallbackButton,
          disabled && styles.sliderFallbackButtonDisabled,
        ]}
        onPress={() => handleIncrement(-1)}
        disabled={disabled}
      >
        <Text style={styles.sliderFallbackButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.sliderFallbackValue}>{value} km</Text>
      <TouchableOpacity
        style={[
          styles.sliderFallbackButton,
          disabled && styles.sliderFallbackButtonDisabled,
        ]}
        onPress={() => handleIncrement(1)}
        disabled={disabled}
      >
        <Text style={styles.sliderFallbackButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

type FilterModalProps = {
  visible: boolean;
  filters: StoreFilters;
  onApply: (filters: StoreFilters) => void;
  onCancel: () => void;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
};

const FilterModal = ({
  visible,
  filters,
  onApply,
  onCancel,
  theme,
  styles,
  bottomInset,
}: FilterModalProps) => {
  const [cityValue, setCityValue] = useState(filters.city ?? "");
  const [radiusValue, setRadiusValue] = useState(filters.radiusKm ?? 5);
  const [radiusEnabled, setRadiusEnabled] = useState(filters.radiusKm !== null);
  const [isCitySelectorVisible, setIsCitySelectorVisible] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(filters.favoritesOnly ?? false);

  useEffect(() => {
    setCityValue(filters.city ?? "");
    setRadiusValue(filters.radiusKm ?? 5);
    setRadiusEnabled(filters.radiusKm !== null);
    setFavoritesOnly(filters.favoritesOnly ?? false);
  }, [filters]);

  useEffect(() => {
    if (!visible) {
      setIsCitySelectorVisible(false);
      setCitySearch("");
    }
  }, [visible]);

  const filteredCityOptions = useMemo(() => {
    if (!citySearch.trim()) {
      return IJUI_REGION_CITIES;
    }
    const query = normalizeForComparison(citySearch);
    return IJUI_REGION_CITIES.filter((option) =>
      normalizeForComparison(option).includes(query)
    );
  }, [citySearch]);

  const handleApply = () => {
    const normalizedCity = cityValue?.trim() ? cityValue : null;
    const shouldApplyState = Boolean(normalizedCity);
    onApply({
      state: shouldApplyState ? LOCKED_STATE.sigla : null,
      city: normalizedCity,
      radiusKm: radiusEnabled ? radiusValue ?? 5 : null,
      favoritesOnly,
    });
  };

  return (
    <>
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={onCancel}
      >
        <View style={styles.filterModalContainer}>
          <TouchableWithoutFeedback onPress={onCancel}>
            <View style={styles.filterModalOverlay} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.filterModalCard,
              {
                paddingBottom: theme.spacing.sm + Math.max(bottomInset, 0),
              },
            ]}
          >
            <View style={styles.filterModalHandle} />
            <Text style={styles.filterModalTitle}>Filtros</Text>

            <View style={styles.filterFieldGroup}>
              <View style={{ gap: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterLabel}>Estado:</Text>
                  <View
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderRadius: theme.radius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                    }}
                  >
                    <View
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        opacity: 0.7,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: theme.colors.text }}>
                          {`${LOCKED_STATE.sigla} - ${LOCKED_STATE.nome}`}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icon
                            type="MaterialCommunityIcons"
                            name="lock-outline"
                            size={16}
                            color={theme.colors.primary}
                          />
                          <Text
                            style={{
                              color: theme.colors.primary,
                              fontSize: 12,
                            }}
                          >
                            fixo
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Cidade:</Text>
                    <View
                      style={{
                        backgroundColor: theme.colors.secondary,
                        borderRadius: theme.radius.lg,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setIsCitySelectorVisible(true)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: cityValue ? theme.colors.text : theme.colors.disabled,
                          }}
                        >
                          {cityValue || "Selecione a cidade"}
                        </Text>
                        <Icon
                          type="MaterialCommunityIcons"
                          name="chevron-down"
                          size={18}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.filterFieldGroup}>
              <View style={styles.radiusHeader}>
                <Text style={styles.filterLabel}>Em um raio de distancia:</Text>
                <TouchableOpacity
                  style={styles.radiusToggle}
                  onPress={() => setRadiusEnabled((current) => !current)}
                  activeOpacity={0.7}
                >
                  <Icon
                    type="MaterialCommunityIcons"
                    name={radiusEnabled ? "close-circle-outline" : "check-circle"}
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radiusToggleText}>
                    {radiusEnabled ? "Sem limite" : "Com limite"}
                  </Text>
                </TouchableOpacity>
              </View>
              <DistanceSlider
                value={radiusValue ?? 5}
                onChange={(value) => {
                  setRadiusEnabled(true);
                  setRadiusValue(value);
                }}
                min={1}
                max={20}
                theme={theme}
                styles={styles}
                disabled={!radiusEnabled}
              />
              <View style={styles.sliderValueRow}>
                {radiusEnabled ? (
                  <></>
                ) : (
                  <Text style={styles.sliderValueUnlimited}>Sem limite definido</Text>
                )}
              </View>
            </View>

            <View style={styles.filterFieldGroup}>
              <Text style={styles.favoriteFilterTitle}>Filtros de Favoritos:</Text>
              <TouchableOpacity
                style={[
                  styles.favoriteTogglePill,
                  favoritesOnly && styles.favoriteTogglePillActive,
                ]}
                onPress={() => setFavoritesOnly((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.favoriteToggleCheckbox,
                    favoritesOnly && styles.favoriteToggleCheckboxActive,
                  ]}
                >
                  {favoritesOnly ? (
                    <Icon
                      type="MaterialCommunityIcons"
                      name="check"
                      size={16}
                      color={theme.colors.onPrimary}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.favoriteToggleLabel,
                    favoritesOnly && styles.favoriteToggleLabelActive,
                  ]}
                >
                  Mostrar apenas lojas favoritas
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Aplicar Filtros"
              onPress={handleApply}
              style={styles.applyFilterButton}
            />

            <TouchableOpacity
              style={[
                styles.cancelFilterButton,
                {
                  marginBottom:
                    bottomInset > 0 ? bottomInset : theme.spacing.sm,
                },
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelFilterButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        animationType="fade"
        visible={isCitySelectorVisible}
        onRequestClose={() => setIsCitySelectorVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            // padding: theme.spacing.lg,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setIsCitySelectorVisible(false)}
          />
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.md,
                color: theme.colors.text,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: theme.spacing.sm,
              }}
            >
              Selecionar cidade
            </Text>

            <View
              style={{
                backgroundColor: theme.colors.secondary,
                borderRadius: theme.radius.lg,
                borderWidth: theme.size.xs,
                borderColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                marginBottom: theme.spacing.sm,
              }}
            >
              <TextInput
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Buscar cidade..."
                placeholderTextColor={theme.colors.disabled}
                style={{
                  fontFamily: theme.fonts.regular,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text,
                }}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCityOptions.map((option) => {
                const isSelected = option === cityValue;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      setCityValue(option);
                      setIsCitySelectorVisible(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: theme.spacing.sm,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.secondary,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.regular,
                        fontSize: theme.fontSizes.sm,
                        color: theme.colors.text,
                      }}
                    >
                      {option}
                    </Text>
                    {isSelected ? (
                      <Icon
                        type="MaterialCommunityIcons"
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {filteredCityOptions.length === 0 ? (
                <View
                  style={{
                    paddingVertical: theme.spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.regular,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.disabled,
                    }}
                  >
                    Nenhuma cidade encontrada
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: theme.spacing.md,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setCityValue("");
                  setIsCitySelectorVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.primary,
                  }}
                >
                  Limpar cidade
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsCitySelectorVisible(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.primary,
                  }}
                >
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

