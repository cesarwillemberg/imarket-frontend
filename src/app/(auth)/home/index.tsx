import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchInputBar from "@/src/components/common/SearchBar";
import { useSession } from "@/src/providers/SessionContext/Index";
import productService from "@/src/services/products-service";
import storeService from "@/src/services/store-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import createStyles from "./styled";

type GenericRecord = Record<string, unknown>;
type RawProduct = GenericRecord & { id?: string | number };
type RawProductImage = GenericRecord & { id?: string | number };
type RawStore = GenericRecord & { id?: string | number };
type Coordinates = { latitude: number; longitude: number };

type ProductCardItem = {
  id: string;
  name: string;
  storeId: string | null;
  storeName: string | null;
  unit: string | null;
  code: string | null;
  price: number | null;
  originalPrice: number | null;
  inPromotion: boolean;
  imageUrl: string | null;
};

type StoreCardItem = {
  id: string;
  name: string;
  category: string | null;
  rating: number | null;
  distanceLabel: string | null;
  distanceKm: number | null;
  badge: string | null;
  logoUrl: string | null;
  city: string | null;
};

type SearchResultItem = {
  id: string;
  type: "product" | "store";
  title: string;
  subtitle: string | null;
  extra: string | null;
  imageUrl: string | null;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PROMOTION_FLAG_KEYS = [
  "in_promotion",
  "inPromotion",
  "has_promotion",
  "hasPromotion",
  "is_promotion",
  "isPromotion",
] as const;

const PRODUCT_IMAGE_URL_KEYS = [
  "image_url",
  "imageUrl",
  "image",
  "thumbnail",
  "main_image_url",
  "public_url",
  "publicUrl",
  "url",
  "path",
  "download_url",
  "downloadUrl",
  "uri",
] as const;

const STORE_LOGO_KEYS = [
  "logo_url",
  "logoUrl",
  "logo",
  "image_url",
  "imageUrl",
  "avatar",
  "profile_picture_url",
  "profilePictureUrl",
  "profile_picture",
  "profilePicture",
  "store_picture",
  "storePicture",
  "picture_url",
  "pictureUrl",
  "picture",
  "photo_url",
  "photoUrl",
  "photo",
] as const;

const STORE_BADGE_KEYS = [
  "highlight_message",
  "highlightMessage",
  "badge",
  "badge_text",
  "badgeText",
  "delivery_message",
  "shipping_message",
] as const;

const STORE_DISTANCE_KEYS = [
  "distance",
  "distance_km",
  "distanceKm",
  "km",
] as const;

const SEARCH_RESULTS_MAX_HEIGHT = Math.round(Dimensions.get("window").height * 0.45);

const STORE_CATEGORY_KEYS = [
  "category",
  "category_name",
  "segment",
  "type",
  "business_type",
] as const;

const STORE_RATING_KEYS = [
  "rating",
  "rating_average",
  "average_rating",
  "avg_rating",
  "stars",
] as const;

const STORE_CITY_KEYS = ["city", "cidade", "municipio"] as const;

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

const parseCoordinateValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDistanceLabel = (value: number) => `${value.toFixed(2)} Km`;

const buildAddressString = (address: GenericRecord | null | undefined): string | null => {
  if (!address) {
    return null;
  }

  const normalize = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    return null;
  };

  const streetName = normalize(address["street"]);
  const streetNumber = normalize(address["street_number"] ?? address["number"]);

  const parts: string[] = [];
  const streetLabel = [streetName, streetNumber].filter(Boolean).join(", ").trim();
  if (streetLabel.length) {
    parts.push(streetLabel);
  }

  const maybeAdd = (value: unknown) => {
    const normalized = normalize(value);
    if (normalized) {
      parts.push(normalized);
    }
  };

  maybeAdd(address["neighborhood"] ?? address["district"]);
  maybeAdd(address["city"]);
  maybeAdd(address["state_acronym"] ?? address["state"] ?? address["region"]);

  const country = normalize(address["country"]) ?? "Brasil";
  if (country) {
    parts.push(country);
  }

  return parts.length ? parts.join(", ") : null;
};

const pickFirstValue = (source: GenericRecord, keys: readonly string[]) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
};

const parseCurrencyValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const sanitized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!sanitized || sanitized === "-" || sanitized === "." || sanitized === "-.") {
      return null;
    }
    const parsed = Number(sanitized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parseBooleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "nao", "não"].includes(normalized)) {
      return false;
    }
  }
  return false;
};

const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const coerceString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const normalizeText = (value: string | null | undefined) =>
  value
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";

const isNotNull = <T,>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const resolveImageUrlFromRows = (rows: RawProductImage[]): string | null => {
  for (const row of rows) {
    const resolved = coerceString(pickFirstValue(row, PRODUCT_IMAGE_URL_KEYS));
    if (resolved) {
      return resolved;
    }

    const nestedImage = row["image"];
    if (typeof nestedImage === "string") {
      const trimmed = nestedImage.trim();
      if (trimmed.length) {
        return trimmed;
      }
    }
  }
  return null;
};

const resolveStoreLogoFromRecord = (record: GenericRecord | null | undefined): string | null => {
  if (!record) {
    return null;
  }
  return coerceString(pickFirstValue(record, STORE_LOGO_KEYS));
};

// Normaliza os dados do produto para evitar crashes com colunas diferentes no Supabase
const mapProductFromApi = (raw: RawProduct): ProductCardItem | null => {
  const identifier =
    raw.id ?? pickFirstValue(raw, ["product_id", "uuid", "id_product"]);

  if (!identifier) {
    return null;
  }

  const nameRaw = pickFirstValue(raw, ["name", "title", "product_name"]);
  const storeNameRaw = pickFirstValue(raw, [
    "store_name",
    "storeName",
    "market_name",
    "marketName",
  ]);
  const storeReferenceRaw = pickFirstValue(raw, [
    "store",
    "market",
    "store_id",
    "storeId",
    "id_store",
    "idStore",
    "market_id",
    "marketId",
  ]);
  const unitRaw = pickFirstValue(raw, ["unit", "unit_label", "measure_unit"]);
  const codeRaw = pickFirstValue(raw, ["code", "sku", "ean", "barcode"]);
  const basePriceRaw = pickFirstValue(raw, [
    "price",
    "current_price",
    "unit_price",
    "regular_price",
  ]);
  const promotionalPriceRaw = pickFirstValue(raw, [
    "promotional_price",
    "promo_price",
    "sale_price",
    "discount_price",
  ]);
  const originalPriceRaw = pickFirstValue(raw, [
    "original_price",
    "price_from",
    "list_price",
    "regular_price",
  ]);
  const imageRaw = pickFirstValue(raw, PRODUCT_IMAGE_URL_KEYS);

  let storeName = coerceString(storeNameRaw);
  let storeId: string | null = null;

  const assignStoreId = (value: unknown) => {
    const normalized = coerceString(value);
    if (normalized) {
      storeId = normalized;
    }
  };

  if (storeReferenceRaw && typeof storeReferenceRaw === "object") {
    const nested = storeReferenceRaw as RawProduct;
    const nestedId = pickFirstValue(nested, ["id", "store_id", "storeId", "uuid"]);
    assignStoreId(nestedId);

    if (!storeName) {
      storeName = coerceString(
        pickFirstValue(nested, ["name", "store_name", "storeName", "title", "fantasy_name"])
      );
    }
  } else {
    assignStoreId(storeReferenceRaw);
  }

  const basePrice = parseCurrencyValue(basePriceRaw);
  const promotionalPrice = parseCurrencyValue(promotionalPriceRaw);
  const originalPriceCandidate = parseCurrencyValue(originalPriceRaw);
  const explicitPromotionFlag = parseBooleanValue(
    pickFirstValue(raw, PROMOTION_FLAG_KEYS) ?? false
  );

  let price: number | null = null;
  let originalPrice: number | null = null;
  let inPromotion = false;

  const promoIsValid =
    promotionalPrice !== null &&
    promotionalPrice > 0 &&
    (explicitPromotionFlag ||
      (typeof basePrice === "number" && promotionalPrice < basePrice) ||
      (typeof originalPriceCandidate === "number" && promotionalPrice < originalPriceCandidate));

  if (promoIsValid) {
    const referencePrice = originalPriceCandidate ?? basePrice ?? promotionalPrice;
    price = promotionalPrice;
    originalPrice = referencePrice !== promotionalPrice ? referencePrice : null;
    inPromotion = true;
  } else if (explicitPromotionFlag && originalPriceCandidate !== null && basePrice !== null) {
    price = basePrice;
    originalPrice = originalPriceCandidate > basePrice ? originalPriceCandidate : null;
    inPromotion = originalPrice !== null;
  } else {
    const base = typeof basePrice === "number" && basePrice > 0 ? basePrice : null;
    const orig =
      typeof originalPriceCandidate === "number" && originalPriceCandidate > 0
        ? originalPriceCandidate
        : null;
    price = base ?? orig ?? null;
    originalPrice = null;
    inPromotion = false;
  }

  return {
    id: String(identifier),
    name: coerceString(nameRaw) ?? "Produto",
    storeId,
    storeName,
    unit: coerceString(unitRaw),
    code: coerceString(codeRaw),
    price,
    originalPrice,
    inPromotion,
    imageUrl: coerceString(imageRaw),
  };
};

const mapStoreFromApi = (raw: RawStore): StoreCardItem | null => {
  const identifier = raw.id ?? pickFirstValue(raw, ["store_id", "id_store", "uuid"]);
  if (!identifier) {
    return null;
  }

  const category = coerceString(pickFirstValue(raw, STORE_CATEGORY_KEYS));
  const distanceRaw = pickFirstValue(raw, STORE_DISTANCE_KEYS);
  const ratingRaw = pickFirstValue(raw, STORE_RATING_KEYS);

  const distanceNumber = parseNumberValue(distanceRaw);
  const distanceLabel =
    distanceNumber !== null
      ? `${distanceNumber.toFixed(2)} Km`
      : coerceString(distanceRaw) ?? null;

  return {
    id: String(identifier),
    name: coerceString(
      pickFirstValue(raw, ["name", "store_name", "title", "fantasy_name", "social_name"])
    ) ?? "Mercado",
    category: category ?? "Mercado",
    rating: parseNumberValue(ratingRaw),
    distanceLabel,
    distanceKm: distanceNumber,
    badge: coerceString(pickFirstValue(raw, STORE_BADGE_KEYS)),
    logoUrl: resolveStoreLogoFromRecord(raw),
    city: coerceString(pickFirstValue(raw, STORE_CITY_KEYS)),
  };
};

const formatPrice = (value: number | null) =>
  value !== null ? currencyFormatter.format(value) : null;

export default function Home() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);
  const router = useRouter();
  const {
    session,
    getImageProduct,
    getStoreById,
    getStoreRatingsAverage,
    getAddressesStore,
    getFavoriteStoresByUser,
    getFavoriteProductsByUser,
    addStoreToFavorites,
    removeStoreFromFavorites,
    addProductToFavorites,
    removeProductFromFavorites,
  } = useSession();
  const userId = session?.user?.id ?? null;

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [stores, setStores] = useState<StoreCardItem[]>([]);
  const [searchBarLayout, setSearchBarLayout] = useState<{ y: number; height: number } | null>(null);
  const [favoriteStores, setFavoriteStores] = useState<Set<string>>(() => new Set());
  const [favoritePromotionProducts, setFavoritePromotionProducts] = useState<Set<string>>(
    () => new Set()
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [storeDistanceOverrides, setStoreDistanceOverrides] = useState<
    Record<string, { label: string; value: number }>
  >({});
  const [isComputingStoreDistances, setIsComputingStoreDistances] = useState(false);
  const notificationCount = 0;
  const animationLoading = useRef<LottieView>(null);
  const storeCoordinatesCache = useRef<Record<string, Coordinates | null>>({});

  useEffect(() => {
    if (!session) {
      router.replace("/signin");
    }
  }, [session, router]);

  useEffect(() => {
    let cancelled = false;

    const setLocationFromCoords = (coords: { latitude: number; longitude: number }) => {
      if (!cancelled) {
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }
    };

    const tryNavigatorLocation = () => {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationFromCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Home: localização não obtida via browser", error);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
        return true;
      }
      return false;
    };

    const expoLocationAvailable =
      typeof requestForegroundPermissionsAsync === "function" &&
      typeof getCurrentPositionAsync === "function";

    if (!expoLocationAvailable) {
      tryNavigatorLocation();
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const { status } = await requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }

        const position = await getCurrentPositionAsync({
          accuracy: LocationAccuracy.Balanced,
        });

        setLocationFromCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error) {
        console.warn("Home: localização não obtida", error);
        tryNavigatorLocation();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadHomeData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [storesResponse, productsResponse, storeFavoritesResponse, productFavoritesResponse] =
          await Promise.all([
            storeService.getStores(),
            productService.getProducts(),
            userId ? getFavoriteStoresByUser(userId) : Promise.resolve({ data: null, error: null }),
            userId
              ? getFavoriteProductsByUser(userId)
              : Promise.resolve({ data: null, error: null }),
          ]);

        if (storesResponse.error) {
          throw storesResponse.error;
        }

        if (productsResponse.error) {
          throw productsResponse.error;
        }

        const mappedStores = Array.isArray(storesResponse.data)
          ? storesResponse.data.map(mapStoreFromApi).filter(isNotNull)
          : [];
        const storesWithLogos = await Promise.all(
          mappedStores.map(async (store) => {
            if (!store.id || store.logoUrl) {
              return store;
            }

            try {
              const { data, error: storeError } = await getStoreById(store.id);
              if (storeError) {
                console.warn("Home: falha ao carregar logo da loja", store.id, storeError);
                return store;
              }

              const resolvedLogo = resolveStoreLogoFromRecord(
                (data as GenericRecord | null | undefined) ?? undefined
              );
              if (resolvedLogo) {
                return { ...store, logoUrl: resolvedLogo };
              }
              return store;
            } catch (storeLogoException) {
              console.warn(
                "Home: erro inesperado ao buscar logo da loja",
                store.id,
                storeLogoException
              );
              return store;
            }
          })
        );
        const storesWithRatings = await Promise.all(
          storesWithLogos.map(async (store) => {
            if (!store.id) {
              return store;
            }
            const hasValidRating =
              typeof store.rating === "number" && Number.isFinite(store.rating) && store.rating >= 0;
            if (hasValidRating) {
              return store;
            }
            try {
              const { data, error: ratingError } = await getStoreRatingsAverage(store.id);
              if (ratingError) {
                console.warn("Home: falha ao carregar nota da loja", store.id, ratingError);
                return store;
              }
              const averageRaw = (data as GenericRecord | null | undefined)?.average;
              const resolvedAverage =
                typeof averageRaw === "number" && Number.isFinite(averageRaw)
                  ? averageRaw
                  : parseNumberValue(averageRaw);
              if (typeof resolvedAverage === "number" && Number.isFinite(resolvedAverage)) {
                return { ...store, rating: resolvedAverage };
              }
              return store;
            } catch (ratingException) {
              console.warn(
                "Home: erro inesperado ao buscar nota da loja",
                store.id,
                ratingException
              );
              return store;
            }
          })
        );
        const mappedProducts = Array.isArray(productsResponse.data)
          ? productsResponse.data.map(mapProductFromApi).filter(isNotNull)
          : [];
        const productsWithImages = await Promise.all(
          mappedProducts.map(async (product) => {
            if (!product.id) {
              return product;
            }

            if (product.imageUrl) {
              return product;
            }

            try {
              const { data, error: imageError } = await getImageProduct(product.id);
              if (imageError) {
                console.warn("Home: falha ao carregar imagem do produto", product.id, imageError);
                return product;
              }

              const rows = Array.isArray(data) ? (data as RawProductImage[]) : [];
              const resolvedImage = resolveImageUrlFromRows(rows);

              if (resolvedImage && resolvedImage !== product.imageUrl) {
                return { ...product, imageUrl: resolvedImage };
              }
              return product;
            } catch (imageException) {
              console.warn(
                "Home: erro inesperado ao buscar imagem do produto",
                product.id,
                imageException
              );
              return product;
            }
          })
        );

        const storeNameById = new Map<string, string>();
        storesWithRatings.forEach((store) => {
          if (store.id && store.name) {
            storeNameById.set(store.id, store.name);
          }
        });

        const productsWithSeller = productsWithImages.map((product) => {
          const hasSellerName = typeof product.storeName === "string" && product.storeName.trim().length;
          if (hasSellerName || !product.storeId) {
            return product;
          }

          const fallbackName = storeNameById.get(product.storeId);
          if (!fallbackName) {
            return product;
          }

          return { ...product, storeName: fallbackName };
        });

        setStores(storesWithRatings);
        setProducts(productsWithSeller);

        if (userId) {
          if (storeFavoritesResponse?.error) {
            console.warn("Home: falha ao carregar lojas favoritas:", storeFavoritesResponse.error);
          } else if (Array.isArray(storeFavoritesResponse?.data)) {
            const favoriteStoreIds = storeFavoritesResponse.data
              .map((row) =>
                coerceString(
                  pickFirstValue(row as GenericRecord, [
                    "store_id",
                    "id_store",
                    "storeId",
                    "idStore",
                    "store",
                  ])
                )
              )
              .filter((value): value is string => Boolean(value));
            setFavoriteStores(new Set(favoriteStoreIds));
          }

          if (productFavoritesResponse?.error) {
            console.warn("Home: falha ao carregar produtos favoritos:", productFavoritesResponse.error);
          } else if (Array.isArray(productFavoritesResponse?.data)) {
            const favoriteProductIds = productFavoritesResponse.data
              .map((row) =>
                coerceString(
                  pickFirstValue(row as GenericRecord, [
                    "produto_id",
                    "product_id",
                    "produtoId",
                    "productId",
                    "produto",
                  ])
                )
              )
              .filter((value): value is string => Boolean(value));
            setFavoritePromotionProducts(new Set(favoriteProductIds));
          }
        } else {
          setFavoriteStores(new Set());
          setFavoritePromotionProducts(new Set());
        }
      } catch (fetchError) {
        console.error("Home: failed to load highlights", fetchError);
        setError("Não foi possível carregar os destaques. Deslize para atualizar.");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [getImageProduct, getStoreById, getStoreRatingsAverage, getFavoriteStoresByUser, getFavoriteProductsByUser, userId]
  );

  useEffect(() => {
    if (!session) return;
    loadHomeData();
  }, [loadHomeData, session]);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    loadHomeData(true);
  }, [isRefreshing, loadHomeData]);

  const handleNotificationPress = useCallback(() => {
    router.push("/(auth)/profile/notifications");
  }, [router]);

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({
        pathname: "/(auth)/products/[id_produto]",
        params: { id_produto: productId, origin: "home" },
      });
    },
    [router]
  );

  const handleStorePress = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/(auth)/store/[id_store]", params: { id_store: storeId, origin: "home" } });
    },
    [router]
  );

  const handleToggleStoreFavorite = useCallback(
    async (storeId: string) => {
      if (!userId) {
        console.warn("Home: usuario nao autenticado ao modificar favorito de loja.");
        return;
      }

      let shouldFavorite = false;
      setFavoriteStores((current) => {
        const next = new Set(current);
        const alreadyFavorite = next.has(storeId);
        shouldFavorite = !alreadyFavorite;

        if (alreadyFavorite) {
          next.delete(storeId);
        } else {
          next.add(storeId);
        }
        return next;
      });

      try {
        if (shouldFavorite) {
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
      } catch (toggleError) {
        console.error("Home: erro ao atualizar favorito de loja:", toggleError);
        // Reverte o estado local se o backend falhar.
        setFavoriteStores((current) => {
          const next = new Set(current);
          if (shouldFavorite) {
            next.delete(storeId);
          } else {
            next.add(storeId);
          }
          return next;
        });
      }
    },
    [userId, addStoreToFavorites, removeStoreFromFavorites]
  );

  const handleTogglePromotionFavorite = useCallback(
    async (productId: string) => {
      if (!userId) {
        console.warn("Home: usuario nao autenticado ao modificar favorito de produto.");
        return;
      }

      let shouldFavorite = false;
      setFavoritePromotionProducts((current) => {
        const next = new Set(current);
        const alreadyFavorite = next.has(productId);
        shouldFavorite = !alreadyFavorite;

        if (alreadyFavorite) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      try {
        if (shouldFavorite) {
          const { error } = await addProductToFavorites(userId, productId);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await removeProductFromFavorites(userId, productId);
          if (error) {
            throw error;
          }
        }
      } catch (toggleError) {
        console.error("Home: erro ao atualizar favorito de produto:", toggleError);
        setFavoritePromotionProducts((current) => {
          const next = new Set(current);
          if (shouldFavorite) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return next;
        });
      }
    },
    [userId, addProductToFavorites, removeProductFromFavorites]
  );

  const fetchStoreCoordinates = useCallback(
    async (storeId: string): Promise<Coordinates | null> => {
      if (!storeId) {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(storeCoordinatesCache.current, storeId)) {
        return storeCoordinatesCache.current[storeId];
      }

      try {
        const { data, error } = await getAddressesStore(storeId);
        if (error) {
          console.warn("Home: erro ao buscar endereços da loja", storeId, error);
          storeCoordinatesCache.current[storeId] = null;
          return null;
        }

        let rows: GenericRecord[] = [];

        if (Array.isArray(data)) {
          rows = data as GenericRecord[];
        } else if (data && Array.isArray((data as GenericRecord).logAddress)) {
          rows = ((data as GenericRecord).logAddress ?? []) as GenericRecord[];
        }

        for (const row of rows) {
          const latitude =
            parseCoordinateValue(
              row["latitude"] ??
                row["lat"] ??
                row["latitude_decimal"] ??
                row["latitudeDecimal"] ??
                row["lat_decimal"]
            ) ?? null;
          const longitude =
            parseCoordinateValue(
              row["longitude"] ??
                row["lng"] ??
                row["lon"] ??
                row["long"] ??
                row["longitude_decimal"] ??
                row["longitudeDecimal"]
            ) ?? null;

          if (latitude !== null && longitude !== null) {
            const coords: Coordinates = { latitude, longitude };
            storeCoordinatesCache.current[storeId] = coords;
            return coords;
          }
        }

        const firstAddress = rows[0] ?? null;
        if (firstAddress && typeof geocodeAsync === "function") {
          const formattedAddress = buildAddressString(firstAddress);
          if (formattedAddress) {
            try {
              const geocodedResults = await geocodeAsync(formattedAddress);
              const firstMatch = geocodedResults.find(
                (entry) =>
                  typeof entry?.latitude === "number" && typeof entry?.longitude === "number"
              );
              if (firstMatch) {
                const coords: Coordinates = {
                  latitude: firstMatch.latitude,
                  longitude: firstMatch.longitude,
                };
                storeCoordinatesCache.current[storeId] = coords;
                return coords;
              }
            } catch (geocodeError) {
              console.warn("Home: erro ao geocodificar endereço da loja", storeId, geocodeError);
            }
          }
        }

        storeCoordinatesCache.current[storeId] = null;
        return null;
      } catch (error) {
        console.warn("Home: erro inesperado ao buscar endereço da loja", storeId, error);
        storeCoordinatesCache.current[storeId] = null;
        return null;
      }
    },
    [getAddressesStore]
  );

  useEffect(() => {
    if (!stores.length || !userLocation) {
      setStoreDistanceOverrides({});
      setIsComputingStoreDistances(false);
      return;
    }

    let cancelled = false;
    setIsComputingStoreDistances(true);

    const computeDistances = async () => {
      const overrides: Record<string, { label: string; value: number }> = {};

      await Promise.all(
        stores.map(async (store) => {
          if (!store.id) {
            return;
          }
          try {
            const coords = await fetchStoreCoordinates(store.id);
            if (!coords) {
              return;
            }
            const distance = calculateDistanceKm(userLocation, coords);
            overrides[store.id] = { label: formatDistanceLabel(distance), value: distance };
          } catch (error) {
            console.warn("Home: erro ao calcular distância da loja", store.id, error);
          }
        })
      );

      if (!cancelled) {
        setStoreDistanceOverrides(overrides);
        setIsComputingStoreDistances(false);
      }
    };

    computeDistances().catch((error) => {
      console.warn("Home: falha geral ao calcular distâncias", error);
      if (!cancelled) {
        setIsComputingStoreDistances(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [stores, userLocation, fetchStoreCoordinates]);

  const promotions = useMemo(
    () => products.filter((product) => product.inPromotion),
    [products]
  );
  const otherSuggestions = useMemo(
    () => products.filter((product) => !product.inPromotion),
    [products]
  );

  const storesWithComputedDistance = useMemo(
    () =>
      stores.map((store) => {
        const override = storeDistanceOverrides[store.id];
        if (override) {
          return { ...store, distanceLabel: override.label, distanceKm: override.value };
        }
        return store;
      }),
    [stores, storeDistanceOverrides]
  );

  const promotionsToShow = promotions.slice(0, 3);
  const storesSortedByDistance = useMemo(() => {
    const annotated = storesWithComputedDistance.map((store, index) => ({
      store,
      index,
      distance:
        typeof store.distanceKm === "number" && Number.isFinite(store.distanceKm)
          ? store.distanceKm
          : Number.POSITIVE_INFINITY,
    }));

    annotated.sort((a, b) => {
      if (a.distance === b.distance) {
        return a.index - b.index;
      }
      return a.distance - b.distance;
    });

    return annotated.map((entry) => entry.store);
  }, [storesWithComputedDistance]);
  const storesToShow = storesSortedByDistance.slice(0, 3);
  const suggestionsToShow = otherSuggestions.slice(0, 12);

  const trimmedSearchTerm = searchTerm.trim();

  const normalizedQuery = useMemo(
    () => normalizeText(trimmedSearchTerm),
    [trimmedSearchTerm]
  );

  const searchResults = useMemo(() => {
    if (!normalizedQuery.length) {
      return [];
    }

    const matches = (text: string | null) => normalizeText(text).includes(normalizedQuery);

    const storeMatches: SearchResultItem[] = storesWithComputedDistance
      .filter(
        (item) =>
          matches(item.name) ||
          matches(item.category) ||
          matches(item.badge) ||
          matches(item.city)
      )
      .map((store) => ({
        id: store.id,
        type: "store" as const,
        title: store.name,
        subtitle: store.category ?? "Mercado",
        extra: store.distanceLabel ?? store.city,
        imageUrl: store.logoUrl,
      }));

    const productMatches: SearchResultItem[] = products
      .filter((item) => matches(item.name) || matches(item.storeName) || matches(item.code))
      .map((product) => ({
        id: product.id,
        type: "product" as const,
        title: product.name,
        subtitle: product.storeName ?? "Produto",
        extra: product.unit ?? product.code,
        imageUrl: product.imageUrl,
      }));

    return [...storeMatches, ...productMatches].slice(0, 8);
  }, [normalizedQuery, products, storesWithComputedDistance]);

  const handleSearchResultPress = useCallback(
    (item: SearchResultItem) => {
      if (item.type === "store") {
        handleStorePress(item.id);
      } else {
        handleProductPress(item.id);
      }
    },
    [handleProductPress, handleStorePress]
  );

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      setSearchBarLayout((prev) => {
        if (prev && prev.y === y && prev.height === height) {
          return prev;
        }
        return { y, height };
      });
    },
    []
  );

  const overlayTop = searchBarLayout
    ? searchBarLayout.y + searchBarLayout.height + theme.spacing.sm
    : null;

  if (isLoading) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={commonStyles.centeredContainer}>
          <LoadingIcon
            autoPlay
            loop
            // source={loadingCart}
            refAnimationLoading={animationLoading}
            style={{ width: 150, height: 150 }}
          />
          <Text style={styles.loadingText}>Preparando ofertas para você...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
        <View style={styles.headerRow} onLayout={handleHeaderLayout}>
          <SearchInputBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Pesquisar produtos ou mercados..."
            containerStyle={styles.searchBar}
          />
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
            onPress={handleNotificationPress}
          >
            <Icon type="MaterialCommunityIcons" name="bell-outline" size={22} color={theme.colors.primary} />
            {notificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{notificationCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {trimmedSearchTerm.length && overlayTop !== null ? (
          <View
            style={[
              styles.searchResultsWrapper,
              { top: overlayTop, maxHeight: SEARCH_RESULTS_MAX_HEIGHT },
            ]}
          >
            {searchResults.length ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentContainerStyle={styles.searchResultsListContent}
              >
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.type}-${item.id}`}
                    style={[
                      styles.searchResultCard,
                      index < searchResults.length - 1 ? styles.searchResultCardSpacing : null,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSearchResultPress(item)}
                  >
                    <View style={styles.searchResultImageWrapper}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.searchResultImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.searchResultFallback}>
                          <Icon
                            type="MaterialCommunityIcons"
                            name={item.type === "store" ? "storefront-outline" : "package-variant"}
                            size={24}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.searchResultInfo}>
                      <View style={styles.searchResultTitleRow}>
                        <Text style={styles.searchResultTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.searchResultTag}>
                          <Text style={styles.searchResultTagText}>
                            {item.type === "store" ? "Loja" : "Produto"}
                          </Text>
                        </View>
                      </View>
                      {item.subtitle ? (
                        <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {item.extra ? (
                        <Text style={styles.searchResultExtra} numberOfLines={1}>
                          {item.extra}
                        </Text>
                      ) : null}
                    </View>
                    <Icon type="MaterialIcons" name="chevron-right" size={20} color={theme.colors.disabled} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Nenhum resultado para {trimmedSearchTerm}.</Text>
            )}
          </View>
        ) : null}

        <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Icon
              type="MaterialCommunityIcons"
              name="alert-circle-outline"
              color={theme.colors.onPrimary}
              size={20}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promoções em destaque:</Text>
          {promotionsToShow.length ? (
            promotionsToShow.map((product) => {
              const formattedPrice = formatPrice(product.price);
              const formattedOriginalPrice = formatPrice(product.originalPrice);
              const isProductFavorite = favoritePromotionProducts.has(product.id);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.promotionCard}
                  activeOpacity={0.85}
                  onPress={() => handleProductPress(product.id)}
                >
                  <View style={styles.promotionImageWrapper}>
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.promotionImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.imageFallback}>
                        <Icon
                          type="MaterialCommunityIcons"
                          name="image-off"
                          size={28}
                          color={theme.colors.disabled}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.promotionInfo}>
                    <View style={styles.promotionHeader}>
                      <Text style={styles.promotionName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.promotionFavoriteButton,
                        ]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(event: GestureResponderEvent) => {
                          event.stopPropagation();
                          handleTogglePromotionFavorite(product.id);
                        }}
                      >
                        <Icon
                          type="MaterialCommunityIcons"
                          name={isProductFavorite ? "heart" : "heart-outline"}
                          size={18}
                          color={
                            theme.colors.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.productSeller}>
                      Vendido por:  <Text style={{fontWeight: "600"}}>{product.storeName ?? "não informado"}</Text>
                    </Text>
                    {formattedOriginalPrice ? (
                      <Text style={styles.originalPrice}>De {formattedOriginalPrice}</Text>
                    ) : null}
                    {formattedPrice ? (
                      <Text style={styles.currentPrice}>
                        Por {formattedPrice}
                        {product.unit ? <Text style={styles.unitLabel}> {product.unit}</Text> : null}
                      </Text>
                    ) : (
                      <Text style={styles.unavailablePrice}>Preço indisponível</Text>
                    )}
                    {product.code ? <Text style={styles.productCode}>Cód: {product.code}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhuma promoção ativa no momento.</Text>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mercados mais Próximos:</Text>
          {storesToShow.length ? (
            storesToShow.map((store) => {
              const isFavorite = favoriteStores.has(store.id);
              const override = storeDistanceOverrides[store.id];
              const distanceValue =
                typeof override?.value === "number" && Number.isFinite(override.value)
                  ? override.value
                  : null;
              const distanceLabel =
                distanceValue !== null
                  ? `${distanceValue.toFixed(2)} km`
                  : isComputingStoreDistances
                  ? "Calculando..."
                  : store.distanceLabel ?? "Distância indisponível";
              const ratingLabel =
                typeof store.rating === "number" && Number.isFinite(store.rating)
                  ? store.rating.toFixed(2).replace(".", ",")
                  : "--";
              const initials = store.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase();

              return (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => handleStorePress(store.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.storeAvatar}>
                    {store.logoUrl ? (
                      <Image source={{ uri: store.logoUrl }} style={styles.storeAvatarImage} />
                    ) : (
                      <Text style={styles.storeAvatarInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.storeDetails}>
                    <View style={styles.storeHeaderRow}>
                      <Text style={styles.storeName} numberOfLines={1}>
                        {store.name}
                      </Text>
                      <TouchableOpacity
                        style={styles.storeFavoriteButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(event: GestureResponderEvent) => {
                          event.stopPropagation();
                          handleToggleStoreFavorite(store.id);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Favoritar ${store.name}`}
                      >
                        <Icon
                          type="MaterialCommunityIcons"
                          name={isFavorite ? "heart" : "heart-outline"}
                          size={20}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.storeMetaRow}>
                      <View style={styles.storeMetaItem}>
                        <Icon
                          type="MaterialCommunityIcons"
                          name="star"
                          size={16}
                          color={theme.colors.star}
                        />
                        <Text style={[styles.storeMetaText, styles.storeMetaTextWithIcon]}>
                          {ratingLabel}
                        </Text>
                      </View>
                      <Text style={styles.storeMetaSeparator}>•</Text>
                      <Text style={styles.storeMetaText}>{store.category ?? "Mercado"}</Text>
                      <Text style={styles.storeMetaSeparator}>•</Text>
                      <View style={styles.storeMetaItem}>
                        <Icon
                          type="MaterialCommunityIcons"
                          name="map-marker"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={[styles.storeMetaText, styles.storeMetaTextWithIcon]}>
                          {distanceLabel}
                        </Text>
                      </View>
                    </View>

                    {store.city ? <Text style={styles.storeCity}>{store.city}</Text> : null}

                    {store.badge ? (
                      <View style={styles.storeBadge}>
                        <Text style={styles.storeBadgeText} numberOfLines={1}>
                          {store.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              Ainda não temos mercados próximos para exibir.
            </Text>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Talvez você também goste:</Text>
          {suggestionsToShow.length ? (
            <View style={styles.suggestionGrid}>
              {suggestionsToShow.map((item) => {
                const formattedPrice = formatPrice(item.price);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestionCard}
                    activeOpacity={0.85}
                    onPress={() => handleProductPress(item.id)}
                  >
                    <View style={styles.suggestionImageWrapper}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.suggestionImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.imageFallback}>
                          <Icon
                            type="MaterialCommunityIcons"
                            name="image-off"
                            size={24}
                            color={theme.colors.disabled}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.suggestionName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {formattedPrice ? (
                      <Text style={styles.suggestionPrice}>Por {formattedPrice}</Text>
                    ) : (
                      <Text style={styles.unavailablePrice}>Preço indisponível</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Use a busca para encontrar mais produtos.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}



