import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchBar from "@/src/components/common/SearchBar";
import { useSession } from "@/src/providers/SessionContext/Index";
import productService from "@/src/services/products-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import createStyles from "./styled";

type LocalSearchParams = {
  storeId?: string;
  storeName?: string;
  onlyPromotion?: string;
};

type RawProduct = Record<string, unknown> & { id?: string };

type Product = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number | null;
  originalPrice: number | null;
  unit?: string | null;
  code?: string | null;
  category?: string | null;
  inPromotion: boolean;
};

const parseCurrencyValue = (value: unknown): number | null => {
  const ensurePositive = (numeric: number | null): number | null => {
    if (typeof numeric !== "number") return null;
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  if (typeof value === "number") {
    return ensurePositive(value);
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!normalized || normalized === "-" || normalized === ".") {
      return null;
    }
    const parsed = Number(normalized);
    return ensurePositive(Number.isNaN(parsed) ? null : parsed);
  }

  return null;
};

const pickFirstValue = (source: RawProduct, keys: string[]): unknown => {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
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

const PROMOTION_FLAG_KEYS = [
  "in_promotion",
  "inPromotion",
  "has_promotion",
  "hasPromotion",
  "is_promotion",
  "isPromotion",
  "promotion_active",
  "promotionActive",
] as const;

const mapRawProduct = (rawProduct: RawProduct): Product | null => {
  const identifier = rawProduct.id ?? pickFirstValue(rawProduct, ["uuid", "product_id"]);
  if (!identifier) {
    return null;
  }

  const nameRaw = pickFirstValue(rawProduct, ["name", "title", "product_name"]);
  const descriptionRaw = pickFirstValue(rawProduct, ["description", "short_description"]);
  const imageRaw = pickFirstValue(rawProduct, [
    "image_url",
    "image",
    "main_image_url",
    "thumbnail",
  ]);
  const unitRaw = pickFirstValue(rawProduct, ["unit", "unit_label", "measure_unit"]);
  const codeRaw = pickFirstValue(rawProduct, ["code", "sku", "ean", "ean13", "barcode"]);
  const categoryRaw = pickFirstValue(rawProduct, [
    "category",
    "category_name",
    "department",
    "section",
    "segment",
  ]);

  const currentPriceRaw = pickFirstValue(rawProduct, [
    "promotional_price",
    "promo_price",
    "price_promotion",
    "promotion_price",
    "sale_price",
    "discount_price",
    "current_price",
    "price",
  ]);

  const basePriceRaw = pickFirstValue(rawProduct, [
    "original_price",
    "price_from",
    "price_before",
    "price_without_discount",
    "regular_price",
    "list_price",
    "base_price",
    "compare_at_price",
    "unit_price",
    "price",
  ]);

  const promotionalPriceRaw = pickFirstValue(rawProduct, [
    "promotional_price",
    "promo_price",
    "price_promotion",
    "promotion_price",
    "sale_price",
    "discount_price",
    "current_price",
    "price",
  ]);

  const originalPriceRaw = pickFirstValue(rawProduct, [
    "original_price",
    "price_from",
    "price_before",
    "price_without_discount",
    "regular_price",
    "list_price",
    "base_price",
    "compare_at_price",
    "unit_price",
  ]);

  const basePrice = parseCurrencyValue(basePriceRaw);
  const promotionalPrice = parseCurrencyValue(currentPriceRaw ?? promotionalPriceRaw);
  const originalPriceCandidate = parseCurrencyValue(originalPriceRaw);
  const explicitPromotion = parseBooleanValue(
    pickFirstValue(rawProduct, Array.from(PROMOTION_FLAG_KEYS)) ?? false
  );

  let price: number | null = promotionalPrice ?? basePrice ?? null;
  let originalPrice: number | null = null;
  let inPromotion = explicitPromotion;

  if (explicitPromotion) {
    const referencePrice = originalPriceCandidate ?? basePrice ?? promotionalPrice ?? price;

    if (promotionalPrice !== null) {
      price = promotionalPrice;
      if (referencePrice !== null && promotionalPrice < referencePrice) {
        originalPrice = referencePrice;
      }
    } else if (
      originalPriceCandidate !== null &&
      basePrice !== null &&
      basePrice < originalPriceCandidate
    ) {
      price = basePrice;
      originalPrice = originalPriceCandidate;
    } else if (
      referencePrice !== null &&
      price !== null &&
      price < referencePrice
    ) {
      originalPrice = referencePrice;
    }
  } else {
    // Ensure we still have a price fallback even when only the original price is provided.
    if (price === null) {
      price = originalPriceCandidate ?? basePrice ?? null;
    }
    originalPrice = null;
    inPromotion = false;
  }

  return {
    id: String(identifier),
    name: typeof nameRaw === "string" && nameRaw.trim().length ? nameRaw : "Produto",
    description: typeof descriptionRaw === "string" ? descriptionRaw : null,
    imageUrl: typeof imageRaw === "string" ? imageRaw : null,
    price,
    originalPrice,
    unit: typeof unitRaw === "string" ? unitRaw : null,
    code: typeof codeRaw === "string" ? codeRaw : typeof codeRaw === "number" ? String(codeRaw) : null,
    category: typeof categoryRaw === "string" ? categoryRaw : null,
    inPromotion,
  };
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
    if (!entry || typeof entry !== "object") continue;
    for (const key of PRODUCT_IMAGE_URL_KEYS) {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }

  return null;
};

const FILTER_CATEGORIES = [
  "Padaria",
  "Açougue",
  "Hortifruti",
  "Não Perecíveis",
  "Laticínios e Frios",
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
};

const NON_OUTROS_CATEGORIES: FilterCategory[] = FILTER_CATEGORIES.filter(
  (category) => category !== "Outros"
) as FilterCategory[];

const createDefaultFilters = (): Filters => ({
  onlyPromotion: false,
  categories: [],
  minPrice: null,
  maxPrice: null,
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

const extractFavoriteProductId = (row: Record<string, unknown>): string | null => {
  for (const key of FAVORITE_PRODUCT_ID_KEYS) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  const fallbackId = row?.id;
  if (typeof fallbackId === "string" && fallbackId.trim().length) {
    return fallbackId.trim();
  }

  return null;
};

export default function StoreProductsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const { session, getProductsByStoreId, getImageProduct } = useSession();
  const userId = session?.user?.id ?? null;
  const { storeId, storeName, onlyPromotion } = useLocalSearchParams<LocalSearchParams>();
  const animationLoading = useRef<LottieView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(() => {
    const baseFilters = createDefaultFilters();
    if (onlyPromotion && ["true", "1"].includes(String(onlyPromotion).toLowerCase())) {
      return {
        ...baseFilters,
        onlyPromotion: true,
      };
    }
    return baseFilters;
  });
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [draftOnlyPromotion, setDraftOnlyPromotion] = useState(
    Boolean(onlyPromotion && ["true", "1"].includes(String(onlyPromotion).toLowerCase()))
  );
  const [draftCategories, setDraftCategories] = useState<FilterCategory[]>([]);
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [favoriteProductIds, setFavoriteProductIds] = useState<Record<string, boolean>>({});

  const syncFavoriteProducts = useCallback(async () => {
    if (!userId) {
      setFavoriteProductIds({});
      return;
    }

    try {
      const { data, error } = await productService.getFavoriteProductsByProfile(userId);
      if (error) {
        console.warn("StoreProductsScreen: falha ao buscar produtos favoritos:", error);
        return;
      }

      const entries = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
      const nextFavorites: Record<string, boolean> = {};

      for (const entry of entries) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        const productId = extractFavoriteProductId(entry);
        if (productId) {
          nextFavorites[productId] = true;
        }
      }

      setFavoriteProductIds(nextFavorites);
    } catch (error) {
      console.error("StoreProductsScreen: erro inesperado ao carregar favoritos:", error);
    }
  }, [userId]);

  const loadProducts = useCallback(async () => {
    if (!storeId) {
      setHasError("Loja nao informada.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(null);

      const { data, error } = await getProductsByStoreId(String(storeId));
      if (error) {
        throw error;
      }

      const mappedProducts =
        Array.isArray(data) ?
          data
            .map((item) => mapRawProduct((item ?? {}) as RawProduct))
            .filter((item): item is Product => item !== null) :
          [];

      if (mappedProducts.length === 0) {
        setProducts([]);
        return;
      }

      const productsWithImages = await Promise.all(
        mappedProducts.map(async (product) => {
          try {
            const { data: images, error: imageError } = await getImageProduct(product.id);
            if (imageError) {
              console.error(
                "StoreProductsScreen: erro ao buscar imagem do produto",
                imageError
              );
              return product;
            }

            const imageUrlFromService = extractFirstImageUrl(images);
            if (imageUrlFromService) {
              return { ...product, imageUrl: imageUrlFromService };
            }

            return product;
          } catch (imageFetchError) {
            console.error(
              "StoreProductsScreen: erro inesperado ao buscar imagem do produto",
              imageFetchError
            );
            return product;
          }
        })
      );

      setProducts(productsWithImages);
    } catch (error) {
      console.error("StoreProductsScreen: error fetching products", error);
      setHasError("Nao foi possivel carregar os produtos da loja.");
    } finally {
      setIsLoading(false);
    }
  }, [getProductsByStoreId, getImageProduct, storeId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    syncFavoriteProducts();
  }, [syncFavoriteProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.description ?? "",
        product.unit ?? "",
        product.code ?? "",
        product.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !hasSearch || haystack.includes(normalizedSearch);

      const priceValue = product.price ?? product.originalPrice;
      const hasDiscount =
        product.originalPrice !== null &&
        product.price !== null &&
        product.originalPrice > product.price;

      const isPromotional = product.inPromotion || hasDiscount;

      const matchesPromotion = !filters.onlyPromotion || isPromotional;

      const matchesCategory =
        filters.categories.length === 0
          ? true
          : filters.categories.some((category) => {
              if (category === "Outros") {
                const matchesKnownCategory = NON_OUTROS_CATEGORIES.some((knownCategory) =>
                  isSameCategory(product.category, knownCategory)
                );
                return !matchesKnownCategory;
              }
              return isSameCategory(product.category, category);
            });

      const matchesMin =
        filters.minPrice === null
          ? true
          : priceValue !== null && priceValue >= filters.minPrice;

      const matchesMax =
        filters.maxPrice === null
          ? true
          : priceValue !== null && priceValue <= filters.maxPrice;

      return matchesSearch && matchesPromotion && matchesCategory && matchesMin && matchesMax;
    });
  }, [products, searchTerm, filters]);

  const hasActiveFilters =
    filters.onlyPromotion ||
    filters.categories.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;

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

  const handleFilterButtonPress = () => {
    setDraftOnlyPromotion(filters.onlyPromotion);
    setDraftCategories([...filters.categories]);
    setDraftMinPrice(formatCurrencyFromNumber(filters.minPrice));
    setDraftMaxPrice(formatCurrencyFromNumber(filters.maxPrice));
    setIsFilterModalVisible(true);
  };

  const handleCancelFilters = () => {
    setIsFilterModalVisible(false);
  };

  const handleApplyFilters = () => {
    const minPriceValue = parseCurrencyInput(draftMinPrice);
    const maxPriceValue = parseCurrencyInput(draftMaxPrice);

    let nextMinPrice = minPriceValue;
    let nextMaxPrice = maxPriceValue;

    if (
      nextMinPrice !== null &&
      nextMaxPrice !== null &&
      nextMinPrice > nextMaxPrice
    ) {
      Alert.alert(
        "Filtro invalido",
        "O valor minimo nao pode ser maior que o valor maximo."
      );
      return;
    }

    setFilters({
      onlyPromotion: draftOnlyPromotion,
      categories: [...draftCategories],
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
    });
    setIsFilterModalVisible(false);
  };
  const handleClearFilters = () => {
    setFilters(createDefaultFilters());
  };

  const handleRemoveCategoryFilter = (category: FilterCategory) => {
    setFilters((current) => ({
      ...current,
      categories: current.categories.filter((item) => item !== category),
    }));
  };

  const handleRemovePromotionFilter = () => {
    setFilters((current) => ({
      ...current,
      onlyPromotion: false,
    }));
  };

  const handleRemovePriceFilter = () => {
    setFilters((current) => ({
      ...current,
      minPrice: null,
      maxPrice: null,
    }));
  };

  const toggleDraftCategory = (category: FilterCategory) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const handleDraftMinPriceChange = (value: string) => {
    setDraftMinPrice(formatCurrencyInput(value));
  };

  const handleDraftMaxPriceChange = (value: string) => {
    setDraftMaxPrice(formatCurrencyInput(value));
  };

  const priceKeyboardType = Platform.OS === "ios" ? "number-pad" : "numeric";

  const toggleFavoriteProduct = useCallback(
    async (productId: string) => {
      if (!productId) {
        return;
      }

      if (!userId) {
        Alert.alert("Conta necessaria", "Entre na sua conta para favoritar produtos.");
        return;
      }

      let nextValue = false;

      setFavoriteProductIds((current) => {
        const currentValue = Boolean(current[productId]);
        nextValue = !currentValue;
        return {
          ...current,
          [productId]: nextValue,
        };
      });

      try {
        if (nextValue) {
          const { error } = await productService.addProductToFavorites(userId, productId);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await productService.removeProductFromFavorites(userId, productId);
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error("StoreProductsScreen: erro ao atualizar favorito do produto:", error);
        setFavoriteProductIds((current) => ({
          ...current,
          [productId]: !nextValue,
        }));
      }
    },
    [userId]
  );

  const renderProduct = ({ item }: ListRenderItemInfo<Product>) => {
    const showDiscount =
      item.originalPrice !== null &&
      item.price !== null &&
      item.originalPrice > item.price;
    const navigateToProduct = () => {
      router.push({
        pathname: "/(auth)/store/products_store/[id_product]",
        params: { id_product: item.id },
      });
    };

    const isFavorite = Boolean(favoriteProductIds[item.id]);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={navigateToProduct}
        activeOpacity={0.7}
      >
        <View style={styles.productImageWrapper}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productFallbackImage}>
              <Icon
                type="MaterialCommunityIcons"
                name="package-variant-closed"
                size={32}
                color={theme.colors.disabled}
              />
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productInfoHeader}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>

            <TouchableOpacity
              onPress={() => toggleFavoriteProduct(item.id)}
              style={styles.productFavoriteButton}
              accessibilityRole="button"
              accessibilityLabel={`${
                isFavorite ? "Remover" : "Adicionar"
              } ${item.name} aos favoritos`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {showDiscount ? (
            <Text style={styles.productOriginalPrice}>
              De {currencyFormatter.format(item.originalPrice ?? 0)}
            </Text>
          ) : null}

          {item.price !== null ? (
            <Text style={styles.productPrice}>
              Por {currencyFormatter.format(item.price)}
              {item.unit ? <Text style={styles.productUnit}> {item.unit}</Text> : null}
            </Text>
          ) : (
            <Text style={styles.productPriceUnavailable}>Preço não informado</Text>
          )}

          {item.code ? (
            <Text style={styles.productCode}>Cód: {item.code}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const listEmptyComponent = () => {
    if (isLoading) return null;
    if (hasError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{hasError}</Text>
          <TouchableOpacity
            onPress={loadProducts}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const hasSearch = searchTerm.trim().length > 0;

    if (hasSearch || hasActiveFilters) {
      const message = hasSearch && hasActiveFilters
        ? "Nao encontramos produtos para a busca e filtros selecionados."
        : hasSearch
        ? "Nao encontramos produtos para a sua busca."
        : "Nao encontramos produtos para os filtros selecionados.";
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{message}</Text>
          {hasActiveFilters ? (
            <TouchableOpacity
              onPress={handleClearFilters}
              style={styles.retryButton}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Limpar filtros</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Nao encontramos produtos para esta loja.</Text>
      </View>
    );
  };

  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <View style={styles.searchSection}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Pesquisar..."
          containerStyle={styles.searchBar}
        />
      </View>

      <View style={styles.filtersSection}>
        <View style={styles.filterActionsRow}>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.7}
            onPress={handleFilterButtonPress}
          >
            <Icon
              type="feather"
              name="sliders"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {hasActiveFilters ? (
            <View style={styles.clearFiltersWrapper}>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={styles.clearFiltersButton}
                activeOpacity={0.7}
              >
                <Icon
                  type="MaterialCommunityIcons"
                  name="broom"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.clearFiltersText}>Limpar filtros</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {hasActiveFilters ? (
          <View style={styles.filterChipsWrapper}>
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

      {isLoading ? (
        <View style={styles.loadingWrapper}>
           <LoadingIcon
              autoPlay
              loop
              // source={loadingCart}
              refAnimationLoading={animationLoading}
              style={{ width: 150, height: 150 }}
            />
        </View>
      ) : null}
    </View>
  ), [
    filters.categories,
    filters.onlyPromotion,
    hasActiveFilters,
    handleClearFilters,
    handleFilterButtonPress,
    handleRemoveCategoryFilter,
    handleRemovePriceFilter,
    handleRemovePromotionFilter,
    isLoading,
    priceRangeLabel,
    searchTerm,
    styles,
    theme.colors.onPrimary,
    theme.colors.primary,
  ]);

  const resolvedTitle =
    storeName && typeof storeName === "string" && storeName.trim().length
      ? `Catálogo de Produtos de ${storeName}`
      : "Produtos da loja";

  return (
    <>
      <ScreenContainer style={styles.container}>
        <HeaderScreen title={resolvedTitle} showButtonBack styleTitle={{ textAlign: "center" }} />
        <View style={styles.content}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            extraData={favoriteProductIds}
            style={styles.productsList}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={listEmptyComponent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
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
                <Text style={styles.filterSectionTitle}>Categorias</Text>

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
                <Text style={styles.filterSectionTitle}>Filtro por preco</Text>
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

                  <View
                    style={[styles.priceInputWrapper, styles.priceInputWrapperLast]}
                  >
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
                  <Text style={styles.applyFiltersText}>Aplicar Filtros</Text>
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
    </>
  );
}



