import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

type NormalizedAddress = {
  street?: string;
  streetNumber?: string;
  city?: string;
  state?: string;
  stateAcronym?: string;
  postalCode?: string;
  neighborhood?: string;
  complement?: string;
  title?: string;
};

type StoreInfo = {
  id: string;
  name: string;
  address: NormalizedAddress | null;
};

const ADDRESS_STREET_KEYS = ["street", "logradouro", "address", "rua"] as const;
const ADDRESS_NUMBER_KEYS = ["street_number", "number", "numero"] as const;
const ADDRESS_CITY_KEYS = ["city", "cidade", "municipio"] as const;
const ADDRESS_STATE_KEYS = ["state", "estado"] as const;
const ADDRESS_STATE_ACRONYM_KEYS = ["state_acronym", "stateAcronym", "uf"] as const;
const ADDRESS_POSTAL_KEYS = ["postal_code", "zipcode", "zip_code", "cep"] as const;
const ADDRESS_TYPE_KEYS = ["address_type", "type", "label"] as const;
const ADDRESS_NEIGHBORHOOD_KEYS = ["neighborhood", "bairro", "district"] as const;
const ADDRESS_COMPLEMENT_KEYS = ["complement", "complemento"] as const;
const STORE_NAME_KEYS = ["name", "store_name", "fantasy_name", "fantasyName"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pickFirstString = (record: Record<string, unknown>, keys: readonly string[]) => {
  for (const key of keys) {
    const rawValue = record[key];
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      return rawValue.trim();
    }
    if (typeof rawValue === "number") {
      return String(rawValue);
    }
  }
  return undefined;
};

const isTruthy = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
};

const hasTruthyFlag = (record: Record<string, unknown>, key: string) => {
  return isTruthy(record[key]);
};

const normalizeAddress = (input: Record<string, unknown> | null | undefined): NormalizedAddress | null => {
  if (!isRecord(input)) {
    return null;
  }

  return {
    street: pickFirstString(input, ADDRESS_STREET_KEYS),
    streetNumber: pickFirstString(input, ADDRESS_NUMBER_KEYS),
    city: pickFirstString(input, ADDRESS_CITY_KEYS),
    state: pickFirstString(input, ADDRESS_STATE_KEYS),
    stateAcronym: pickFirstString(input, ADDRESS_STATE_ACRONYM_KEYS),
    postalCode: pickFirstString(input, ADDRESS_POSTAL_KEYS),
    neighborhood: pickFirstString(input, ADDRESS_NEIGHBORHOOD_KEYS),
    complement: pickFirstString(input, ADDRESS_COMPLEMENT_KEYS),
    title: pickFirstString(input, ADDRESS_TYPE_KEYS),
  };
};

const formatAddressLine = (address: NormalizedAddress | null) => {
  if (!address) {
    return null;
  }

  const streetPart = [address.street, address.streetNumber]
    .filter(Boolean)
    .join(", ");
  const cityState = [address.city, address.stateAcronym ?? address.state]
    .filter(Boolean)
    .join(" - ");

  const parts = [
    streetPart,
    cityState,
    address.postalCode,
  ].filter((value) => Boolean(value && value.length));

  if (!parts.length) {
    return null;
  }

  return parts.join(", ");
};

const formatTitle = (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (value.length === 1) {
    return value.toUpperCase();
  }
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const resolveStoreName = (raw: Record<string, unknown> | null | undefined) => {
  if (!isRecord(raw)) {
    return "";
  }

  return pickFirstString(raw, STORE_NAME_KEYS) ?? "";
};

const DeliveryMethod = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);
  const router = useRouter();
  const navigation = useNavigation();

  const {
    user,
    getAddresses,
    getOrCreateActiveCart,
    getCartItemsByCartId,
    getStoreById,
    getAddressesStore,
  } = useSession();

  const [customerAddress, setCustomerAddress] = useState<NormalizedAddress | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [selectedOption, setSelectedOption] = useState<"delivery" | "pickup">("delivery");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUserSelection = useRef(false);

  const resolveCartId = (cartData: Record<string, unknown>) => {
    const possibleKeys = ["id", "cart_id", "id_cart"];
    for (const key of possibleKeys) {
      const value = cartData[key];
      if (typeof value === "string" && value.trim().length) {
        return value.trim();
      }
      if (typeof value === "number") {
        return String(value);
      }
    }
    return null;
  };

  const resolveStoreIdFromItems = (items: Record<string, unknown>[]) => {
    for (const item of items) {
      const raw =
        item.store_id ??
        item.storeId ??
        item.id_store ??
        item.idStore;

      if (typeof raw === "string" && raw.trim().length) {
        return raw.trim();
      }

      if (typeof raw === "number") {
        return String(raw);
      }
    }
    return null;
  };

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!user?.id) {
        setError("Usuario nao autenticado.");
        setCustomerAddress(null);
        setStoreInfo(null);
        setIsLoading(false);
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { data: addressData, error: addressError } = await getAddresses({ user_id: user.id });

        if (addressError) {
          console.error("DeliveryMethod: erro ao buscar enderecos do usuario:", addressError);
        }

        const addressesArray = (Array.isArray(addressData) ? addressData : []) as Record<string, unknown>[];
        const defaultAddressRecord =
          addressesArray.find((address) => Boolean(address?.is_default)) ??
          addressesArray[0] ??
          null;

        const normalizedCustomerAddress = normalizeAddress(defaultAddressRecord);
        setCustomerAddress(normalizedCustomerAddress);

        let resolvedStore: StoreInfo | null = null;

        const { data: cartData, error: cartError } = await getOrCreateActiveCart(user.id);

        if (cartError) {
          console.error("DeliveryMethod: erro ao buscar carrinho:", cartError);
        }

        if (cartData && isRecord(cartData)) {
          const cartId = resolveCartId(cartData);

          if (cartId) {
            const { data: cartItems, error: cartItemsError } = await getCartItemsByCartId(cartId, user.id);

            if (cartItemsError) {
              console.error("DeliveryMethod: erro ao buscar itens do carrinho:", cartItemsError);
            }

            const cartItemsArray = (Array.isArray(cartItems) ? cartItems : []) as Record<string, unknown>[];
            const storeId = resolveStoreIdFromItems(cartItemsArray);

            if (storeId) {
              const [{ data: storeData, error: storeError }, { data: storeAddresses, error: storeAddressError }] =
                await Promise.all([
                  getStoreById(storeId),
                  getAddressesStore(storeId),
                ]);

              if (storeError) {
                console.error("DeliveryMethod: erro ao buscar loja:", storeError);
              }

              if (storeAddressError) {
                console.error("DeliveryMethod: erro ao buscar endereco da loja:", storeAddressError);
              }

              const storeAddressesArray = (Array.isArray(storeAddresses) ? storeAddresses : []) as Record<string, unknown>[];
              const preferredStoreAddress =
                storeAddressesArray.find(
                  (address) => hasTruthyFlag(address, "is_default") || hasTruthyFlag(address, "is_main")
                ) ??
                storeAddressesArray[0] ??
                null;

              const normalizedStoreAddress = normalizeAddress(preferredStoreAddress);

              resolvedStore = {
                id: storeId,
                name: resolveStoreName(storeData as Record<string, unknown>),
                address: normalizedStoreAddress,
              };
            }
          }
        }

        setStoreInfo(resolvedStore);

        setSelectedOption((previous) => {
          if (hasUserSelection.current) {
            if (previous === "delivery" && !normalizedCustomerAddress && resolvedStore?.address) {
              return "pickup";
            }
            if (previous === "pickup" && !resolvedStore?.address && normalizedCustomerAddress) {
              return "delivery";
            }
            return previous;
          }

          if (normalizedCustomerAddress) {
            return "delivery";
          }

          if (resolvedStore?.address) {
            return "pickup";
          }

          return previous;
        });

        if (!normalizedCustomerAddress && !resolvedStore?.address) {
          setError("Nenhuma informacao de entrega encontrada. Cadastre um endereco ou selecione uma loja.");
        }
      } catch (caughtError) {
        console.error("DeliveryMethod: erro ao carregar dados:", caughtError);
        setError("Nao foi possivel carregar as informacoes de entrega. Tente novamente.");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [
      getAddresses,
      getCartItemsByCartId,
      getOrCreateActiveCart,
      getStoreById,
      getAddressesStore,
      user?.id,
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) {
        return;
      }

      parent.setOptions({
        tabBarStyle: [tabBarBaseStyle, { display: "none" }],
      });

      return () => {
        parent.setOptions({
          tabBarStyle: tabBarBaseStyle,
        });
      };
    }, [navigation, tabBarBaseStyle])
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    await loadData({ silent: true });
    setIsRefreshing(false);
  }, [isRefreshing, loadData]);

  const handleSelectOption = useCallback(
    (option: "delivery" | "pickup") => {
      hasUserSelection.current = true;
      setSelectedOption(option);
    },
    []
  );

  const deliveryDisabled = !customerAddress;
  const pickupDisabled = !storeInfo?.address;

  const customerAddressLine = formatAddressLine(customerAddress);
  const storeAddressLine = formatAddressLine(storeInfo?.address ?? null);
  const continueDisabled =
    isLoading ||
    (selectedOption === "delivery" ? deliveryDisabled : pickupDisabled);

  const handleContinue = useCallback(() => {
    const params: Record<string, string> = {};

    if (selectedOption === "delivery") {
      if (customerAddressLine) {
        params.addressLine = customerAddressLine;
      }
    } else {
      if (storeAddressLine) {
        params.addressLine = storeAddressLine;
      }
      if (storeInfo?.name) {
        params.destinationLabel = storeInfo.name;
      }
    }

    router.push({
      pathname: "/(auth)/cart/deliverydateandtime",
      params,
    });
  }, [customerAddressLine, router, selectedOption, storeAddressLine, storeInfo?.name]);

  return (
    <ScreenContainer style={styles.container}>
      <HeaderScreen title="Finalizar Pedido" showButtonBack />
      <View style={styles.content}>
        <View style={styles.body}>
          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Escolha a forma de entrega</Text>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedOption === "delivery" && !deliveryDisabled && styles.optionCardSelected,
                  deliveryDisabled && styles.optionCardDisabled,
                ]}
                activeOpacity={deliveryDisabled ? 1 : 0.85}
                disabled={deliveryDisabled}
                onPress={() => handleSelectOption("delivery")}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Enviar no meu endereco</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Gratis</Text>
                  </View>
                  <View style={styles.optionIconWrapper}>
                    <Icon type="MaterialCommunityIcons" name="chevron-right" size={20} color={theme.colors.disabled} />
                  </View>
                </View>

                <Text style={styles.optionDescription}>
                  {customerAddressLine ?? "Cadastre um endereco padrao para receber o pedido."}
                </Text>

                {customerAddress?.title ? (
                  <Text style={styles.optionSubtitle}>{formatTitle(customerAddress.title)}</Text>
                ) : null}

                {customerAddress?.complement ? (
                  <Text style={styles.optionComplement}>{customerAddress.complement}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.changeAddressButton}
                  activeOpacity={0.7}
                  onPress={() => router.push("/(auth)/profile/address")}
                >
                  <Text style={styles.changeAddressButtonText}>
                    Alterar ou escolher outro endereco
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedOption === "pickup" && !pickupDisabled && styles.optionCardSelected,
                  pickupDisabled && styles.optionCardDisabled,
                ]}
                activeOpacity={pickupDisabled ? 1 : 0.85}
                disabled={pickupDisabled}
                onPress={() => handleSelectOption("pickup")}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Retirada no estabelecimento</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Gratis</Text>
                  </View>
                  <View style={styles.optionIconWrapper}>
                    <Icon type="MaterialCommunityIcons" name="chevron-right" size={20} color={theme.colors.disabled} />
                  </View>
                </View>

                {pickupDisabled ? (
                  <Text style={styles.emptyMessage}>
                    Adicione itens de uma loja para habilitar esta opcao.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.optionDescription}>
                      {storeAddressLine ?? "Endereco da loja indisponivel."}
                    </Text>
                    {storeInfo?.name ? (
                      <Text style={styles.storeName}>{storeInfo.name}</Text>
                    ) : null}
                    {storeInfo?.address?.neighborhood ? (
                      <Text style={styles.optionSubtitle}>{storeInfo.address.neighborhood}</Text>
                    ) : null}
                  </>
                )}
              </TouchableOpacity> */}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.shippingRow}>
            <Text style={styles.shippingLabel}>Frete</Text>
            <Text style={[styles.shippingValue, styles.shippingValueFree]}>
              Grátis
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              continueDisabled && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={continueDisabled}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar a compra</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default DeliveryMethod;
