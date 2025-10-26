import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import SearchBar from "@/src/components/common/SearchBar";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Text,
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

export default function StoreProductsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { getProductsByStoreId, getImageProduct } = useSession();
  const { storeId, storeName } = useLocalSearchParams<LocalSearchParams>();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.description ?? "",
        product.unit ?? "",
        product.code ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [products, searchTerm]);

  const renderProduct = ({ item }: ListRenderItemInfo<Product>) => {
    const showDiscount =
      item.originalPrice !== null &&
      item.price !== null &&
      item.originalPrice > item.price;

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

        <TouchableOpacity style={styles.productLink} activeOpacity={0.7}>
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

    if (searchTerm.trim().length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nao encontramos produtos para a sua busca.
          </Text>
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

  return (
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

          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Icon
              type="feather"
              name="sliders"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

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
  );
}
