import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { geocodeAsync, getCurrentPositionAsync, LocationAccuracy, requestForegroundPermissionsAsync } from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEFAULT_FILTERS, Store, StorePromotion } from "../mockStores";
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

type PromotionResponse = Record<string, unknown> & { id?: string };

const parseCurrencyValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return null;
    }
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const pickFirstValue = (source: PromotionResponse, keys: string[]): unknown => {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PRODUCT_IMAGE_URL_KEYS = [
  "image_url",
  "imageUrl",
  "url",
  "path",
  "public_url",
  "publicUrl",
  "download_url",
  "downloadUrl",
] as const;

const extractFirstImageUrl = (images: unknown): string | null => {
  if (!Array.isArray(images)) {
    return null;
  }

  for (const entry of images) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    for (const key of PRODUCT_IMAGE_URL_KEYS) {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }

  return null;
};

const mapPromotionResponse = (raw: PromotionResponse): StorePromotion | null => {
  const identifier = raw.id ?? pickFirstValue(raw, ["uuid", "product_id"]);
  if (!identifier) {
    return null;
  }

  const nameRaw = pickFirstValue(raw, ["name", "title", "product_name"]);
  const priceRaw = pickFirstValue(raw, [
    "sale_price",
    "promotional_price",
    "promo_price",
    "current_price",
    "price",
  ]);
  const originalPriceRaw = pickFirstValue(raw, [
    "regular_price",
    "original_price",
    "list_price",
    "price_from",
    "price_before",
  ]);
  const unitRaw = pickFirstValue(raw, ["unit", "unit_label", "measure_unit"]);
  const imageRaw = pickFirstValue(raw, ["image_url", "image", "main_image_url", "thumbnail"]);

  const priceValue = parseCurrencyValue(priceRaw ?? originalPriceRaw);
  const originalPriceValue = parseCurrencyValue(originalPriceRaw);

  const formattedPrice =
    priceValue !== null ? currencyFormatter.format(priceValue) : "Sob consulta";
  const formattedOriginal =
    originalPriceValue !== null ? currencyFormatter.format(originalPriceValue) : undefined;

  const resolvedUnit =
    typeof unitRaw === "string" && unitRaw.trim().length ? unitRaw : "Un";

  const discountValue =
    originalPriceValue !== null && priceValue !== null
      ? Math.max(originalPriceValue - priceValue, 0)
      : null;

  return {
    id: String(identifier),
    name:
      typeof nameRaw === "string" && nameRaw.trim().length ? nameRaw : "Produto em promoção",
    price: formattedPrice,
    originalPrice: formattedOriginal,
    unit: resolvedUnit,
    image: typeof imageRaw === "string" ? imageRaw : "",
    priceValue,
    originalPriceValue,
    discountValue,
  };
};

const ensurePromotionMeta = (promo: StorePromotion): StorePromotion => {
  const priceValue = promo.priceValue ?? parseCurrencyValue(promo.price);
  const originalPriceValue =
    promo.originalPriceValue ?? parseCurrencyValue(promo.originalPrice ?? null);
  const discountValue =
    promo.discountValue ??
    (originalPriceValue !== null && priceValue !== null
      ? Math.max(originalPriceValue - priceValue, 0)
      : null);

  return {
    ...promo,
    priceValue,
    originalPriceValue,
    discountValue,
  };
};

const sortPromotionsByDiscount = (promos: StorePromotion[]): StorePromotion[] => {
  return promos
    .map((promo) => ensurePromotionMeta(promo))
    .sort((a, b) => {
      const discountA = a.discountValue ?? 0;
      const discountB = b.discountValue ?? 0;
      if (discountA === discountB) {
        const priceA = a.priceValue ?? 0;
        const priceB = b.priceValue ?? 0;
        return priceA - priceB;
      }
      return discountB - discountA;
    });
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
    data.about ?? (data as any).long_description ?? data.description ?? "Informações não disponíveis.";

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

  const {
    getStoreById,
    getStoreRatingsAverage,
    getAddressesStore,
    getStoreSchedule,
    getImageProduct,
    getItemPromotionByStore,
  } = useSession();
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
  const [promotions, setPromotions] = useState<StorePromotion[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const workingHoursToDisplay = storeWorkingHours.length
    ? storeWorkingHours
    : store?.workingHours ?? [];
  const promotionsToDisplay = useMemo(() => {
    const source: StorePromotion[] = promotions.length
      ? promotions
      : Array.isArray(store?.promotions)
      ? (store?.promotions as StorePromotion[])
      : [];

    if (!source.length) {
      return [];
    }

    return sortPromotionsByDiscount(source).slice(0, 5);
  }, [promotions, store]);
  const hasPromotions = promotionsToDisplay.length > 0;

  const fetchPromotions = useCallback(
    async (isCancelled?: () => boolean) => {
      if (!storeId) {
        if (!isCancelled?.()) {
          setPromotions([]);
          setPromotionsError(null);
        }
        return;
      }

      if (!isCancelled?.()) {
        setIsLoadingPromotions(true);
        setPromotionsError(null);
      }

      try {
        const { data, error } = await getItemPromotionByStore(storeId);
        if (isCancelled?.()) {
          return;
        }

        if (error) {
          console.error("StoreProfile: erro ao buscar promocoes da loja:", error);
          if (!isCancelled?.()) {
            setPromotionsError("Nao foi possivel carregar as promocoes da loja.");
            setPromotions([]);
          }
          return;
        }

        const mappedPromotions = Array.isArray(data)
          ? data
              .map((item) => mapPromotionResponse((item ?? {}) as PromotionResponse))
              .filter((item): item is StorePromotion => item !== null)
          : [];

        const promotionsWithImages = await Promise.all(
          mappedPromotions.map(async (promo) => {
            try {
              const { data: images, error: imageError } = await getImageProduct(promo.id);
              if (imageError) {
                console.error("StoreProfile: erro ao buscar imagem da promoção:", imageError);
                return promo;
              }

              const imageUrl = extractFirstImageUrl(images);
              if (imageUrl) {
                return { ...promo, image: imageUrl };
              }

              return promo;
            } catch (imageFetchError) {
              console.error(
                "StoreProfile: erro inesperado ao buscar imagem da promoção:",
                imageFetchError
              );
              return promo;
            }
          })
        );

        if (!isCancelled?.()) {
          const sortedLimited = sortPromotionsByDiscount(promotionsWithImages).slice(0, 5);
          setPromotions(sortedLimited);
        }
      } catch (error) {
        if (!isCancelled?.()) {
          console.error("StoreProfile: erro inesperado ao buscar promocoes da loja:", error);
          setPromotionsError("Nao foi possivel carregar as promocoes da loja.");
          setPromotions([]);
        }
      } finally {
        if (!isCancelled?.()) {
          setIsLoadingPromotions(false);
        }
      }
    },
    [getImageProduct, getItemPromotionByStore, storeId]
  );
  useEffect(() => {
    let cancelled = false;

    fetchPromotions(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [fetchPromotions]);

  const handleReloadPromotions = useCallback(() => {
    fetchPromotions();
  }, [fetchPromotions]);
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
          setStoreLoadError("Nao foi possivel carregar as informações da loja.");
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
          setStoreLoadError("Nao foi possivel carregar as informações da loja.");
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
    if (!hasPromotions) {
      return;
    }

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
            Carregando informações da loja...
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
            {storeLoadError ?? "Nao encontramos informações para esta loja."}
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
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              {storeAddressText ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Endereço:</Text>
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
                <Text style={styles.infoScheduleHeading}>Horário de Atendimento:</Text>
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
            <Text style={styles.sectionTitle}>Produtos em Promoção</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/store/products_store",
                  params: {
                    storeId: store.id,
                    storeName: store.name,
                    onlyPromotion: "true",
                  },
                })
              }
              activeOpacity={0.7}
              style={styles.sectionLinkWrapper}
            >
              <Text style={styles.sectionLink}>Ver Tudo</Text>
            </TouchableOpacity>
          </View>

          {isLoadingPromotions && !hasPromotions ? (
            <View style={styles.promoFeedbackContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}

          {promotionsError && !isLoadingPromotions && !hasPromotions ? (
            <View style={styles.promoFeedbackContainer}>
              <Text style={styles.promoFeedbackText}>{promotionsError}</Text>
              <TouchableOpacity
                onPress={handleReloadPromotions}
                activeOpacity={0.7}
                style={styles.promoRetryButton}
              >
                <Text style={styles.promoRetryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {hasPromotions ? (
            <View style={styles.promoCarousel}>
              <TouchableOpacity
                onPress={() => handleScrollPromotions("left")}
                style={[
                  styles.carouselArrow,
                  !hasPromotions && styles.carouselArrowDisabled,
                ]}
                activeOpacity={0.7}
                disabled={!hasPromotions}
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
                {promotionsToDisplay.map((promo) => {
                  const handleNavigateToProduct = () =>
                    router.push({
                      pathname: "/(auth)/store/products_store/[id_product]",
                      params: { id_product: promo.id },
                    });

                  return (
                    <TouchableOpacity
                      key={promo.id}
                      style={styles.promoCard}
                      activeOpacity={0.75}
                      onPress={handleNavigateToProduct}
                    >
                      {promo.image ? (
                        <Image source={{ uri: promo.image }} style={styles.promoImage} />
                      ) : (
                        <View style={styles.promoFallbackImage}>
                          <Icon
                            type="MaterialCommunityIcons"
                            name="package-variant-closed"
                            size={30}
                            color={theme.colors.disabled}
                          />
                        </View>
                      )}
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
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => handleScrollPromotions("right")}
                style={[
                  styles.carouselArrow,
                  !hasPromotions && styles.carouselArrowDisabled,
                ]}
                activeOpacity={0.7}
                disabled={!hasPromotions}
              >
                <Icon
                  type="MaterialCommunityIcons"
                  name="chevron-right"
                  size={26}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {!isLoadingPromotions && !promotionsError && !hasPromotions ? (
            <View style={styles.promoFeedbackContainer}>
              <Text style={styles.promoFeedbackText}>
                Esta loja ainda nao possui itens em promoção.
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(auth)/store/products_store",
              params: { storeId: store.id, storeName: store.name },
            })
          }
          activeOpacity={0.7}
          style={styles.footerLinkWrapper}
        >
          <Text style={styles.footerLink}>
            Ver catálogo de produtos de {store.name}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
