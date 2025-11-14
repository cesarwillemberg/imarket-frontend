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
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import createStyles from "./styled";

type GenericRecord = Record<string, unknown>;
type RawProduct = GenericRecord & { id?: string | number };
type RawStore = GenericRecord & { id?: string | number };

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
  badge: string | null;
  logoUrl: string | null;
  city: string | null;
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
] as const;

const STORE_LOGO_KEYS = [
  "logo_url",
  "logoUrl",
  "logo",
  "image_url",
  "imageUrl",
  "avatar",
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
      ? `${distanceNumber.toFixed(1)} Km`
      : coerceString(distanceRaw) ?? null;

  return {
    id: String(identifier),
    name: coerceString(
      pickFirstValue(raw, ["name", "store_name", "title", "fantasy_name", "social_name"])
    ) ?? "Mercado",
    category: category ?? "Mercado",
    rating: parseNumberValue(ratingRaw),
    distanceLabel,
    badge: coerceString(pickFirstValue(raw, STORE_BADGE_KEYS)),
    logoUrl: coerceString(pickFirstValue(raw, STORE_LOGO_KEYS)),
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
  const { session } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [stores, setStores] = useState<StoreCardItem[]>([]);
  const notificationCount = 0;
  const animationLoading = useRef<LottieView>(null);

  useEffect(() => {
    if (!session) {
      router.replace("/signin");
    }
  }, [session, router]);

  const loadHomeData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [storesResponse, productsResponse] = await Promise.all([
          storeService.getStores(),
          productService.getProducts(),
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
        const mappedProducts = Array.isArray(productsResponse.data)
          ? productsResponse.data.map(mapProductFromApi).filter(isNotNull)
          : [];

        setStores(mappedStores);
        setProducts(mappedProducts);
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
    []
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

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({
        pathname: "/(auth)/products/[id_produto]",
        params: { id_produto: productId },
      });
    },
    [router]
  );

  const handleStorePress = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/(auth)/store/[id_store]", params: { id_store: storeId } });
    },
    [router]
  );

  const normalizedQuery = useMemo(() => normalizeText(searchTerm.trim()), [searchTerm]);

  const matchesQuery = useCallback(
    (text: string | null | undefined) => {
      if (!normalizedQuery) {
        return true;
      }
      return normalizeText(text).includes(normalizedQuery);
    },
    [normalizedQuery]
  );

  const promotions = useMemo(
    () => products.filter((product) => product.inPromotion),
    [products]
  );
  const otherSuggestions = useMemo(
    () => products.filter((product) => !product.inPromotion),
    [products]
  );

  const filteredPromotions = useMemo(
    () =>
      promotions.filter(
        (item) => matchesQuery(item.name) || matchesQuery(item.storeName) || matchesQuery(item.code)
      ),
    [matchesQuery, promotions]
  );
  const filteredStores = useMemo(
    () =>
      stores.filter(
        (item) =>
          matchesQuery(item.name) ||
          matchesQuery(item.category) ||
          matchesQuery(item.badge) ||
          matchesQuery(item.city)
      ),
    [matchesQuery, stores]
  );
  const filteredSuggestions = useMemo(
    () =>
      otherSuggestions.filter(
        (item) => matchesQuery(item.name) || matchesQuery(item.storeName) || matchesQuery(item.code)
      ),
    [matchesQuery, otherSuggestions]
  );

  const promotionsToShow = filteredPromotions.slice(0, 3);
  const storesToShow = filteredStores.slice(0, 3);
  const suggestionsToShow = filteredSuggestions.slice(0, 9);

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
      <View style={styles.headerRow}>
          <SearchInputBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Pesquisar produtos ou mercados..."
            containerStyle={styles.searchBar}
          />
        <View style={styles.notificationButton}>
          <Icon type="MaterialCommunityIcons" name="bell-outline" size={22} color={theme.colors.primary} />
          {notificationCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notificationCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
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
                      <Icon
                        type="MaterialCommunityIcons"
                        name="heart-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>

                    <Text style={styles.productSeller}>
                      Vendido por {product.storeName ?? "não informado"}
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
          <Text style={styles.sectionTitle}>Mercados em destaque:</Text>
          {storesToShow.length ? (
            storesToShow.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => handleStorePress(store.id)}
                activeOpacity={0.85}
              >
                <View style={styles.storeLogoWrapper}>
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.storeLogo} resizeMode="cover" />
                  ) : (
                    <View style={styles.logoFallback}>
                      <Text style={styles.logoFallbackText}>{store.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.storeContent}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <View style={styles.storeMetaRow}>
                    <Icon
                      type="MaterialCommunityIcons"
                      name="star"
                      size={16}
                      color={theme.colors.star}
                    />
                    <Text style={styles.storeRating}>
                      {store.rating !== null ? store.rating.toFixed(1).replace(".", ",") : "--"}
                    </Text>
                    <Text style={styles.storeDot}>•</Text>
                    <Text style={styles.storeCategory}>{store.category ?? "Mercado"}</Text>
                    {store.distanceLabel ? (
                      <>
                        <Text style={styles.storeDot}>•</Text>
                        <Text style={styles.storeDistance}>{store.distanceLabel}</Text>
                      </>
                    ) : null}
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
            ))
          ) : (
            <Text style={styles.emptyText}>
              Ainda não temos mercados em destaque para exibir.
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
