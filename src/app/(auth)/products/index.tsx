import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchInputBar from "@/src/components/common/SearchBar";
import { useSession } from "@/src/providers/SessionContext/Index";
import productService from "@/src/services/products-service";
import storeService from "@/src/services/store-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { geocodeAsync, getCurrentPositionAsync, LocationAccuracy, requestForegroundPermissionsAsync, reverseGeocodeAsync } from "expo-location";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import createStyles from "./styled";

type RawProduct = Record<string, unknown> & { id?: string };
type RawProductImage = Record<string, unknown> & { id?: string };

type ProductListItem = {
  id: string;
  name: string;
  storeId: string | null;
  storeName: string | null;
  category: string | null;
  unit: string | null;
  code: string | null;
  price: number | null;
  originalPrice: number | null;
  inPromotion: boolean;
  imageUrl: string | null;
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
  "url",
  "path",
  "public_url",
  "publicUrl",
  "download_url",
  "downloadUrl",
  "uri",
] as const;

const FAVORITE_STORE_ID_KEYS = [
  "store_id",
  "id_store",
  "storeId",
  "idStore",
  "market_id",
  "marketId",
  "loja_id",
  "lojaId",
  "store",
] as const;

const FAVORITE_PRODUCT_ID_KEYS = [
  "produto_id",
  "product_id",
  "produtoId",
  "productId",
  "id_produto",
  "idProduto",
  "id_product",
  "idProduct",
  "product",
] as const;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Memoized product card to reduce FlatList re-renders
type ProductCardProps = {
  item: ProductListItem;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  styles: ReturnType<typeof createStyles>;
  primaryColor: string;
  disabledColor: string;
};

const ProductCard = memo(
  ({
    item,
    onPress,
    onToggleFavorite,
    isFavorite,
    styles,
    primaryColor,
    disabledColor,
  }: ProductCardProps) => {
    const formattedPrice = item.price !== null ? currencyFormatter.format(item.price) : null;
    const formattedOriginalPrice =
      item.originalPrice !== null ? currencyFormatter.format(item.originalPrice) : null;
    const unitLabel = item.unit ? ` ${item.unit}` : "";

    const handleNavigate = useCallback(() => {
      onPress(item.id);
    }, [item.id, onPress]);

    const handleFavoritePress = useCallback(() => {
      onToggleFavorite(item.id);
    }, [item.id, onToggleFavorite]);

    return (
      <TouchableOpacity style={styles.card} onPress={handleNavigate} activeOpacity={0.7}>
        <View style={styles.cardImageWrapper}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <View style={styles.cardImageFallback}>
              <Icon type="MaterialCommunityIcons" name="image-off" size={32} color={disabledColor} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={handleFavoritePress}
              style={styles.cardFavoriteButton}
              accessibilityLabel={
                isFavorite ? "Remover produto dos favoritos" : "Adicionar produto aos favoritos"
              }
              accessibilityRole="button"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? primaryColor : disabledColor}
              />
            </TouchableOpacity>
          </View>

          {item.category ? (
            <Text style={styles.cardCategory} numberOfLines={1}>
              Categoria: {item.category}
            </Text>
          ) : null}

          <Text style={styles.cardStore}>Vendido por: {item.storeName ?? "Nao informado"}</Text>

          {formattedOriginalPrice ? (
            <Text style={styles.cardOriginalPrice}>De {formattedOriginalPrice}</Text>
          ) : null}

          {formattedPrice ? (
            <Text style={styles.cardPrice}>
              Por {formattedPrice}
              {unitLabel ? <Text style={styles.cardUnit}>{unitLabel}</Text> : null}
            </Text>
          ) : (
            <Text style={styles.cardUnavailable}>Preco nao informado</Text>
          )}

          {item.code ? <Text style={styles.cardCode}>Cod: {item.code}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item === next.item &&
    prev.isFavorite === next.isFavorite &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.styles === next.styles &&
    prev.primaryColor === next.primaryColor &&
    prev.disabledColor === next.disabledColor
);
ProductCard.displayName = "ProductCard";

const pickFirstValue = (
  source: Record<string, unknown> | null | undefined,
  keys: readonly string[]
) => {
  if (!source) return undefined;
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const extractIdFromRow = (
  row: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string | null => {
  if (!row) return null;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
};

const extractFavoriteStoreId = (row: Record<string, unknown> | null | undefined) =>
  extractIdFromRow(row, FAVORITE_STORE_ID_KEYS);

const extractFavoriteProductId = (row: Record<string, unknown> | null | undefined) =>
  extractIdFromRow(row, FAVORITE_PRODUCT_ID_KEYS);

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
    return ["true", "1", "yes", "sim"].includes(normalized);
  }

  return false;
};

const resolveImageUrl = (raw: RawProductImage): string | null => {
  for (const key of PRODUCT_IMAGE_URL_KEYS) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length) {
      return value;
    }
  }

  const nested = raw["image"];
  if (typeof nested === "string" && nested.trim().length) {
    return nested;
  }

  return null;
};

const extractStoreName = (store: Record<string, unknown> | null | undefined): string | null => {
  if (!store || typeof store !== "object") {
    return null;
  }

  const candidates = [
    "name",
    "store_name",
    "storeName",
    "fantasy_name",
    "fantasyName",
    "display_name",
    "displayName",
  ];

  for (const key of candidates) {
    const value = store[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

const FILTER_CATEGORIES = [
  "Padaria",
  "Acougue",
  "Hortifruti",
  "Nao Pereciveis",
  "Laticinios e Frios",
  "Bebidas",
  "Congelados",
  "Limpeza",
  "Higiene Pessoal e Perfumaria",
  "Outros",
] as const;

type FilterCategory = (typeof FILTER_CATEGORIES)[number];

type Filters = {
  onlyPromotion: boolean;
  categories: FilterCategory[];
  minPrice: number | null;
  maxPrice: number | null;
  favoriteStoresOnly: boolean;
  favoriteProductsOnly: boolean;
  // Loja
  state: string | null;
  city: string | null;
  radiusKm: number | null;
};

const NON_OUTROS_CATEGORIES: FilterCategory[] = FILTER_CATEGORIES.filter(
  (category) => category !== "Outros"
) as FilterCategory[];

const createDefaultFilters = (): Filters => ({
  onlyPromotion: false,
  categories: [],
  minPrice: null,
  maxPrice: null,
  favoriteStoresOnly: false,
  favoriteProductsOnly: false,
  // Default to Rio Grande do Sul and keep it locked in the UI
  state: "RS",
  city: null,
  radiusKm: null,
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isSameCategory = (categoryA: string | null | undefined, categoryB: FilterCategory) => {
  if (!categoryA) return false;
  const normalizedA = normalizeText(categoryA);
  const normalizedB = normalizeText(categoryB);
  return (
    normalizedA === normalizedB ||
    normalizedA.includes(normalizedB) ||
    normalizedB.includes(normalizedA)
  );
};

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits.length) {
    return "";
  }
  const numberValue = Number(digits) / 100;
  return currencyFormatter.format(numberValue);
};

const parseCurrencyInput = (value: string): number | null => {
  const digits = value.replace(/\D/g, "");
  if (!digits.length) {
    return null;
  }
  return Number(digits) / 100;
};

const formatCurrencyFromNumber = (value: number | null) =>
  value !== null ? currencyFormatter.format(value) : "";

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
  distritofederal: "df",
  es: "es",
  espiritosanto: "es",
  go: "go",
  goias: "go",
  ma: "ma",
  maranhao: "ma",
  mt: "mt",
  matogrosso: "mt",
  ms: "ms",
  matogrossodosul: "ms",
  mg: "mg",
  minasgerais: "mg",
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
  riodejaneiro: "rj",
  rn: "rn",
  riograndedonorte: "rn",
  rs: "rs",
  riograndedosul: "rs",
  ro: "ro",
  rondonia: "ro",
  rr: "rr",
  roraima: "rr",
  sc: "sc",
  santacatarina: "sc",
  sp: "sp",
  saopaulo: "sp",
  se: "se",
  sergipe: "se",
  to: "to",
  tocantins: "to",
};

const normalizeForComparison = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const normalizeStateKey = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = normalizeForComparison(value).replace(/\s+/g, "");
  return BRAZIL_STATE_ALIASES[normalized] ?? normalized;
};

// Map a geocoded city name to one of our allowed Ijuí region cities
const matchCityToIjuiRegion = (name: string | null | undefined): string | null => {
  if (!name) return null;
  const n = normalizeForComparison(name);
  let best: string | null = null;
  for (const city of IJUI_REGION_CITIES) {
    const c = normalizeForComparison(city);
    if (n === c || n.includes(c) || c.includes(n)) {
      best = city;
      break;
    }
  }
  return best;
};

// Static state list (locked to RS)
type SimpleState = { id: number; sigla: string; nome: string };
const AVAILABLE_STATES: SimpleState[] = [
  { id: 43, sigla: "RS", nome: "Rio Grande do Sul" },
];

// Static city options for Ijuí region
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

const mapProduct = (raw: RawProduct): ProductListItem | null => {
  const identifier =
    raw.id ??
    pickFirstValue(raw, [
      "product_id",
      "uuid",
      "id_product",
    ]);

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
  const categoryRaw = pickFirstValue(raw, [
    "category",
    "category_name",
    "department",
    "section",
    "segment",
  ]);

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

  let storeName: string | null = null;
  if (typeof storeNameRaw === "string") {
    const trimmed = storeNameRaw.trim();
    if (trimmed.length > 0) {
      storeName = trimmed;
    }
  }

  let storeId: string | null = null;
  const assignStoreId = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        storeId = trimmed;
      }
    } else if (typeof value === "number" && Number.isFinite(value)) {
      storeId = String(value);
    }
  };

  if (storeReferenceRaw && typeof storeReferenceRaw === "object") {
    const storeObject = storeReferenceRaw as RawProduct;
    const nestedId = pickFirstValue(storeObject, ["id", "store_id", "storeId", "uuid"]);
    assignStoreId(nestedId);

    if (!storeName) {
      const nestedName = pickFirstValue(storeObject, [
        "name",
        "store_name",
        "storeName",
        "title",
        "fantasy_name",
      ]);

      if (typeof nestedName === "string") {
        const trimmed = nestedName.trim();
        if (trimmed.length > 0) {
          storeName = trimmed;
        }
      }
    }
  } else {
    assignStoreId(storeReferenceRaw);
  }

  const imageRaw = pickFirstValue(raw, [
    "image_url",
    "image",
    "thumbnail",
    "main_image_url",
  ]);

  const basePrice = parseCurrencyValue(basePriceRaw);
  const promotionalPrice = parseCurrencyValue(promotionalPriceRaw);
  const originalPriceCandidate = parseCurrencyValue(originalPriceRaw);

  const explicitPromotionFlag = parseBooleanValue(
    pickFirstValue(raw, PROMOTION_FLAG_KEYS) ?? false
  );

  // Determine effective price and promotion flag.
  // Rule: Ignore promotionalPrice when it's null, <= 0, or when there is no evidence of a real discount
  // (i.e., no explicit flag and not cheaper than the base/original price). This avoids 0,00 showing when
  // in_promotion is false but a 0 placeholder exists in the promo column.
  let price: number | null = null;
  let originalPrice: number | null = null;
  let inPromotion = false;

  const promoIsValid =
    promotionalPrice !== null &&
    promotionalPrice > 0 &&
    (
      explicitPromotionFlag ||
      (typeof basePrice === "number" && promotionalPrice < basePrice) ||
      (typeof originalPriceCandidate === "number" && promotionalPrice < originalPriceCandidate)
    );

  if (promoIsValid) {
    const referencePrice = originalPriceCandidate ?? basePrice ?? promotionalPrice;
    price = promotionalPrice;
    originalPrice = referencePrice !== promotionalPrice ? referencePrice : null;
    inPromotion = true;
  } else if (explicitPromotionFlag && originalPriceCandidate !== null && basePrice !== null) {
    // Some datasets mark promotion via flag and keep base as discounted, original as list price.
    price = basePrice;
    originalPrice = originalPriceCandidate > basePrice ? originalPriceCandidate : null;
    inPromotion = originalPrice !== null;
  } else {
    // No valid promotion; use the best available non-zero positive price.
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
    name:
      typeof nameRaw === "string" && nameRaw.trim().length ? nameRaw : "Produto",
    storeId,
    storeName,
    category:
      typeof categoryRaw === "string" && categoryRaw.trim().length ? categoryRaw : null,
    unit:
      typeof unitRaw === "string" && unitRaw.trim().length ? unitRaw : null,
    code:
      typeof codeRaw === "string" && codeRaw.trim().length
        ? codeRaw
        : typeof codeRaw === "number"
        ? String(codeRaw)
        : null,
    price,
    originalPrice,
    inPromotion,
    imageUrl:
      typeof imageRaw === "string" && imageRaw.trim().length ? imageRaw : null,
  };
};

export default function Products() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const {
    session,
    getFavoriteStoresByUser,
    getFavoriteProductsByUser,
    addProductToFavorites,
    removeProductFromFavorites,
  } = useSession();
  const userId = session?.user?.id ?? null;

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const animationLoading = useRef<LottieView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [draftOnlyPromotion, setDraftOnlyPromotion] = useState(false);
  const [draftFavoriteStoresOnly, setDraftFavoriteStoresOnly] = useState(false);
  const [draftFavoriteProductsOnly, setDraftFavoriteProductsOnly] = useState(false);
  const [draftCategories, setDraftCategories] = useState<FilterCategory[]>([]);
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  // Loja - drafts
  const [draftState, setDraftState] = useState("RS");
  const [draftCity, setDraftCity] = useState("");
  const [draftRadiusKm, setDraftRadiusKm] = useState<number>(5);
  const [draftRadiusEnabled, setDraftRadiusEnabled] = useState<boolean>(false);
  // No dynamic states loading; locked to RS

  const storeCache = useMemo(() => new Map<string, string | null>(), []);
  const [storeLocationMeta, setStoreLocationMeta] = useState<Record<string, { city: string | null; state: string | null }>>({});
  const [storeDistances, setStoreDistances] = useState<Record<string, number>>({});
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [initializedCityFromLocation, setInitializedCityFromLocation] = useState<boolean>(false);
  // no-op ref kept out

  // Custom selector state (replaces Picker)
  const [isCitySelectorVisible, setIsCitySelectorVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const filteredCities = useMemo(() => {
    const q = normalizeForComparison(cityQuery);
    const list = IJUI_REGION_CITIES as readonly string[];
    if (!q) return list;
    return list.filter((c) => normalizeForComparison(c).includes(q));
  }, [cityQuery]);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(() => new Set());
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(() => new Set());
  const syncFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteStoreIds(new Set());
      setFavoriteProductIds(new Set());
      return;
    }

    try {
      const [storeFavoritesResponse, productFavoritesResponse] = await Promise.all([
        getFavoriteStoresByUser(userId),
        getFavoriteProductsByUser(userId),
      ]);

      if (storeFavoritesResponse?.error) {
        console.warn("Products: falha ao carregar lojas favoritas:", storeFavoritesResponse.error);
      }
      if (productFavoritesResponse?.error) {
        console.warn("Products: falha ao carregar produtos favoritos:", productFavoritesResponse.error);
      }

      if (Array.isArray(storeFavoritesResponse?.data)) {
        const nextStoreIds = new Set<string>();
        for (const row of storeFavoritesResponse.data as Record<string, unknown>[]) {
          const storeId = extractFavoriteStoreId(row);
          if (storeId) {
            nextStoreIds.add(storeId);
          }
        }
        setFavoriteStoreIds(nextStoreIds);
      } else {
        setFavoriteStoreIds(new Set());
      }

      if (Array.isArray(productFavoritesResponse?.data)) {
        const nextProductIds = new Set<string>();
        for (const row of productFavoritesResponse.data as Record<string, unknown>[]) {
          const productId = extractFavoriteProductId(row);
          if (productId) {
            nextProductIds.add(productId);
          }
        }
        setFavoriteProductIds(nextProductIds);
      } else {
        setFavoriteProductIds(new Set());
      }
    } catch (syncError) {
      console.error("Products: erro inesperado ao carregar favoritos:", syncError);
    }
  }, [getFavoriteProductsByUser, getFavoriteStoresByUser, userId]);

  // Ensure current city is valid against list
  const safeDraftCity = useMemo(
    () => (IJUI_REGION_CITIES as readonly string[]).includes(draftCity) ? draftCity : "",
    [draftCity]
  );

  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  const handleToggleFavoriteProduct = useCallback(
    async (productId: string) => {
      if (!productId) return;
      if (!userId) {
        console.warn("Products: usuario nao autenticado ao modificar favorito de produto.");
        return;
      }

      let nextValue = false;
      setFavoriteProductIds((current) => {
        const alreadyFavorite = current.has(productId);
        nextValue = !alreadyFavorite;
        const next = new Set(current);
        if (nextValue) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });

      try {
        if (nextValue) {
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
        console.error("Products: erro ao atualizar favorito de produto:", toggleError);
        setFavoriteProductIds((current) => {
          const next = new Set(current);
          if (nextValue) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return next;
        });
      }
    },
    [addProductToFavorites, removeProductFromFavorites, userId]
  );

  // Consider as "active" only user-controlled filters.
  // State is locked to RS by default, so it should NOT count as an active filter.
  const hasActiveFilters = useMemo(() => {
    const hasPromotion = !!filters.onlyPromotion;
    const hasCategories = filters.categories.length > 0;
    const hasPrice = filters.minPrice !== null || filters.maxPrice !== null;
    const hasCity = typeof filters.city === "string" && filters.city.trim().length > 0;
    const hasRadius = filters.radiusKm !== null;
    const hasFavoriteStores = !!filters.favoriteStoresOnly;
    const hasFavoriteProducts = !!filters.favoriteProductsOnly;
    return (
      hasPromotion ||
      hasCategories ||
      hasPrice ||
      hasCity ||
      hasRadius ||
      hasFavoriteStores ||
      hasFavoriteProducts
    );
  }, [filters]);

  const hasVisibleFilters = hasActiveFilters;

  const priceRangeLabel = useMemo(() => {
    if (filters.minPrice !== null && filters.maxPrice !== null) {
      return `De: ${currencyFormatter.format(filters.minPrice)} Até ${currencyFormatter.format(
        filters.maxPrice
      )}`;
    }
    if (filters.minPrice !== null) {
      return `A partir de ${currencyFormatter.format(filters.minPrice)}`;
    }
    if (filters.maxPrice !== null) {
      return `Até ${currencyFormatter.format(filters.maxPrice)}`;
    }
    return "";
  }, [filters.maxPrice, filters.minPrice]);

  const priceKeyboardType = Platform.OS === "ios" ? "number-pad" : "numeric";

  const handleFilterButtonPress = useCallback(() => {
    setDraftOnlyPromotion(filters.onlyPromotion);
    setDraftFavoriteStoresOnly(filters.favoriteStoresOnly);
    setDraftFavoriteProductsOnly(filters.favoriteProductsOnly);
    setDraftCategories(filters.categories);
    setDraftMinPrice(formatCurrencyFromNumber(filters.minPrice));
    setDraftMaxPrice(formatCurrencyFromNumber(filters.maxPrice));
    setDraftState(filters.state ?? "RS");
    setDraftCity(filters.city ?? "");
    setDraftRadiusKm(filters.radiusKm ?? 5);
    setDraftRadiusEnabled(filters.radiusKm !== null);
    setIsFilterModalVisible(true);
  }, [filters]);

  const handleCancelFilters = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const minPriceValue = parseCurrencyInput(draftMinPrice);
    const maxPriceValue = parseCurrencyInput(draftMaxPrice);

    let nextMinPrice = minPriceValue;
    let nextMaxPrice = maxPriceValue;

    if (
      nextMinPrice !== null &&
      nextMaxPrice !== null &&
      nextMinPrice > nextMaxPrice
    ) {
      const temp = nextMinPrice;
      nextMinPrice = nextMaxPrice;
      nextMaxPrice = temp;
    }

    setFilters({
      onlyPromotion: draftOnlyPromotion,
      favoriteStoresOnly: draftFavoriteStoresOnly,
      favoriteProductsOnly: draftFavoriteProductsOnly,
      categories: [...draftCategories],
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
      state: draftState ? draftState : null,
      city: draftCity ? draftCity : null,
      radiusKm: draftRadiusEnabled ? draftRadiusKm : null,
    });
    setIsFilterModalVisible(false);
  }, [
    draftCategories,
    draftMaxPrice,
    draftMinPrice,
    draftOnlyPromotion,
    draftFavoriteStoresOnly,
    draftFavoriteProductsOnly,
    draftState,
    draftCity,
    draftRadiusKm,
    draftRadiusEnabled,
  ]);

  const handleClearFilters = useCallback(() => {
    setFilters(createDefaultFilters());
    setDraftOnlyPromotion(false);
    setDraftFavoriteStoresOnly(false);
    setDraftFavoriteProductsOnly(false);
    setDraftCategories([]);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftState("RS");
    setDraftCity("");
    setDraftRadiusKm(5);
    setDraftRadiusEnabled(false);
  }, []);
  
  // No states API fetching; state is locked to RS.

  const handleRemoveCategoryFilter = useCallback((category: FilterCategory) => {
    setFilters((current) => ({
      ...current,
      categories: current.categories.filter((item) => item !== category),
    }));
  }, []);

  const handleRemovePromotionFilter = useCallback(() => {
    setFilters((current) => ({
      ...current,
      onlyPromotion: false,
    }));
  }, []);

  const handleRemoveFavoriteStoresFilter = useCallback(() => {
    setFilters((current) => ({
      ...current,
      favoriteStoresOnly: false,
    }));
  }, []);

  const handleRemoveFavoriteProductsFilter = useCallback(() => {
    setFilters((current) => ({
      ...current,
      favoriteProductsOnly: false,
    }));
  }, []);

  const handleRemovePriceFilter = useCallback(() => {
    setFilters((current) => ({
      ...current,
      minPrice: null,
      maxPrice: null,
    }));
  }, []);

  const handleRemoveLocationFilter = useCallback(() => {
    setFilters((current) => ({ ...current, state: null, city: null }));
  }, []);

  const handleRemoveRadiusFilter = useCallback(() => {
    setFilters((current) => ({ ...current, radiusKm: null }));
  }, []);

  const toggleDraftCategory = useCallback((category: FilterCategory) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }, []);

  const handleDraftMinPriceChange = useCallback((value: string) => {
    setDraftMinPrice(formatCurrencyInput(value));
  }, []);

  const handleDraftMaxPriceChange = useCallback((value: string) => {
    setDraftMaxPrice(formatCurrencyInput(value));
  }, []);

  const fetchProductImage = useCallback(async (product: ProductListItem) => {
    try {
      const { data, error: imagesError } = await productService.getImageProduct(product.id);
      if (imagesError) {
        console.warn("Products: falha ao carregar imagens do produto", imagesError);
        return product.imageUrl;
      }

      const rows = Array.isArray(data) ? (data as RawProductImage[]) : [];
      const urls: string[] = [];

      for (const row of rows) {
        const resolvedUrl = resolveImageUrl(row);
        if (resolvedUrl && !urls.includes(resolvedUrl)) {
          urls.push(resolvedUrl);
        }
      }

      if (product.imageUrl && !urls.includes(product.imageUrl)) {
        urls.unshift(product.imageUrl);
      }

      return urls[0] ?? null;
    } catch (imageError) {
      console.warn("Products: erro inesperado ao buscar imagem", imageError);
      return product.imageUrl;
    }
  }, []);

  const fetchStoreName = useCallback(
    async (product: ProductListItem): Promise<string | null> => {
      if (!product.storeId) {
        return product.storeName ?? null;
      }

      if (storeCache.has(product.storeId)) {
        return storeCache.get(product.storeId) ?? null;
      }

      try {
        const { data, error: storeError } = await storeService.getStoreById(product.storeId);
        if (storeError) {
          console.warn("Products: falha ao carregar loja", storeError);
          storeCache.set(product.storeId, null);
          return product.storeName ?? null;
        }

        const resolvedName = extractStoreName((data as Record<string, unknown> | null) ?? null);
        storeCache.set(product.storeId, resolvedName ?? null);
        return resolvedName ?? product.storeName ?? null;
      } catch (storeException) {
        console.warn("Products: erro inesperado ao buscar loja", storeException);
        storeCache.set(product.storeId, product.storeName ?? null);
        return product.storeName ?? null;
      }
    },
    [storeCache]
  );

  // Request user location once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const position = await getCurrentPositionAsync({ accuracy: LocationAccuracy.Balanced });
        if (!cancelled) {
          setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      } catch (e) {
        console.warn("Products: localização não obtida", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Once we have the user's coordinates, try to select the city filter by default
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userLocation) return;
      if (initializedCityFromLocation) return;
      if (filters.city) return;
      try {
        const results = await reverseGeocodeAsync({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
        const first = Array.isArray(results) ? results[0] : undefined;
        const cityCandidate =
          (first as any)?.city || (first as any)?.subregion || (first as any)?.district;
        const matched = matchCityToIjuiRegion(typeof cityCandidate === "string" ? cityCandidate : "");
        if (!cancelled && matched) {
          setFilters((curr) => (curr.city ? curr : { ...curr, city: matched }));
          setDraftCity((curr) => (curr || matched));
          setInitializedCityFromLocation(true);
        } else if (!cancelled) {
          setInitializedCityFromLocation(true);
        }
      } catch {
        if (!cancelled) setInitializedCityFromLocation(true);
      }
    })();
    return () => { cancelled = true; };
  }, [userLocation, initializedCityFromLocation, filters.city]);

  const loadProducts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const { data, error: productsError } = await productService.getProducts();
      if (productsError) {
        console.error("Products: erro ao buscar produtos", productsError);
        setError("Nao foi possivel carregar os produtos.");
        setProducts([]);
        return;
      }

      const rawList = Array.isArray(data) ? (data as RawProduct[]) : [];
      const mapped = rawList
        .map(mapProduct)
        .filter((item): item is ProductListItem => Boolean(item));

      const enriched = await Promise.all(
        mapped.map(async (product) => {
          const [storeName, imageUrl] = await Promise.all([
            fetchStoreName(product),
            fetchProductImage(product),
          ]);

          return {
            ...product,
            storeName: storeName ?? product.storeName ?? null,
            imageUrl: imageUrl ?? null,
          };
        })
      );

      setProducts(enriched);
    } catch (caughtError) {
      console.error("Products: erro inesperado ao carregar lista", caughtError);
      setError("Ocorreu um erro ao carregar os produtos.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProductImage, fetchStoreName]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await loadProducts({ silent: true });
      await syncFavorites();
    } catch (refreshError) {
      console.warn("Products: erro ao recarregar lista:", refreshError);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadProducts, syncFavorites]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Compute store location meta and distances for products
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ids = Array.from(new Set(products.map((p) => (p.storeId ?? "").trim()).filter(Boolean)));
      if (!ids.length) return;

      const nextLocations: Record<string, { city: string | null; state: string | null }> = {};
      const nextDistances: Record<string, number> = {};

      for (const storeId of ids) {
        try {
          const currentMeta = storeLocationMeta[storeId];
          let city = currentMeta?.city ?? null;
          let state = currentMeta?.state ?? null;

          let coords: Coordinates | null = null;

          const { data, error } = await storeService.getAddressesStore(storeId);
          if (!error) {
            let addresses: any[] | undefined;
            if (Array.isArray(data)) addresses = data as any[];
            else if (data && Array.isArray((data as any).logAddress)) addresses = (data as any).logAddress;
            const primary = addresses?.[0];
            if (primary) {
              if (!city && typeof primary?.city === "string") city = primary.city.trim() || null;
              if (!state && typeof primary?.state_acronym === "string") state = (primary.state_acronym as string).trim().toUpperCase();
              if (!state && typeof primary?.state === "string") state = (primary.state as string).trim().toUpperCase();

              if (typeof primary?.latitude === "number" && typeof primary?.longitude === "number") {
                coords = { latitude: primary.latitude, longitude: primary.longitude };
              } else {
                const addressParts = [
                  [primary.street, primary.street_number].filter(Boolean).join(", ").trim(),
                  primary.neighborhood,
                  primary.city,
                  primary.state_acronym ?? primary.state,
                  primary.country ?? "Brasil",
                ]
                  .filter((part: string | null | undefined) => typeof part === "string" && part.trim().length > 0)
                  .map((part: string) => part.trim());

                if (addressParts.length) {
                  const formatted = addressParts.join(", ");
                  try {
                    const results = await geocodeAsync(formatted);
                    const first = results.find((r) => typeof r?.latitude === "number" && typeof r?.longitude === "number");
                    if (first) coords = { latitude: first.latitude, longitude: first.longitude };
                  } catch {}
                }
              }
            }
          }

          if (city || state) nextLocations[storeId] = { city: city ?? null, state: state ?? null };

          if (coords && userLocation) {
            const d = calculateDistanceKm(userLocation, coords);
            nextDistances[storeId] = d;
          }
        } catch (e) {
          console.warn("Products: erro ao obter endereço da loja", storeId, e);
        }
      }

      if (!cancelled) {
        if (Object.keys(nextLocations).length) {
          setStoreLocationMeta((prev) => ({ ...prev, ...nextLocations }));
        }
        if (Object.keys(nextDistances).length) {
          setStoreDistances((prev) => ({ ...prev, ...nextDistances }));
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [products, userLocation, storeLocationMeta]);

  const filteredProducts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !needle ||
        product.name?.toLowerCase().includes(needle) ||
        product.code?.toLowerCase().includes(needle) ||
        product.storeName?.toLowerCase().includes(needle);

      if (!matchesSearch) {
        return false;
      }

      if (filters.onlyPromotion && !product.inPromotion) {
        return false;
      }

      // Loja: estado/cidade
      if (filters.state) {
        const meta = product.storeId ? storeLocationMeta[product.storeId] : undefined;
        const storeState = normalizeStateKey(meta?.state ?? null);
        const target = normalizeStateKey(filters.state);
        if (!storeState || !target || storeState !== target) return false;
      }

      if (filters.city) {
        const meta = product.storeId ? storeLocationMeta[product.storeId] : undefined;
        const storeCity = meta?.city ? normalizeForComparison(meta.city) : null;
        const targetCity = normalizeForComparison(filters.city);
        if (!storeCity || storeCity !== targetCity) return false;
      }

      if (filters.radiusKm !== null) {
        if (!product.storeId) return false;
        const distance = storeDistances[product.storeId];
        if (!(typeof distance === "number") || distance > filters.radiusKm) return false;
      }

      if (filters.favoriteStoresOnly) {
        if (!product.storeId) {
          return false;
        }
        if (!favoriteStoreIds.has(product.storeId)) {
          return false;
        }
      }

      if (filters.favoriteProductsOnly && !favoriteProductIds.has(product.id)) {
        return false;
      }

      if (filters.categories.length) {
        const matchesCategory = filters.categories.some((category) => {
          if (category === "Outros") {
            const matchesKnown = NON_OUTROS_CATEGORIES.some((knownCategory) =>
              isSameCategory(product.category, knownCategory)
            );
            return !matchesKnown;
          }
          return isSameCategory(product.category, category);
        });

        if (!matchesCategory) {
          return false;
        }
      }

      const effectivePrice = product.price ?? product.originalPrice;

      if (filters.minPrice !== null) {
        if (effectivePrice === null || effectivePrice < filters.minPrice) {
          return false;
        }
      }

      if (filters.maxPrice !== null) {
        if (effectivePrice === null || effectivePrice > filters.maxPrice) {
          return false;
        }
      }

      return true;
    });
  }, [favoriteProductIds, favoriteStoreIds, filters, products, searchTerm, storeDistances, storeLocationMeta]);

  const renderListHeader = useCallback(() => {
    const filterIconColor = theme.colors.primary;

    return (
      <View style={styles.listHeader}>
        <View style={styles.searchSection}>
          <SearchInputBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Pesquisar..."
            containerStyle={styles.searchBar}
            inputProps={{ autoCapitalize: "none", autoCorrect: false }}
          />
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              onPress={handleFilterButtonPress}
              style={styles.filterButton}
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros"
              activeOpacity={0.7}
            >
              <Icon type="feather" name="sliders" size={18} color={filterIconColor} />
            </TouchableOpacity>

            {hasVisibleFilters ? (
              <TouchableOpacity onPress={handleClearFilters} style={styles.clearFiltersButton} activeOpacity={0.7}>
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

          {hasVisibleFilters ? (
            <View style={styles.filterChipsWrapper}>
                  {filters.city && filters.state ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.city} - {filters.state}</Text>
                  <TouchableOpacity
                    onPress={handleRemoveLocationFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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

              {typeof filters.radiusKm === "number" ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Até {filters.radiusKm} km</Text>
                  <TouchableOpacity
                    onPress={handleRemoveRadiusFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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

              {filters.favoriteStoresOnly ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    <Icon 
                      name={"heart"} 
                      type="fontawesome" 
                      color={theme.colors.primary} 
                      size={16} 
                    /> Lojas favoritas
                  </Text>
                  <TouchableOpacity
                    onPress={handleRemoveFavoriteStoresFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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

              {filters.onlyPromotion ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Em Promoção</Text>
                  <TouchableOpacity
                    onPress={handleRemovePromotionFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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

              {filters.favoriteProductsOnly ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    <Icon 
                      name={"heart"} 
                      type="fontawesome" 
                      color={theme.colors.primary} 
                      size={16} 
                    /> Produtos favoritos
                  </Text>
                  <TouchableOpacity
                    onPress={handleRemoveFavoriteProductsFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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

              {filters.categories.map((category) => (
                <View key={category} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{category}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveCategoryFilter(category)}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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
              ))}

              {priceRangeLabel ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{priceRangeLabel}</Text>
                  <TouchableOpacity
                    onPress={handleRemovePriceFilter}
                    style={styles.filterChipRemove}
                    activeOpacity={0.7}
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
          ) : null}
        </View>
      </View>
    );
  }, [
    filters.categories,
    filters.favoriteProductsOnly,
    filters.favoriteStoresOnly,
    filters.onlyPromotion,
    filters.city,
    filters.state,
    filters.radiusKm,
    handleClearFilters,
    handleFilterButtonPress,
    handleRemoveCategoryFilter,
    handleRemoveFavoriteProductsFilter,
    handleRemoveFavoriteStoresFilter,
    handleRemoveLocationFilter,
    handleRemovePriceFilter,
    handleRemovePromotionFilter,
    handleRemoveRadiusFilter,
    hasVisibleFilters,
    priceRangeLabel,
    searchTerm,
    setSearchTerm,
    styles,
    theme.colors.primary,
  ]);

  const onNavigate = useCallback(
    (id: string) => {
      router.push({ pathname: "/(auth)/products/[id_produto]", params: { id_produto: id } });
    },
    [router]
  );

  const renderProductItem = useCallback(
    ({ item }: { item: ProductListItem }) => (
      <ProductCard
        item={item}
        onPress={onNavigate}
        onToggleFavorite={handleToggleFavoriteProduct}
        isFavorite={favoriteProductIds.has(item.id)}
        styles={styles}
        primaryColor={theme.colors.primary}
        disabledColor={theme.colors.disabled}
      />
    ),
    [
      favoriteProductIds,
      handleToggleFavoriteProduct,
      onNavigate,
      styles,
      theme.colors.disabled,
      theme.colors.primary,
    ]
  );

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity onPress={() => loadProducts()} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasActiveFilters) {
      return (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>Nenhum produto encontrado para os filtros selecionados.</Text>
          <TouchableOpacity onPress={handleClearFilters} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Limpar filtros</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.feedbackWrapper}>
        <Text style={styles.feedbackText}>Nenhum produto encontrado.</Text>
      </View>
    );
  };

  return (
    <>
      <ScreenContainer style={styles.container}>
        <HeaderScreen title="Produtos" />
        <View style={styles.content}>
          {isLoading ? (
            <>
              {renderListHeader()}
              <View style={styles.loadingWrapper}>
                <LoadingIcon
                  autoPlay
                  loop
                  source={loadingCart}
                  refAnimationLoading={animationLoading}
                  style={{ width: 150, height: 150 }}
                />
              </View>
            </>
          ) : (
            <FlatList
              data={filteredProducts}
              extraData={favoriteProductIds}
              keyExtractor={(item) => item.id}
              renderItem={renderProductItem}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={7}
              removeClippedSubviews
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.colors.primary}
                />
              }
              ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScreenContainer>

      <Modal
        visible={isFilterModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleCancelFilters}
      >
        <View style={styles.filterModalOverlay}>
          <Pressable style={styles.filterModalBackdrop} onPress={handleCancelFilters} />
          <View style={styles.filterModalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterModalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.filterModalTitle}>Filtros</Text>

              {/* Filtros Lojas */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filtros de Lojas: </Text>

                <View style={{ gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                    {/* Estado (fixo RS) */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.priceInputLabel}>Estado</Text>
                      <View
                        style={{
                          backgroundColor: theme.colors.secondary,
                          borderRadius: theme.radius.lg,
                          borderWidth: 1,
                          borderColor: theme.colors.primary,
                        }}
                      >
                        <View style={{ paddingVertical: 8, paddingHorizontal: 12, opacity: 0.7 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ color: theme.colors.text }}>{`${AVAILABLE_STATES[0].sigla} - ${AVAILABLE_STATES[0].nome}`}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Icon type="MaterialCommunityIcons" name="lock-outline" size={16} color={theme.colors.primary} />
                              <Text style={{ color: theme.colors.primary, fontSize: 12 }}>fixo</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Cidade (seletor região de Ijuí) */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.priceInputLabel}>Cidade</Text>
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
                          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 12 }}
                        >
                          <Text style={{ color: safeDraftCity ? theme.colors.text : theme.colors.disabled }}>
                            {safeDraftCity || "Selecione a cidade"}
                          </Text>
                          <Icon type="MaterialCommunityIcons" name="chevron-down" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}>
                      <Text style={styles.priceInputLabel}>Em um raio de distancia:</Text>
                      <TouchableOpacity onPress={() => setDraftRadiusEnabled((c) => !c)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                        <Icon type="MaterialCommunityIcons" name={draftRadiusEnabled ? "close-circle-outline" : "check-circle"} size={18} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.primary }}>{draftRadiusEnabled ? "Sem limite" : "Com limite"}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.sliderFallback, !draftRadiusEnabled && styles.sliderDisabled]}>
                      <TouchableOpacity
                        style={[styles.sliderFallbackButton, !draftRadiusEnabled && styles.sliderFallbackButtonDisabled]}
                        onPress={() => setDraftRadiusKm((v) => Math.max(1, Math.min(20, v - 1)))}
                        disabled={!draftRadiusEnabled}
                      >
                        <Text style={styles.sliderFallbackButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.sliderFallbackValue}>{draftRadiusKm} km</Text>
                      <TouchableOpacity
                        style={[styles.sliderFallbackButton, !draftRadiusEnabled && styles.sliderFallbackButtonDisabled]}
                        onPress={() => setDraftRadiusKm((v) => Math.max(1, Math.min(20, v + 1)))}
                        disabled={!draftRadiusEnabled}
                      >
                        <Text style={styles.sliderFallbackButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    {!draftRadiusEnabled ? (
                      <View style={styles.sliderValueRow}>
                        <Text style={styles.sliderValueUnlimited}>Sem limite definido</Text>
                      </View>
                    ) : null}
                </View>
              </View>
            </View>

            <View style={styles.favoriteFilterWrapper}>
              <Text style={styles.favoriteFilterTitle}>Filtros de Favoritos:</Text>
              <TouchableOpacity
                style={[
                  styles.favoriteTogglePill,
                  draftFavoriteStoresOnly && styles.favoriteTogglePillActive,
                ]}
                onPress={() => setDraftFavoriteStoresOnly((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.favoriteToggleCheckbox,
                    draftFavoriteStoresOnly && styles.favoriteToggleCheckboxActive,
                  ]}
                >
                  {draftFavoriteStoresOnly ? (
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
                    draftFavoriteStoresOnly && styles.favoriteToggleLabelActive,
                  ]}
                >
                  Mostrar apenas lojas favoritas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.favoriteTogglePill,
                  draftFavoriteProductsOnly && styles.favoriteTogglePillActive,
                ]}
                onPress={() => setDraftFavoriteProductsOnly((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.favoriteToggleCheckbox,
                    draftFavoriteProductsOnly && styles.favoriteToggleCheckboxActive,
                  ]}
                >
                  {draftFavoriteProductsOnly ? (
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
                    draftFavoriteProductsOnly && styles.favoriteToggleLabelActive,
                  ]}
                >
                  Mostrar apenas produtos favoritos
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Filtros de Produtos:</Text>
            <TouchableOpacity
              onPress={() => setDraftOnlyPromotion((current) => !current)}
              style={[
                styles.filterCheckboxRow,
                draftOnlyPromotion && styles.filterCheckboxRowActive,
              ]}
              activeOpacity={0.7}
            >
                <View
                  style={[
                    styles.filterCheckbox,
                    draftOnlyPromotion && styles.filterCheckboxSelected,
                  ]}
                >
                  {draftOnlyPromotion ? (
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
                    styles.filterCheckboxLabel,
                    draftOnlyPromotion && styles.filterCheckboxLabelActive,
                  ]}
              >
                Em Promoção
              </Text>
            </TouchableOpacity>

            <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filtros de Categorias:</Text>

                <View style={styles.categoriesGrid}>
                  {FILTER_CATEGORIES.map((category) => {
                    const isSelected = draftCategories.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleDraftCategory(category)}
                        style={[
                          styles.categoryPill,
                          isSelected && styles.categoryPillSelected,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.categoryCheckbox,
                            isSelected && styles.categoryCheckboxSelected,
                          ]}
                        >
                          {isSelected ? (
                            <Icon
                              type="MaterialCommunityIcons"
                              name="check"
                              size={14}
                              color={theme.colors.onPrimary}
                            />
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.categoryLabel,
                            isSelected && styles.categoryLabelSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filtros de preço:</Text>
                <View style={styles.priceInputsRow}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>De:</Text>
                    <TextInput
                      value={draftMinPrice}
                      onChangeText={handleDraftMinPriceChange}
                      placeholder="R$ 00,00"
                      style={styles.priceInput}
                      keyboardType={priceKeyboardType}
                      placeholderTextColor={theme.colors.disabled}
                    />
                  </View>

                  <View style={[styles.priceInputWrapper, styles.priceInputWrapperLast]}>
                    <Text style={styles.priceInputLabel}>Até:</Text>
                    <TextInput
                      value={draftMaxPrice}
                      onChangeText={handleDraftMaxPriceChange}
                      placeholder="R$ 00,00"
                      style={styles.priceInput}
                      keyboardType={priceKeyboardType}
                      placeholderTextColor={theme.colors.disabled}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  onPress={handleApplyFilters}
                  style={styles.applyFiltersButton}
                  activeOpacity={0.8}
                >
                  <Icon
                    type="MaterialCommunityIcons"
                    name="filter"
                    size={18}
                    color={theme.colors.onPrimary}
                  />
                  <Text style={styles.applyFiltersText}>Aplicar filtros</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelFilters}
                  style={styles.cancelFiltersButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelFiltersText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* City selector modal (custom dropdown replacement) */}
      <Modal
        visible={isCitySelectorVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCitySelectorVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <Pressable style={styles.filterModalBackdrop} onPress={() => setIsCitySelectorVisible(false)} />
          <View style={[styles.filterModalCard, { maxHeight: 420 }]}>
            <View style={{ padding: theme.spacing.sm }}>
              <Text style={styles.filterSectionTitle}>Selecionar cidade</Text>
              <View
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  marginTop: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 6,
                }}
              >
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder="Buscar cidade..."
                  placeholderTextColor={theme.colors.disabled}
                  style={{ color: theme.colors.text }}
                />
              </View>

              <View style={{ marginTop: theme.spacing.sm, maxHeight: 260 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                >
                  {(filteredCities.length ? filteredCities : (IJUI_REGION_CITIES as readonly string[])).map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => {
                        setDraftCity(city);
                        setIsCitySelectorVisible(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.secondary,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: theme.colors.text }}>{city}</Text>
                      {safeDraftCity === city ? (
                        <Icon type="MaterialCommunityIcons" name="check" size={18} color={theme.colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  ))}

                  {filteredCities.length === 0 ? (
                    <View style={{ paddingVertical: 16, alignItems: "center" }}>
                      <Text style={{ color: theme.colors.disabled }}>Nenhuma cidade encontrada</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: theme.spacing.sm,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setDraftCity("");
                    setCityQuery("");
                    setIsCitySelectorVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme.colors.primary }}>Limpar cidade</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsCitySelectorVisible(false)} activeOpacity={0.7}>
                  <Text style={{ color: theme.colors.primary }}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
