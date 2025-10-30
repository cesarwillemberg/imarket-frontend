import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import productService from "@/src/services/products-service";
import storeService from "@/src/services/store-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

type LocalSearchParams = {
  id_produto?: string | string[];
};

type RawProduct = Record<string, unknown> & { id?: string };
type RawProductImage = Record<string, unknown> & { id?: string };

type Product = {
  id: string;
  name: string;
  storeId: string | null;
  description: string | null;
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

const pickFirstValue = (source: RawProduct | RawProductImage, keys: readonly string[]) => {
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

const mapProduct = (raw: RawProduct): Product | null => {
  const identifier =
    raw.id ??
    pickFirstValue(raw, [
      "product_id",
      "uuid",
      "id_product",
      "id_produto",
    ]);

  if (!identifier) {
    return null;
  }

  const nameRaw = pickFirstValue(raw, ["name", "title", "product_name"]);
  const descriptionRaw = pickFirstValue(raw, ["description", "details", "short_description"]);
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

  const basePrice = parseCurrencyValue(basePriceRaw);
  const promotionalPrice = parseCurrencyValue(promotionalPriceRaw);
  const originalPriceCandidate = parseCurrencyValue(originalPriceRaw);

  const explicitPromotionFlag = parseBooleanValue(
    pickFirstValue(raw, PROMOTION_FLAG_KEYS) ?? false
  );

  // Robust price mapping to avoid 0,00 on non-promotional items
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
    // Promotion flagged with base as discounted and original as list price
    price = basePrice;
    originalPrice = originalPriceCandidate > basePrice ? originalPriceCandidate : null;
    inPromotion = originalPrice !== null;
  } else {
    // No valid promotion; choose best available positive price
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
      typeof nameRaw === "string" && nameRaw.trim().length
        ? nameRaw
        : "Produto",
    description:
      typeof descriptionRaw === "string" && descriptionRaw.trim().length
        ? descriptionRaw
        : null,
    storeId,
    storeName,
    unit:
      typeof unitRaw === "string" && unitRaw.trim().length
        ? unitRaw
        : null,
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
      typeof imageRaw === "string" && imageRaw.trim().length
        ? imageRaw
        : null,
  };
};

const resolveImageUrl = (raw: RawProductImage): string | null => {
  for (const key of PRODUCT_IMAGE_URL_KEYS) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length) {
      return value;
    }
  }
  const urlNested = raw["image"];
  if (typeof urlNested === "string" && urlNested.trim().length) {
    return urlNested;
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

export default function ProductDetails() {
  const { id_produto } = useLocalSearchParams<LocalSearchParams>();
  const productId = useMemo(() => {
    if (Array.isArray(id_produto)) {
      return id_produto[0] ?? null;
    }
    return id_produto ?? null;
  }, [id_produto]);

  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const resolveImages = useCallback(
    (imageRows: RawProductImage[] | null | undefined, fallbackImage: string | null) => {
      const parsed =
        imageRows?.reduce<string[]>((accumulator, item) => {
          const url = resolveImageUrl(item);
          if (url && !accumulator.includes(url)) {
            accumulator.push(url);
          }
          return accumulator;
        }, []) ?? [];

      if (!parsed.length && fallbackImage) {
        return [fallbackImage];
      }

      if (fallbackImage && parsed.length && !parsed.includes(fallbackImage)) {
        return [fallbackImage, ...parsed];
      }

      return parsed;
    },
    []
  );

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setImages([]);
      setError("Produto nao encontrado.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: productData, error: productError } =
        await productService.getProductById(String(productId));

      if (productError || !productData) {
        setError("Nao foi possivel carregar os dados do produto.");
        setProduct(null);
        setImages([]);
        return;
      }

      const mappedProduct = mapProduct(productData as RawProduct);

      if (!mappedProduct) {
        setError("Informacoes do produto invalidas.");
        setProduct(null);
        setImages([]);
        return;
      }

      let finalProduct =
        mappedProduct.storeName &&
        mappedProduct.storeId &&
        mappedProduct.storeName === mappedProduct.storeId
          ? { ...mappedProduct, storeName: null }
          : mappedProduct;

      if (mappedProduct.storeId) {
        try {
          const { data: storeData, error: storeError } = await storeService.getStoreById(
            mappedProduct.storeId
          );

          if (storeError) {
            console.warn("ProductDetails: falha ao carregar loja", storeError);
          }

          const resolvedStoreName = extractStoreName(
            (storeData as Record<string, unknown> | null) ?? null
          );

          if (resolvedStoreName) {
            finalProduct = {
              ...finalProduct,
              storeName: resolvedStoreName,
            };
          }
        } catch (storeFetchError) {
          console.warn("ProductDetails: erro ao buscar loja", storeFetchError);
        }
      }

      const { data: imagesData, error: imagesError } =
        await productService.getImageProduct(mappedProduct.id);

      if (imagesError) {
        console.warn("ProductDetails: falha ao carregar imagens", imagesError);
      }

      const resolvedImages = resolveImages(
        (imagesData as RawProductImage[]) ?? [],
        finalProduct.imageUrl
      );

      setProduct(finalProduct);
      setImages(resolvedImages);
      setActiveImage(0);
    } catch (caughtError) {
      console.error("ProductDetails: erro ao carregar produto", caughtError);
      setError("Ocorreu um erro ao carregar o produto.");
      setProduct(null);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, resolveImages]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[Math.min(activeImage, images.length - 1)] : null;

  const showDiscount = Boolean(
    product?.inPromotion && product.price !== null && product.originalPrice !== null
  );

  const handlePrevImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) => (current + 1) % images.length);
  };

  const incrementQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const decrementQuantity = () => {
    setQuantity((current) => {
      if (current <= 1) {
        return 1;
      }
      return current - 1;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    Alert.alert(
      "Adicionar ao carrinho",
      `${quantity} unidade(s) de ${product.name} adicionadas ao carrinho.`
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    Alert.alert("Comprar Agora", "Fluxo de compra ainda nao implementado.");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.feedbackWrapper}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.feedbackText}>Carregando produto...</Text>
        </View>
      );
    }

    if (error || !product) {
      return (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>{error ?? "Produto nao encontrado."}</Text>
          <TouchableOpacity onPress={loadProduct} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageCarousel}>
          <TouchableOpacity
            onPress={handlePrevImage}
            style={[styles.arrowButton, images.length < 2 && styles.arrowButtonDisabled]}
            activeOpacity={0.7}
            disabled={images.length < 2}
          >
            <Icon
              type="MaterialCommunityIcons"
              name="chevron-left"
              size={26}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.imageCard}>
            {currentImage ? (
              <Image
                source={{ uri: currentImage }}
                resizeMode="contain"
                style={styles.productImage}
              />
            ) : (
              <View style={styles.productFallbackImage}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="package-variant-closed"
                  size={48}
                  color={theme.colors.disabled}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleNextImage}
            style={[styles.arrowButton, images.length < 2 && styles.arrowButtonDisabled]}
            activeOpacity={0.7}
            disabled={images.length < 2}
          >
            <Icon
              type="MaterialCommunityIcons"
              name="chevron-right"
              size={26}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {images.length > 1 ? (
          <View style={styles.dotsWrapper}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={`${product.id}-${index}`}
                onPress={() => setActiveImage(index)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Ir para imagem ${index + 1}`}
              >
                <View
                  style={[
                    styles.dot,
                    index === activeImage ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.informationSection}>
          <Text style={styles.productName}>{product.name}</Text>

          {showDiscount ? (
            <Text style={styles.productOriginalPrice}>
              De {currencyFormatter.format(product.originalPrice ?? 0)}
            </Text>
          ) : null}

          {product.price !== null ? (
            <Text style={styles.productPrice}>
              Por {currencyFormatter.format(product.price)}
              {product.unit ? <Text style={styles.productUnit}> {product.unit}</Text> : null}
            </Text>
          ) : (
            <Text style={styles.productUnavailable}>Preco nao informado</Text>
          )}

          <View style={styles.metaInfo}>
            <Text style={styles.metaInfoText}>
              <Text style={styles.metaInfoLabel}>Vendido Por:</Text>{" "}
              {product.storeName ?? "Nao informado"}
            </Text>
            {product.code ? (
              <Text style={styles.metaInfoText}>Cod: {product.code}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantidade</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={decrementQuantity}
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name="minus"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <Text style={styles.quantityValue}>{quantity}</Text>

            <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton} activeOpacity={0.7}>
              <Icon
                type="MaterialCommunityIcons"
                name="plus"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.addToCartButton}
            activeOpacity={0.8}
          >
            <Icon
              type="MaterialCommunityIcons"
              name="cart-plus"
              size={20}
              color={theme.colors.onPrimary}
            />
            <Text style={styles.addToCartText}>Adicionar ao carrinho</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBuyNow}
            style={styles.buyNowButton}
            activeOpacity={0.8}
          >
            <Text style={styles.buyNowText}>Comprar Agora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Sobre</Text>
          <Text style={styles.descriptionText}>
            {product.description ?? "Este produto ainda nao possui descricao cadastrada."}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <HeaderScreen title="Detalhes do produto" showButtonBack />
      {renderContent()}
    </ScreenContainer>
  );
}
