import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import productService from "@/src/services/products-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

type CartProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  originalPrice?: number | null;
  quantity: number;
  unitLabel: string;
  selected: boolean;
};

type CartStoreGroup = {
  id: string;
  name: string;
  description?: string;
  shippingCost: number;
  selected: boolean;
  products: CartProduct[];
};

type CartItemRecord = Record<string, unknown>;

type CartMutationOptions = {
  skipReload?: boolean;
  onSuccess?: () => void | Promise<void>;
};

const PRODUCT_NAME_KEYS = ["name", "title", "product_name"] as const;
const PRODUCT_UNIT_KEYS = ["unit", "unit_label", "measure_unit"] as const;
const PRODUCT_IMAGE_KEYS = [
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
const PRODUCT_ORIGINAL_PRICE_KEYS = [
  "original_price",
  "price_from",
  "list_price",
  "regular_price",
] as const;
const PRODUCT_PROMOTIONAL_PRICE_KEYS = [
  "promotional_price",
  "promo_price",
  "sale_price",
  "discount_price",
  "price_with_discount",
  "promotion_price",
] as const;
const PRODUCT_PRICE_KEYS = [
  "price",
  "unit_price",
  "base_price",
  "current_price",
  "valor",
  "value",
] as const;
const PRODUCT_PROMOTION_FLAG_KEYS = [
  "in_promotion",
  "inPromotion",
  "has_promotion",
  "hasPromotion",
  "is_promotion",
  "isPromotion",
] as const;

const STORE_NAME_KEYS = [
  "name",
  "store_name",
  "storeName",
  "fantasy_name",
  "fantasyName",
] as const;
const STORE_DESCRIPTION_KEYS = [
  "description",
  "store_description",
  "official_description",
  "subtitle",
] as const;
const STORE_SHIPPING_KEYS = [
  "shipping_cost",
  "shippingCost",
  "delivery_fee",
  "deliveryFee",
  "frete",
  "frete_valor",
  "freteValor",
  "shipping_value",
] as const;

const buildSelectionKey = (storeId: string, productId: string) => `${storeId}::${productId}`;

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.,-]/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const extractStringValue = (
  source: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string | null => {
  if (!source || typeof source !== "object") {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
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

const resolveImageUrl = (source: Record<string, unknown> | null | undefined): string | null => {
  if (!source || typeof source !== "object") {
    return null;
  }

  const explicitCartImage = source["cart_image_url"];
  if (typeof explicitCartImage === "string" && explicitCartImage.trim().length > 0) {
    return explicitCartImage;
  }

  for (const key of PRODUCT_IMAGE_KEYS) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const nestedImage = source["image"];
  if (typeof nestedImage === "string" && nestedImage.trim().length > 0) {
    return nestedImage;
  }

  return null;
};

const resolveStoreShippingCost = (storeData: Record<string, unknown> | null | undefined): number => {
  if (!storeData || typeof storeData !== "object") {
    return 0;
  }

  for (const key of STORE_SHIPPING_KEYS) {
    if (key in storeData) {
      const extracted = parseNumericValue(storeData[key]);
      if (typeof extracted === "number") {
        return extracted;
      }
    }
  }

  return 0;
};

const resolveProductPricing = (
  productData: Record<string, unknown>,
  fallbackUnitPrice: number | null
): { unitPrice: number; originalPrice: number | null } => {
  const extractFirstNumeric = (keys: readonly string[]) => {
    for (const key of keys) {
      const parsed = parseNumericValue(productData[key]);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  };

  const explicitPromotion = PRODUCT_PROMOTION_FLAG_KEYS.some((key) =>
    parseBooleanValue(productData[key])
  );

  const basePrice = extractFirstNumeric(PRODUCT_PRICE_KEYS);
  const promotionalPrice = extractFirstNumeric(PRODUCT_PROMOTIONAL_PRICE_KEYS);
  const originalPriceCandidate = extractFirstNumeric(PRODUCT_ORIGINAL_PRICE_KEYS);
  const fallbackPrice = typeof fallbackUnitPrice === "number" && fallbackUnitPrice > 0 ? fallbackUnitPrice : null;

  const referenceBase = basePrice ?? fallbackPrice ?? null;

  const promoIsValid =
    typeof promotionalPrice === "number" &&
    promotionalPrice > 0 &&
    (explicitPromotion ||
      (typeof referenceBase === "number" && promotionalPrice < referenceBase) ||
      (typeof originalPriceCandidate === "number" && promotionalPrice < originalPriceCandidate));

  let unitPrice: number | null = referenceBase ?? promotionalPrice ?? originalPriceCandidate ?? fallbackPrice ?? null;
  let originalPrice: number | null = null;

  if (promoIsValid) {
    const referencePrice =
      originalPriceCandidate ??
      referenceBase ??
      fallbackPrice ??
      promotionalPrice;
    unitPrice = promotionalPrice;
    originalPrice = referencePrice !== promotionalPrice ? referencePrice : null;
  } else if (explicitPromotion && originalPriceCandidate !== null) {
    const effectiveBase =
      referenceBase ??
      promotionalPrice ??
      fallbackPrice;
    if (typeof effectiveBase === "number" && effectiveBase > 0) {
      unitPrice = effectiveBase;
      originalPrice = originalPriceCandidate > effectiveBase ? originalPriceCandidate : null;
    }
  }

  if (unitPrice === null || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    unitPrice = fallbackPrice ?? referenceBase ?? promotionalPrice ?? originalPriceCandidate ?? 0;
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= unitPrice)) {
    originalPrice = null;
  }

  const safeUnitPrice =
    typeof unitPrice === "number" && Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;

  return {
    unitPrice: safeUnitPrice,
    originalPrice,
  };
};

export default function Cart() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const {
    user,
    getOrCreateActiveCart,
    getCartItemsByCartId,
    setCartItemChecked,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    getStoreById,
  } = useSession();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    []
  );

  const [cartId, setCartId] = useState<string | null>(null);
  const [groups, setGroups] = useState<CartStoreGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const selectedMapRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    selectedMapRef.current = selectedMap;
  }, [selectedMap]);

  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter]
  );

  const loadCart = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!user?.id) {
        setError("Usuário não autenticado.");
        setGroups([]);
        if (!silent) {
          setIsLoading(false);
        }
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
      const { data: cartData, error: cartError } = await getOrCreateActiveCart(user.id);

      if (cartError || !cartData) {
        setError("Não foi possível carregar seu carrinho no momento.");
        setGroups([]);
        return;
      }

      const resolvedCartId =
        (typeof cartData.id === "string" && cartData.id) ||
        (typeof cartData.cart_id === "string" && cartData.cart_id) ||
        (typeof cartData.id_cart === "string" && cartData.id_cart) ||
        (typeof cartData.id === "number" && String(cartData.id)) ||
        (typeof cartData.cart_id === "number" && String(cartData.cart_id)) ||
        (typeof cartData.id_cart === "number" && String(cartData.id_cart)) ||
        null;

      if (!resolvedCartId) {
        setError("Não foi possível identificar seu carrinho.");
        setGroups([]);
        return;
      }

      setCartId(resolvedCartId);

      const { data: rawItems, error: itemsError } = await getCartItemsByCartId(
        resolvedCartId,
        user.id
      );

      if (itemsError) {
        console.error("Cart: erro ao buscar itens do carrinho", itemsError);
        setError("Não foi possível carregar os itens do carrinho.");
        setGroups([]);
        return;
      }

      const items = (Array.isArray(rawItems) ? rawItems : []) as CartItemRecord[];

      if (!items.length) {
        setGroups([]);
        setSelectedMap({});
        return;
      }

      const productIds = Array.from(
        new Set(
          items
            .map((item) => {
              const idValue = item.produto_id ?? item.product_id ?? item.id_product;
              if (typeof idValue === "string" && idValue.trim().length) {
                return idValue.trim();
              }
              if (typeof idValue === "number") {
                return String(idValue);
              }
              return null;
            })
            .filter((value): value is string => Boolean(value))
        )
      );

      const productEntries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const { data, error: productError } = await productService.getProductById(productId);
            if (productError || !data) {
              return [productId, null] as const;
            }

            let imageUrl = resolveImageUrl(data as Record<string, unknown>);

            if (!imageUrl) {
              try {
                const { data: imageData, error: imageError } =
                  await productService.getImageProduct(productId);

                if (!imageError && Array.isArray(imageData)) {
                  const imageRecord = imageData.find(
                    (item) => resolveImageUrl(item as Record<string, unknown>) !== null
                  );
                  const resolved =
                    imageRecord !== undefined
                      ? resolveImageUrl(imageRecord as Record<string, unknown>)
                      : null;
                  if (resolved) {
                    imageUrl = resolved;
                  }
                }
              } catch (imageFetchError) {
                console.error("Cart: erro ao buscar imagem do produto", imageFetchError);
              }
            }

            const augmentedData =
              imageUrl && typeof imageUrl === "string"
                ? { ...(data as Record<string, unknown>), cart_image_url: imageUrl }
                : (data as Record<string, unknown>);

            return [productId, augmentedData] as const;
          } catch (productFetchError) {
            console.error("Cart: erro ao buscar produto", productFetchError);
            return [productId, null] as const;
          }
        })
      );

      const productMap = new Map<string, Record<string, unknown>>(
        productEntries.filter(([, data]) => Boolean(data)) as [string, Record<string, unknown>][]
      );

      const storeIds = Array.from(
        new Set(
          items
            .map((item) => {
              const idValue = item.store_id ?? item.storeId;
              if (typeof idValue === "string" && idValue.trim().length) {
                return idValue.trim();
              }
              if (typeof idValue === "number") {
                return String(idValue);
              }
              return null;
            })
            .filter((value): value is string => Boolean(value))
        )
      );

      const storeEntries = await Promise.all(
        storeIds.map(async (storeId) => {
          try {
            const { data, error: storeError } = await getStoreById(storeId);
            if (storeError || !data) {
              return [storeId, null] as const;
            }
            return [storeId, data] as const;
          } catch (storeFetchError) {
            console.error("Cart: erro ao buscar loja", storeFetchError);
            return [storeId, null] as const;
          }
        })
      );

      const storeMap = new Map<string, Record<string, unknown>>(
        storeEntries.filter(([, data]) => Boolean(data)) as [string, Record<string, unknown>][]
      );

      const previousSelections = selectedMapRef.current ?? {};
      const nextSelections: Record<string, boolean> = {};
      const grouped = new Map<string, CartStoreGroup>();

      items.forEach((item) => {
        const rawStoreId = item.store_id ?? item.storeId;
        const storeId =
          (typeof rawStoreId === "string" && rawStoreId.trim().length
            ? rawStoreId.trim()
            : typeof rawStoreId === "number"
            ? String(rawStoreId)
            : "sem-loja") ?? "sem-loja";

        const rawProductId = item.produto_id ?? item.product_id ?? item.id_product;
        const productId =
          (typeof rawProductId === "string" && rawProductId.trim().length
            ? rawProductId.trim()
            : typeof rawProductId === "number"
            ? String(rawProductId)
            : null) ?? null;

        if (!productId) {
          return;
        }

        const productData = productMap.get(productId) ?? {};
        const storeData = storeMap.get(storeId) ?? {};

        const productName =
          extractStringValue(productData, PRODUCT_NAME_KEYS) ??
          (typeof item.product_name === "string" ? item.product_name : null) ??
          "Produto";

        const unitLabel =
          extractStringValue(productData, PRODUCT_UNIT_KEYS) ??
          (typeof item.unit_label === "string" ? item.unit_label : null) ??
          "Un.";

        const quantity =
          parseNumericValue(item.quantity) && Number(parseNumericValue(item.quantity)) > 0
            ? Number(parseNumericValue(item.quantity))
            : 1;

        const { unitPrice, originalPrice } = resolveProductPricing(
          productData,
          parseNumericValue(item.unit_price)
        );

        const imageUrl = resolveImageUrl(productData);

        const selectionKey = buildSelectionKey(storeId, productId);
        const rawChecked = item.checked;
        const persistedChecked =
          typeof rawChecked === "boolean"
            ? rawChecked
            : typeof rawChecked === "number"
            ? rawChecked === 1
            : typeof rawChecked === "string"
            ? rawChecked.toLowerCase() === "true" || rawChecked === "1"
            : undefined;
        const productSelected = persistedChecked ?? previousSelections[selectionKey] ?? true;
        nextSelections[selectionKey] = productSelected;

        const storeName =
          extractStringValue(storeData, STORE_NAME_KEYS) ?? `Loja ${storeId.slice(0, 6)}`;
        const storeDescription = extractStringValue(storeData, STORE_DESCRIPTION_KEYS) ?? undefined;
        const storeShippingCost = resolveStoreShippingCost(storeData);

        if (!grouped.has(storeId)) {
          grouped.set(storeId, {
            id: storeId,
            name: storeName,
            description: storeDescription,
            shippingCost: storeShippingCost,
            selected: true,
            products: [],
          });
        }

        const group = grouped.get(storeId);
        if (!group) {
          return;
        }

        group.products.push({
          id: productId,
          name: productName,
          imageUrl,
          unitPrice: typeof unitPrice === "number" ? unitPrice : 0,
          originalPrice,
          quantity: quantity > 0 ? quantity : 1,
          unitLabel,
          selected: productSelected,
        });
      });

      const builtGroups = Array.from(grouped.values()).map((group) => {
        const allSelected = group.products.every((product) => product.selected);
        return {
          ...group,
          selected: allSelected,
        };
      });

      setGroups(builtGroups);
      setSelectedMap(nextSelections);
      } catch (caughtError) {
        console.error("Cart: erro inesperado ao carregar carrinho", caughtError);
        setError("Ocorreu um erro ao carregar seu carrinho.");
        setGroups([]);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [getCartItemsByCartId, getOrCreateActiveCart, getStoreById, user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isMutating) {
      return;
    }

    setIsRefreshing(true);
    try {
      await loadCart({ silent: true });
    } catch (refreshError) {
      console.error("Cart: erro ao atualizar carrinho via pull-to-refresh", refreshError);
    } finally {
      setIsRefreshing(false);
    }
  }, [isMutating, isRefreshing, loadCart]);

  const allProductsSelected = useMemo(() => {
    if (!groups.length) {
      return false;
    }
    return groups.every((group) => group.products.every((product) => product.selected));
  }, [groups]);

  const selectedProductsTotal = useMemo(() => {
    return groups.reduce((accumulator, group) => {
      const groupTotal = group.products.reduce((groupSum, product) => {
        if (!product.selected) {
          return groupSum;
        }
        return groupSum + product.unitPrice * product.quantity;
      }, 0);
      return accumulator + groupTotal;
    }, 0);
  }, [groups]);

  const selectedShippingTotal = useMemo(() => {
    return groups.reduce((accumulator, group) => {
      const hasSelected = group.products.some((product) => product.selected);
      if (!hasSelected) {
        return accumulator;
      }
      return accumulator + (group.shippingCost ?? 0);
    }, 0);
  }, [groups]);

  const summaryHasItems = selectedProductsTotal > 0;
  const cartTotal = selectedProductsTotal + selectedShippingTotal;

  const toggleAllProducts = useCallback(() => {
    if (!cartId || !groups.length) {
      return;
    }

    const shouldSelectAll = !allProductsSelected;
    const updates = groups.reduce(
      (accumulator, group) => {
        group.products.forEach((product) => {
          accumulator.push({
            storeId: group.id,
            productId: product.id,
            checked: shouldSelectAll,
          });
        });
        return accumulator;
      },
      [] as Array<{ storeId: string; productId: string; checked: boolean }>
    );

    if (!updates.length) {
      return;
    }

    runCartMutation(
      async () => {
        const results = await Promise.all(
          updates.map(({ productId, checked }) =>
            setCartItemChecked({
              cartId,
              produtoId: productId,
              checked,
            })
          )
        );

        const failed = results.find((result) => result?.error);
        if (failed?.error) {
          return { data: null, error: failed.error };
        }
        return { data: results, error: null };
      },
      {
        skipReload: true,
        onSuccess: () => {
          setGroups((previous) =>
            previous.map((group) => ({
              ...group,
              selected: shouldSelectAll,
              products: group.products.map((product) => ({
                ...product,
                selected: shouldSelectAll,
              })),
            }))
          );

          setSelectedMap((previous) => {
            const next = { ...previous };
            updates.forEach(({ storeId, productId, checked }) => {
              const key = buildSelectionKey(storeId, productId);
              next[key] = checked;
            });
            return next;
          });
        },
      }
    );
  }, [allProductsSelected, cartId, groups, runCartMutation, setCartItemChecked]);

  const toggleStoreSelection = useCallback(
    (storeId: string) => {
      if (!cartId) {
        return;
      }

      const targetGroup = groups.find((group) => group.id === storeId);
      if (!targetGroup || !targetGroup.products.length) {
        return;
      }

      const shouldSelect = !targetGroup.products.every((product) => product.selected);
      const updates = targetGroup.products.map((product) => ({
        productId: product.id,
        checked: shouldSelect,
      }));

      runCartMutation(
        async () => {
          const results = await Promise.all(
            updates.map(({ productId, checked }) =>
              setCartItemChecked({
                cartId,
                produtoId: productId,
                checked,
              })
            )
          );

          const failed = results.find((result) => result?.error);
          if (failed?.error) {
            return { data: null, error: failed.error };
          }
          return { data: results, error: null };
        },
        {
          skipReload: true,
          onSuccess: () => {
            setGroups((previous) =>
              previous.map((group) => {
                if (group.id !== storeId) {
                  return group;
                }
                return {
                  ...group,
                  selected: shouldSelect,
                  products: group.products.map((product) => ({
                    ...product,
                    selected: shouldSelect,
                  })),
                };
              })
            );

            setSelectedMap((previous) => {
              const next = { ...previous };
              updates.forEach(({ productId, checked }) => {
                const key = buildSelectionKey(storeId, productId);
                next[key] = checked;
              });
              return next;
            });
          },
        }
      );
    },
    [cartId, groups, runCartMutation, setCartItemChecked]
  );

  const toggleProductSelection = useCallback(
    (storeId: string, productId: string) => {
      if (!cartId) {
        return;
      }

      const group = groups.find((item) => item.id === storeId);
      const product = group?.products.find((item) => item.id === productId);

      if (!group || !product) {
        return;
      }

      const nextSelected = !product.selected;

      runCartMutation(
        () =>
          setCartItemChecked({
            cartId,
            produtoId: productId,
            checked: nextSelected,
          }),
        {
          skipReload: true,
          onSuccess: () => {
            setGroups((previous) =>
              previous.map((groupItem) => {
                if (groupItem.id !== storeId) {
                  return groupItem;
                }

                const updatedProducts = groupItem.products.map((productItem) => {
                  if (productItem.id !== productId) {
                    return productItem;
                  }
                  return {
                    ...productItem,
                    selected: nextSelected,
                  };
                });

                const storeSelected = updatedProducts.every((productItem) => productItem.selected);

                return {
                  ...groupItem,
                  selected: storeSelected,
                  products: updatedProducts,
                };
              })
            );

            setSelectedMap((previous) => {
              const next = { ...previous };
              const key = buildSelectionKey(storeId, productId);
              next[key] = nextSelected;
              return next;
            });
          },
        }
      );
    },
    [cartId, groups, runCartMutation, setCartItemChecked]
  );

  const runCartMutation = useCallback(
      async (
        mutation: () => Promise<{ data: unknown; error: unknown } | void>,
        options?: CartMutationOptions
      ) => {
      if (isMutating) {
        return;
      }
      setIsMutating(true);
        try {
          const result = await mutation();
          const mutationError = result && typeof result === "object" ? (result as any).error : null;
          if (mutationError) {
            throw mutationError;
          }
          if (options?.onSuccess) {
            await options.onSuccess();
          }
          if (!options?.skipReload) {
            await loadCart();
          }
      } catch (mutationError) {
        console.error("Cart: erro ao atualizar carrinho", mutationError);
        Alert.alert("Erro", "Não foi possível atualizar seu carrinho. Tente novamente.");
      } finally {
        setIsMutating(false);
      }
    },
    [isMutating, loadCart]
  );

  const handleRemoveProduct = useCallback(
    (storeId: string, productId: string) => {
      if (!user?.id || !cartId) {
        return;
      }

      runCartMutation(
        () =>
          removeItemFromCart({
            userId: user.id,
            cart_id: cartId,
            produto_id: productId,
          }),
        {
          skipReload: true,
          onSuccess: () => {
            setGroups((previousGroups) => {
              const nextGroups: CartStoreGroup[] = [];

              previousGroups.forEach((group) => {
                if (group.id !== storeId) {
                  nextGroups.push(group);
                  return;
                }

                const remainingProducts = group.products.filter(
                  (productItem) => productItem.id !== productId
                );

                if (remainingProducts.length === 0) {
                  return;
                }

                const storeSelected = remainingProducts.every((product) => product.selected);

                nextGroups.push({
                  ...group,
                  products: remainingProducts,
                  selected: storeSelected,
                });
              });

              return nextGroups;
            });

            setSelectedMap((previousMap) => {
              const nextMap = { ...previousMap };
              const selectionKey = buildSelectionKey(storeId, productId);
              delete nextMap[selectionKey];
              return nextMap;
            });
          },
        }
      );
    },
    [cartId, removeItemFromCart, runCartMutation, user?.id]
  );

  const incrementQuantity = useCallback(
    (storeId: string, productId: string) => {
      if (!user?.id || !cartId) {
        return;
      }

      const group = groups.find((item) => item.id === storeId);
      const product = group?.products.find((item) => item.id === productId);

      if (!group || !product) {
        return;
      }

        runCartMutation(
          () =>
            addItemToCart({
              userId: user.id,
              cart_id: cartId,
              store_id: storeId,
              produto_id: productId,
              quantity: 1,
              unit_price: product.unitPrice,
            }),
          {
            skipReload: true,
            onSuccess: () => {
              setGroups((previous) =>
                previous.map((groupItem) => {
                  if (groupItem.id !== storeId) {
                    return groupItem;
                  }
                  return {
                    ...groupItem,
                    products: groupItem.products.map((productItem) =>
                      productItem.id === productId
                        ? { ...productItem, quantity: productItem.quantity + 1 }
                        : productItem
                    ),
                  };
                })
              );
            },
          }
        );
    },
    [addItemToCart, cartId, groups, runCartMutation, user?.id]
  );

  const decrementQuantity = useCallback(
    (storeId: string, productId: string) => {
      if (!user?.id || !cartId) {
        return;
      }

      const group = groups.find((item) => item.id === storeId);
      const product = group?.products.find((item) => item.id === productId);

      if (!group || !product || product.quantity <= 1) {
        return;
      }

        runCartMutation(
          () =>
            updateCartItemQuantity({
              userId: user.id,
              cart_id: cartId,
              produto_id: productId,
              quantity: product.quantity - 1,
            }),
          {
            skipReload: true,
            onSuccess: () => {
              setGroups((previous) =>
                previous.map((groupItem) => {
                  if (groupItem.id !== storeId) {
                    return groupItem;
                  }
                  return {
                    ...groupItem,
                    products: groupItem.products.map((productItem) => {
                      if (productItem.id !== productId) {
                        return productItem;
                      }
                      return {
                        ...productItem,
                        quantity: Math.max(1, productItem.quantity - 1),
                      };
                    }),
                  };
                })
              );
            },
          }
        );
    },
    [cartId, groups, runCartMutation, updateCartItemQuantity, user?.id]
  );

  const renderCheckbox = useCallback(
    (checked: boolean) => (
      <View
        style={[styles.checkboxBase, checked && styles.checkboxChecked]}
      >
        {checked ? (
          <Icon
            type="MaterialCommunityIcons"
            name="check"
            size={16}
            color={theme.colors.onPrimary}
          />
        ) : null}
      </View>
    ),
    [styles, theme.colors.onPrimary]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.feedbackWrapper}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.feedbackText}>Carregando carrinho...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} activeOpacity={0.8} onPress={loadCart}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!groups.length) {
      return (
        <View style={styles.feedbackWrapper}>
          <Icon
            type="MaterialCommunityIcons"
            name="cart-off"
            size={48}
            color={theme.colors.disabled}
          />
          <Text style={styles.feedbackText}>Seu carrinho está vazio.</Text>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              (isRefreshing || isMutating) && styles.refreshButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleRefresh}
            disabled={isRefreshing || isMutating}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon
                type="MaterialCommunityIcons"
                name="refresh"
                size={18}
                color={theme.colors.primary}
              />
            )}
            <Text
              style={[
                styles.refreshButtonText,
                (isRefreshing || isMutating) && styles.refreshButtonTextDisabled,
              ]}
            >
              Recarregar
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              enabled={!isMutating}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <TouchableOpacity
            onPress={toggleAllProducts}
            style={styles.masterToggle}
            activeOpacity={0.8}
            disabled={isMutating}
          >
            {renderCheckbox(allProductsSelected)}
            <Text style={styles.masterToggleText}>Todos os produtos</Text>
          </TouchableOpacity>

          {groups.map((group) => (
            <View key={group.id} style={styles.storeCard}>
              <TouchableOpacity
                onPress={() => toggleStoreSelection(group.id)}
                activeOpacity={0.8}
                style={styles.storeHeader}
                disabled={isMutating}
              >
                {renderCheckbox(group.products.every((product) => product.selected))}
                <View style={styles.storeHeaderText}>
                  <Text style={styles.storeTitle}>Produtos de {group.name}</Text>
                  {group.name ? (
                    <Text style={styles.storeSubtitle}>Loja oficial de {group.name}</Text>
                  ) : null}
                </View>
                <Icon
                  type="MaterialCommunityIcons"
                  name="chevron-right"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              {group.products.map((product) => (
                <View key={product.id} style={styles.productRow}>
                  <TouchableOpacity
                    onPress={() => toggleProductSelection(group.id, product.id)}
                    style={styles.productSelector}
                    activeOpacity={0.8}
                    disabled={isMutating}
                  >
                    {renderCheckbox(product.selected)}
                  </TouchableOpacity>

                  <View style={styles.productCard}>
                    <View style={styles.productDetails}>
                      <View style={styles.productImageWrapper}>
                        {product.imageUrl ? (
                          <Image
                            source={{ uri: product.imageUrl }}
                            style={styles.productImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.productImageFallback}>
                            <Icon
                              type="MaterialCommunityIcons"
                              name="image-off"
                              size={24}
                              color={theme.colors.disabled}
                            />
                          </View>
                        )}
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveProduct(group.id, product.id)}
                          disabled={isMutating}
                        >
                          <Text style={styles.removeButtonText}>Excluir</Text>
                        </TouchableOpacity>

                        <View style={styles.quantityWrapper}>
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              activeOpacity={0.7}
                              onPress={() => decrementQuantity(group.id, product.id)}
                              disabled={isMutating || product.quantity <= 1}
                            >
                              <Icon
                                type="MaterialCommunityIcons"
                                name="minus"
                                size={16}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                            <Text style={styles.quantityValue}>
                              {product.quantity} {product.unitLabel}
                            </Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              activeOpacity={0.7}
                              onPress={() => incrementQuantity(group.id, product.id)}
                              disabled={isMutating}
                            >
                              <Icon
                                type="MaterialCommunityIcons"
                                name="plus"
                                size={16}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.priceWrapper}>
                          {product.originalPrice && product.originalPrice > product.unitPrice ? (
                            <Text style={styles.productOriginalPrice}>
                              {formatCurrency(product.originalPrice * product.quantity)}
                            </Text>
                          ) : null}
                          <Text style={styles.productPrice}>
                            {formatCurrency(product.unitPrice * product.quantity)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.shippingRow}>
                <Text style={styles.shippingLabel}>Frete</Text>
                <Text
                  style={[
                    styles.shippingValue,
                    group.shippingCost === 0 && styles.shippingValueFree,
                  ]}
                >
                  {group.shippingCost === 0
                    ? "Grátis"
                    : formatCurrency(group.shippingCost)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.summaryWrapper}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produto</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(selectedProductsTotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete</Text>
            <Text
              style={[
                styles.summaryValue,
                selectedShippingTotal === 0 && styles.summaryValueFree,
              ]}
            >
              {selectedShippingTotal === 0
                ? "Grátis"
                : formatCurrency(selectedShippingTotal)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(cartTotal)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              (!summaryHasItems || isMutating) && styles.checkoutButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={!summaryHasItems || isMutating}
            onPress={() =>
              router.push({
                pathname: "/(auth)/cart/deliverymethod",
                params: {
                  productTotal: selectedProductsTotal.toFixed(2),
                  shippingFee: selectedShippingTotal.toFixed(2),
                  total: cartTotal.toFixed(2),
                },
              })
            }
          >
            <Text style={styles.checkoutButtonText}>Continuar a compra</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <HeaderScreen title="Carrinho" />
      <View style={styles.body}>{renderContent()}</View>
    </ScreenContainer>
  );
}
