import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchBar from "@/src/components/common/SearchBar";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  View,
} from "react-native";
import createStyles from "./styled";

type LocalSearchParams = {
  storeId?: string;
  storeName?: string;
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
};

const parseCurrencyValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
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
    "sale_price",
    "promotional_price",
    "promo_price",
    "current_price",
    "price",
  ]);

  const basePriceRaw = pickFirstValue(rawProduct, [
    "regular_price",
    "original_price",
    "list_price",
    "price_from",
    "price_before",
  ]);

  const currentPrice = parseCurrencyValue(currentPriceRaw ?? basePriceRaw);
  const basePrice = parseCurrencyValue(basePriceRaw);

  return {
    id: String(identifier),
    name: typeof nameRaw === "string" && nameRaw.trim().length ? nameRaw : "Produto",
    description: typeof descriptionRaw === "string" ? descriptionRaw : null,
    imageUrl: typeof imageRaw === "string" ? imageRaw : null,
    price: currentPrice,
    originalPrice: basePrice,
    unit: typeof unitRaw === "string" ? unitRaw : null,
    code: typeof codeRaw === "string" ? codeRaw : typeof codeRaw === "number" ? String(codeRaw) : null,
    category: typeof categoryRaw === "string" ? categoryRaw : null,
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

export default function StoreProductsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const { getProductsByStoreId, getImageProduct } = useSession();
  const { storeId, storeName } = useLocalSearchParams<LocalSearchParams>();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [draftOnlyPromotion, setDraftOnlyPromotion] = useState(false);
  const [draftCategories, setDraftCategories] = useState<FilterCategory[]>([]);
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");

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
      const isPromotional =
        product.originalPrice !== null &&
        product.price !== null &&
        product.originalPrice > product.price;

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
      return `${currencyFormatter.format(filters.minPrice)} - ${currencyFormatter.format(filters.maxPrice)}`;
    }
    if (filters.minPrice !== null) {
      return `A partir de ${currencyFormatter.format(filters.minPrice)}`;
    }
    if (filters.maxPrice !== null) {
      return `Ate ${currencyFormatter.format(filters.maxPrice)}`;
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
      const temp = nextMinPrice;
      nextMinPrice = nextMaxPrice;
      nextMaxPrice = temp;
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

    return (
      <View style={styles.productCard}>
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
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

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
            <Text style={styles.productPriceUnavailable}>Preco nao informado</Text>
          )}

          {item.code ? (
            <Text style={styles.productCode}>Cod: {item.code}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={navigateToProduct}
          style={styles.productLink}
          activeOpacity={0.7}
        >
          <Text style={styles.productLinkText}>Ver Produto</Text>
        </TouchableOpacity>
      </View>
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

  const resolvedTitle =
    storeName && typeof storeName === "string" && storeName.trim().length
      ? `Produtos de ${storeName}`
      : "Produtos da loja";

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (filters.onlyPromotion) count += 1;

    count += filters.categories.length;

    if (filters.minPrice !== null || filters.maxPrice !== null) {
      count += 1; // trata o intervalo de preço como um filtro
    }

    return count;
  }, [filters]);


  return (
    <>
      <ScreenContainer style={styles.container}>
        <HeaderScreen title={resolvedTitle} showButtonBack />
        <View style={styles.content}>
          <View style={styles.searchSection}>
            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar por nome ou codigo..."
              containerStyle={styles.searchBar}
            />
          </View>
          <View style={styles.filtersSection}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={handleFilterButtonPress}
            >
              <Icon
                type="feather"
                name="sliders"
                size={20}
                color={hasActiveFilters ? theme.colors.onPrimary : theme.colors.primary}
              />
            </TouchableOpacity>
            {
              hasActiveFilters ? (
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
              ) : (null)
            }

          </View>
          {hasActiveFilters ? (
            <View style={styles.activeFiltersContainer}>
              {filters.onlyPromotion ? (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={handleRemovePromotionFilter}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>Em Promoção</Text>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.onPrimary}
                  />
                </TouchableOpacity>
              ) : null}

              {filters.categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.filterChip}
                  onPress={() => handleRemoveCategoryFilter(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>{category}</Text>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.onPrimary}
                  />
                </TouchableOpacity>
              ))}

              {priceRangeLabel ? (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={handleRemovePriceFilter}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>{priceRangeLabel}</Text>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="close-circle"
                    size={16}
                    color={theme.colors.onPrimary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}


          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            style={styles.productsList}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={listEmptyComponent}
            showsVerticalScrollIndicator={false}
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
                    <Text style={styles.priceInputLabel}>Ate:</Text>
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
