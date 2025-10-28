import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchBar from "@/src/components/common/SearchBar";
import productService from "@/src/services/products-service";
import storeService from "@/src/services/store-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

type RawProduct = Record<string, unknown> & { id?: string };
type RawProductImage = Record<string, unknown> & { id?: string };

type ProductListItem = {
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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const pickFirstValue = (source: RawProduct | RawProductImage, keys: readonly string[]) => {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
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

  let price: number | null = promotionalPrice ?? basePrice ?? null;
  let originalPrice: number | null = null;
  let inPromotion = explicitPromotionFlag;

  if (promotionalPrice !== null) {
    const referencePrice = originalPriceCandidate ?? basePrice ?? promotionalPrice;
    if (promotionalPrice < referencePrice) {
      originalPrice = referencePrice;
      price = promotionalPrice;
      inPromotion = true;
    } else if (explicitPromotionFlag && referencePrice !== promotionalPrice) {
      originalPrice = referencePrice;
      price = promotionalPrice;
      inPromotion = true;
    } else {
      price = promotionalPrice;
    }
  } else if (explicitPromotionFlag && originalPriceCandidate !== null && basePrice !== null) {
    price = basePrice;
    originalPrice = originalPriceCandidate;
    inPromotion = true;
  } else {
    price = basePrice ?? originalPriceCandidate ?? null;
    originalPrice = null;
    inPromotion = false;
  }

  return {
    id: String(identifier),
    name:
      typeof nameRaw === "string" && nameRaw.trim().length ? nameRaw : "Produto",
    storeId,
    storeName,
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

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const storeCache = useMemo(() => new Map<string, string | null>(), []);

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
      setIsRefreshing(false);
    }
  }, [fetchProductImage, fetchStoreName]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProducts({ silent: true });
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const needle = searchTerm.toLowerCase();
    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(needle);
      const codeMatch = product.code?.toLowerCase().includes(needle);
      const storeMatch = product.storeName?.toLowerCase().includes(needle);
      return Boolean(nameMatch || codeMatch || storeMatch);
    });
  }, [products, searchTerm]);

  const renderProductItem = useCallback(
    ({ item }: { item: ProductListItem }) => {
      const formattedPrice =
        item.price !== null ? currencyFormatter.format(item.price) : null;
      const formattedOriginalPrice =
        item.originalPrice !== null ? currencyFormatter.format(item.originalPrice) : null;
      const unitLabel = item.unit ? ` ${item.unit}` : "";

      const handleNavigate = () => {
        router.push({
          pathname: "/(auth)/products/[id_produto]",
          params: { id_produto: item.id },
        });
      };

        return (
          <TouchableOpacity style={styles.card} onPress={handleNavigate} activeOpacity={0.7}>
            <View style={styles.cardImageWrapper}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.cardImageFallback}>
                <Icon type="MaterialCommunityIcons" name="image-off" size={32} color={theme.colors.disabled} />
              </View>
            )}
          </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>

              <Text style={styles.cardStore}>
                Mercado: {item.storeName ?? "Nao informado"}
              </Text>

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
      [router, styles, theme.colors.disabled]
    );

  const renderList = () => {
    if (isLoading) {
      return (
        <View style={styles.feedbackWrapper}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.feedbackText}>Carregando produtos...</Text>
        </View>
      );
    }

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

    if (!filteredProducts.length) {
      return (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>Nenhum produto encontrado.</Text>
          {products.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>Limpar busca</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
      />
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <HeaderScreen title="Produtos" />

      <View style={styles.searchSection}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar produtos..."
          containerStyle={styles.searchBar}
          inputProps={{ autoCapitalize: "none", autoCorrect: false }}
        />
      </View>
      <View style={styles.filterSection}>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Icon type="feather" name="sliders" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {renderList()}
    </ScreenContainer>
  );
}
