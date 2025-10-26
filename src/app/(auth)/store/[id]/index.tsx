import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { geocodeAsync, getCurrentPositionAsync, LocationAccuracy, requestForegroundPermissionsAsync } from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEFAULT_FILTERS, Store } from "../mockStores";
import createStyles from "./styled";


const SCROLL_STEP = 220;

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

const parseArrayField = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn("StoreProfile: falha ao converter campo em array", error);
    }
  }
  return [];
};

type StoreResponse = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  distance?: string;
  delivery_time?: string;
  rating?: number;
  is_open?: boolean;
  promotion?: string;
  brand_color?: string;
  brandColor?: string;
  city?: string;
  city_name?: string;
  state?: string;
  state_acronym?: string;
  banner_image?: string;
  banner_url?: string;
  logo?: string;
  logo_url?: string;
  profile_picture_url?: string;
  about?: string;
  long_description?: string;
  info?: any;
  info_blocks?: any;
  working_hours?: any;
  business_hours?: any;
  promotions?: any;
  highlighted_products?: any;
  distance_km?: number;
};


const mapStoreResponseToStore = (data: StoreResponse | null): Store | undefined => {
  if (!data?.id) {
    return undefined;
  }

  const distanceRaw =
    data.distance ?? (typeof (data as any).distance_km === "number"
      ? `${(data as any).distance_km} km`
      : undefined);

  const deliveryTimeRaw =
    data.delivery_time ?? (data as any).delivery_time_label ?? "Tempo nao informado";

  const bannerImage =
    data.banner_image ?? (data as any).banner_url ?? "";

  const logoImage =
    data.logo ?? (data as any).logo_url ?? (data as any).profile_picture_url ?? "";

  const aboutText =
    data.about ?? (data as any).long_description ?? data.description ?? "Informacoes nao disponiveis.";

  return {
    id: data.id,
    name: data.name ?? "Loja",
    description: data.description ?? "Descricao nao informada.",
    category: data.category ?? "Categoria",
    distance: distanceRaw ?? "Distancia nao informada",
    deliveryTime: deliveryTimeRaw,
    rating: typeof data.rating === "number" ? data.rating : Number(data.rating) || 0,
    isOpen: data.is_open ?? (data as any).isOpen ?? true,
    promotion: data.promotion ?? (data as any).promo ?? undefined,
    brandColor: data.brand_color ?? (data as any).brandColor ?? "#FEE9EA",
    city: data.city ?? (data as any).city_name ?? "",
    state: data.state ?? (data as any).state_acronym ?? "",
    bannerImage,
    logo: logoImage,
    about: aboutText,
    info: parseArrayField(data.info ?? (data as any).info_blocks) as Store["info"],
    workingHours: parseArrayField(data.working_hours ?? (data as any).business_hours) as Store["workingHours"],
    promotions: parseArrayField(data.promotions ?? (data as any).highlighted_products) as Store["promotions"],
  };
};

type StoreScheduleItem = {
  day_of_week: string;
  opens_at?: string | null;
  closes_at?: string | null;
  is_open?: boolean;
  is_holiday?: boolean;
};

const STORE_DAY_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DAY_DISPLAY_MAP: Record<string, string> = {
  Segunda: "Segunda",
  Terça: "Terca",
  Quarta: "Quarta",
  Quinta: "Quinta",
  Sexta: "Sexta",
  Sábado: "Sabado",
  Domingo: "Domingo",
  Feriado: "Feriados",
};

const getDayOrderIndex = (day: string): number | null => {
  const index = STORE_DAY_ORDER.indexOf(day);
  return index >= 0 ? index : null;
};

const formatTime = (time?: string | null) => {
  if (!time || typeof time !== "string") {
    return null;
  }

  const [hours, minutes] = time.split(":");
  if (!hours || !minutes) {
    return null;
  }

  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}h`;
};

const formatScheduleValue = (entry: StoreScheduleItem) => {
  if (entry.is_open === false) {
    return "Fechado";
  }

  const opensAt = formatTime(entry.opens_at);
  const closesAt = formatTime(entry.closes_at);

  if (opensAt && closesAt) {
    return `${opensAt} as ${closesAt}`;
  }

  if (opensAt) {
    return `A partir das ${opensAt}`;
  }

  if (closesAt) {
    return `Ate ${closesAt}`;
  }

  return "Horario nao informado";
};

const buildDayLabel = (days: string[]) => {
  if (!days.length) {
    return "Horario";
  }

  const hasHoliday = days.includes("Feriado");
  const regularDays = days.filter((day) => day !== "Feriado");
  const displayRegularDays = regularDays
    .map((day) => DAY_DISPLAY_MAP[day] ?? day)
    .filter((value) => typeof value === "string" && value.length > 0);
  const holidayDisplay = DAY_DISPLAY_MAP.Feriado ?? "Feriados";

  let label = "";

  if (displayRegularDays.length === 1) {
    label = displayRegularDays[0];
  } else if (displayRegularDays.length === 2) {
    label = `${displayRegularDays[0]} e ${displayRegularDays[1]}`;
  } else if (displayRegularDays.length > 2) {
    label = `${displayRegularDays[0]} a ${displayRegularDays[displayRegularDays.length - 1]}`;
  }

  if (hasHoliday) {
    if (label) {
      label = `${label} e ${holidayDisplay}`;
    } else {
      label = holidayDisplay;
    }
  }

  if (!label) {
    if (displayRegularDays.length) {
      return displayRegularDays[0];
    }
    if (hasHoliday) {
      return holidayDisplay;
    }
    const fallbackDay = days[0];
    return DAY_DISPLAY_MAP[fallbackDay] ?? fallbackDay ?? "Horario";
  }

  return label;
};

const mapScheduleResponseToWorkingHours = (raw: unknown): Store["workingHours"] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const entries = raw.filter((item): item is StoreScheduleItem => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof (item as any).day_of_week === "string"
    );
  });

  if (!entries.length) {
    return [];
  }

  type Group = { days: string[]; value: string; lastIndex: number | null };
  const groups: Group[] = [];

  const regularEntries = entries.filter((item) => !item.is_holiday);
  regularEntries.sort((a, b) => {
    const indexA = getDayOrderIndex(a.day_of_week);
    const indexB = getDayOrderIndex(b.day_of_week);
    const safeA = indexA ?? Number.MAX_SAFE_INTEGER;
    const safeB = indexB ?? Number.MAX_SAFE_INTEGER;
    return safeA - safeB;
  });

  regularEntries.forEach((entry) => {
    const scheduleValue = formatScheduleValue(entry);
    const dayIndex = getDayOrderIndex(entry.day_of_week);
    const lastGroup = groups[groups.length - 1];

    if (
      lastGroup &&
      lastGroup.value === scheduleValue &&
      lastGroup.lastIndex !== null &&
      dayIndex !== null &&
      dayIndex === lastGroup.lastIndex + 1
    ) {
      lastGroup.days.push(entry.day_of_week);
      lastGroup.lastIndex = dayIndex;
      return;
    }

    groups.push({
      days: [entry.day_of_week],
      value: scheduleValue,
      lastIndex: dayIndex,
    });
  });

  const holidayEntries = entries.filter((item) => item.is_holiday);
  if (holidayEntries.length) {
    const holidayGroups = new Map<string, Group>();

    holidayEntries.forEach((entry) => {
      const holidayValue = formatScheduleValue(entry);
      const existingGroup = groups.find((group) => group.value === holidayValue);

      if (existingGroup) {
        if (!existingGroup.days.includes("Feriado")) {
          existingGroup.days.push("Feriado");
        }
        return;
      }

      let holidayGroup = holidayGroups.get(holidayValue);
      if (!holidayGroup) {
        holidayGroup = { days: ["Feriado"], value: holidayValue, lastIndex: null };
        holidayGroups.set(holidayValue, holidayGroup);
        groups.push(holidayGroup);
      }
    });
  }

  return groups.map((group) => ({
    label: buildDayLabel(group.days),
    value: group.value,
  }));
};

export default function StoreProfile() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const storeId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);

  const { getStoreById, getStoreRatingsAverage, getAddressesStore, getStoreSchedule } = useSession();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const promoScrollRef = useRef<ScrollView | null>(null);
  const promoOffsetRef = useRef(0);

  const [store, setStore] = useState<Store | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [storeLoadError, setStoreLoadError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [storeAddressText, setStoreAddressText] = useState<string | null>(null);
  const [storeWorkingHours, setStoreWorkingHours] = useState<Store["workingHours"]>([]);
  const workingHoursToDisplay = storeWorkingHours.length
    ? storeWorkingHours
    : store?.workingHours ?? [];
  useEffect(() => {
    let cancelled = false;

    const fetchStoreDetails = async () => {
      if (!storeId) {
        setStore(undefined);
        return;
      }

      setIsLoadingStore(true);
      setStoreLoadError(null);
      setStoreWorkingHours([]);

      try {
        const { data, error } = await getStoreById(storeId);

        const { data: scheduleData, error: scheduleError } = await getStoreSchedule(storeId);

        if (cancelled) return;

        if (scheduleError) {
          console.error("StoreProfile: erro ao buscar horario da loja:", scheduleError);
        }

        const mappedSchedule = mapScheduleResponseToWorkingHours(scheduleData);
        setStoreWorkingHours(mappedSchedule);

        if (error) {
          console.error("StoreProfile: erro ao buscar loja:", error);
          setStoreLoadError("Nao foi possivel carregar as informacoes da loja.");
          setStore(undefined);
          return;
        }

        const mappedStore = mapStoreResponseToStore(data ?? null);
        setStore(mappedStore);
        if (mappedStore) {
          const fallback = [mappedStore.city, mappedStore.state]
            .filter(Boolean)
            .join(" - ");
          if (fallback) {
            setStoreAddressText((current) => current ?? fallback);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("StoreProfile: erro inesperado ao buscar loja:", error);
          setStoreLoadError("Nao foi possivel carregar as informacoes da loja.");
          setStore(undefined);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStore(false);
        }
      }
    };

    fetchStoreDetails();

    return () => {
      cancelled = true;
    };
  }, [getStoreById, storeId]);

  useEffect(() => {
    let cancelled = false;

    const requestLocation = async () => {
      setIsRequestingLocation(true);
      try {
        const { status } = await requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setDistanceError("Permissao de localizacao negada.");
          return;
        }

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
        if (!cancelled) {
          console.error("StoreProfile: erro ao obter localizacao do usuario:", error);
          setDistanceError("Nao foi possivel obter sua localizacao.");
        }
      } finally {
        if (!cancelled) {
          setIsRequestingLocation(false);
        }
      }
    };

    requestLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeId) {
      setAverageRating(null);
      return;
    }

    let cancelled = false;

    const fetchRating = async () => {
      setIsLoadingRating(true);
      try {
        const { data, error } = await getStoreRatingsAverage(storeId);
        if (cancelled) {
          return;
        }

        if (error) {
          console.error("StoreProfile: erro ao buscar avaliacao da loja:", error);
          setAverageRating(null);
          return;
        }

        const avgValue = typeof data?.average === "number" ? data.average : Number(data?.average ?? NaN);
        if (Number.isFinite(avgValue)) {
          setAverageRating(avgValue);
        } else {
          setAverageRating(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("StoreProfile: erro inesperado ao buscar avaliacao da loja:", error);
          setAverageRating(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRating(false);
        }
      }
    };

    fetchRating();

    return () => {
      cancelled = true;
    };
  }, [getStoreRatingsAverage, storeId]);

  useEffect(() => {
    if (!storeId) {
      setDistanceKm(null);
      setDistanceError(null);
      setStoreAddressText(null);
      setStoreWorkingHours([]);
      return;
    }

    let cancelled = false;

    const fallbackAddressFromStore = () => {
      if (store?.city || store?.state) {
        return [store?.city, store?.state].filter(Boolean).join(" - ");
      }
      return null;
    };

    const fetchAddressAndDistance = async () => {
      setIsLoadingDistance(true);
      setDistanceError(null);

      try {
        const { data, error } = await getAddressesStore(storeId);

        if (cancelled) {
          return;
        }

        if (error) {
          console.error("StoreProfile: erro ao buscar endereco da loja:", error);
          setDistanceError("Nao foi possivel carregar o endereco da loja.");
          setStoreAddressText(fallbackAddressFromStore());
          setDistanceKm(null);
          return;
        }

        let addresses: any[] | undefined;
        if (Array.isArray(data)) {
          addresses = data;
        } else if (data && Array.isArray((data as any).logAddress)) {
          addresses = (data as any).logAddress;
        }

        if (!addresses?.length) {
          setStoreAddressText(fallbackAddressFromStore());
          setDistanceError("Endereco da loja nao encontrado.");
          setDistanceKm(null);
          return;
        }

        const primaryAddress = addresses[0] ?? null;
        let coordinates: Coordinates | null = null;

        if (primaryAddress) {
          const streetLine = [primaryAddress.street, primaryAddress.street_number]
            .filter(Boolean)
            .join(", ")
            .trim();
          const neighborhoodLine = (primaryAddress.neighborhood ?? "").trim();
          const cityStateLine = [
            primaryAddress.city,
            primaryAddress.state_acronym ?? primaryAddress.state,
          ]
            .filter(Boolean)
            .map((value: any) => String(value).trim())
            .filter(Boolean)
            .join(" - ");

          const displayLines = [streetLine, neighborhoodLine, cityStateLine].filter(
            (line) => typeof line === "string" && line.length > 0
          );

          if (displayLines.length) {
            setStoreAddressText(displayLines.join("\n"));
          } else {
            setStoreAddressText(fallbackAddressFromStore());
          }
        } else {
          setStoreAddressText(fallbackAddressFromStore());
        }

        if (
          primaryAddress &&
          typeof primaryAddress?.latitude === "number" &&
          typeof primaryAddress?.longitude === "number"
        ) {
          coordinates = {
            latitude: primaryAddress.latitude,
            longitude: primaryAddress.longitude,
          };
        } else if (primaryAddress) {
          const parts = [
            [primaryAddress.street, primaryAddress.street_number]
              .filter(Boolean)
              .join(", ")
              .trim(),
            primaryAddress.neighborhood,
            primaryAddress.city,
            primaryAddress.state_acronym ?? primaryAddress.state,
            primaryAddress.country ?? "Brasil",
          ]
            .filter((part: unknown): part is string =>
              typeof part === "string" && part.trim().length > 0
            )
            .map((part) => part.trim());

          if (parts.length) {
            const formattedAddress = parts.join(", ");

            try {
              const geocodedResults = await geocodeAsync(formattedAddress);
              const firstValid = geocodedResults.find(
                (entry) =>
                  typeof entry?.latitude === "number" &&
                  typeof entry?.longitude === "number"
              );

              if (firstValid) {
                coordinates = {
                  latitude: firstValid.latitude,
                  longitude: firstValid.longitude,
                };
              } else {
                setDistanceError("Nao foi possivel geocodificar o endereco da loja.");
              }
            } catch (error) {
              console.error("StoreProfile: erro ao geocodificar endereco da loja:", error);
              setDistanceError("Nao foi possivel geocodificar o endereco da loja.");
            }
          } else {
            setDistanceError("Endereco da loja incompleto.");
          }
        }

        if (coordinates && userLocation) {
          const distanceValue = calculateDistanceKm(userLocation, coordinates);
          setDistanceError(null);
          setDistanceKm(distanceValue);
        } else if (!userLocation) {
          setDistanceKm(null);
        } else {
          setDistanceKm(null);
          setDistanceError((prev) => prev ?? "Nao foi possivel calcular a distancia da loja.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("StoreProfile: erro inesperado ao calcular distancia da loja:", error);
          setDistanceError("Nao foi possivel calcular a distancia da loja.");
          setDistanceKm(null);
          setStoreAddressText(fallbackAddressFromStore());
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDistance(false);
        }
      }
    };

    fetchAddressAndDistance();

    return () => {
      cancelled = true;
    };
  }, [getAddressesStore, storeId, userLocation, store]);

  const handleToggleFavorite = () => setIsFavorite((current) => !current);

  const ratingValue = averageRating ?? store?.rating ?? 0;
  const ratingLabel = isLoadingRating ? "..." : ratingValue.toFixed(2);
  const distanceLabel = (() => {
    if (isLoadingDistance || isRequestingLocation) {
      return "Calculando...";
    }
    if (typeof distanceKm === "number" && Number.isFinite(distanceKm)) {
      return `${distanceKm.toFixed(2)} km`;
    }
    if (distanceError) {
      return distanceError;
    }
    return store?.distance || "Distancia indisponivel";
  })();

  const handleScrollPromotions = (direction: "left" | "right") => {
    const node = promoScrollRef.current;
    if (!node) return;

    const current = promoOffsetRef.current;
    const next =
      direction === "left"
        ? Math.max(0, current - SCROLL_STEP)
        : current + SCROLL_STEP;

    promoOffsetRef.current = next;

    node.scrollTo({
      x: next,
      animated: true,
    });
  };

  if (isLoadingStore) {
    return (
      <ScreenContainer>
        <HeaderScreen title="Loja" showButtonBack />
        <View style={styles.notFoundContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={[styles.notFoundText, { marginTop: theme.spacing.md }]}>
            Carregando informacoes da loja...
          </Text>
        </View>
      </ScreenContainer>
    );
  }


  if (!store) {
    return (
      <ScreenContainer>
        <HeaderScreen title="Loja nao encontrada" showButtonBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            {storeLoadError ?? "Nao encontramos informacoes para esta loja."}
          </Text>
          <TouchableOpacity
            style={styles.notFoundButton}
            activeOpacity={0.7}
            onPress={() =>
              router.replace({
                pathname: "/(auth)/store",
                params: {
                  state: DEFAULT_FILTERS.state,
                  city: DEFAULT_FILTERS.city,
                },
              })
            }
          >
            <Text style={styles.notFoundButtonText}>Voltar para lojas</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }


  return (
    <ScreenContainer safeAreaEdges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          <ImageBackground
            source={{ uri: store.bannerImage }}
            style={styles.bannerImage}
          >
            <View style={styles.bannerOverlay} />
          </ImageBackground>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.7}
          >
            <Icon
              type="feather"
              name="chevron-left"
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.logoWrapper}>
            <Image source={{ uri: store.logo }} style={styles.logo} />
          </View>

          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Adicionar aos favoritos"
            activeOpacity={0.7}
          >
            <Icon
              type="MaterialCommunityIcons"
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? theme.colors.onPrimary : theme.colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.storeName}>{store.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="star"
                size={16}
                color={theme.colors.star}
              />
              <Text style={styles.metaText}>{ratingLabel}</Text>
            </View>
            <View style={styles.metaSeparator} />
            <Text style={styles.metaText}>{store.category}</Text>
            <View style={styles.metaSeparator} />
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="map-marker"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.metaText}>{distanceLabel}</Text>
            </View>
          </View>

          {store.promotion ? (
            <View style={styles.summaryPromo}>
              <Icon
                type="MaterialCommunityIcons"
                name="tag-heart"
                size={16}
                color={theme.colors.success}
              />
              <Text style={styles.summaryPromoText}>{store.promotion}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.sectionText}>{store.about}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacoes</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              {storeAddressText ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Endereco:</Text>
                  <Text style={styles.infoValue}>{storeAddressText}</Text>
                </View>
              ) : null}
              {store.info.map((item) => (
                <View style={styles.infoItem} key={item.label}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoColumn}>
              {workingHoursToDisplay.length ? (
                <Text style={styles.infoScheduleHeading}>Horario de Atendimento:</Text>
              ) : null}
              {workingHoursToDisplay.map((item) => (
                <View style={styles.infoItem} key={item.label}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos em Promocao</Text>
            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.7}
              style={styles.sectionLinkWrapper}
            >
              <Text style={styles.sectionLink}>Ver Tudo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promoCarousel}>
            <TouchableOpacity
              onPress={() => handleScrollPromotions("left")}
              style={styles.carouselArrow}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name="chevron-left"
                size={26}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <ScrollView
              horizontal
              ref={promoScrollRef}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoList}
              onScroll={(event) => {
                promoOffsetRef.current = event.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
            >
              {store.promotions.map((promo) => (
                <View style={styles.promoCard} key={promo.id}>
                  <Image source={{ uri: promo.image }} style={styles.promoImage} />
                  <Text style={styles.promoName} numberOfLines={2}>
                    {promo.name}
                  </Text>
                  {promo.originalPrice ? (
                    <Text style={styles.promoOriginal}>
                      De {promo.originalPrice}
                    </Text>
                  ) : null}
                  <Text style={styles.promoPrice}>
                    Por {promo.price} <Text style={styles.promoUnit}>{promo.unit}</Text>
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => handleScrollPromotions("right")}
              style={styles.carouselArrow}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name="chevron-right"
                size={26}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {}}
          activeOpacity={0.7}
          style={styles.footerLinkWrapper}
        >
          <Text style={styles.footerLink}>
            Ver todos produtos de {store.name}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
