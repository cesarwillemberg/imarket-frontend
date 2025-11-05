import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon, IconName, IconType } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import cartService from "@/src/services/cart-service";
import orderItemService from "@/src/services/order-item-service";
import orderService from "@/src/services/order-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import createStyles from "./styled";

type ReviewConfirmOrderParams = {
  productTotal?: string | string[];
  shippingFee?: string | string[];
  total?: string | string[];
  paymentSummary?: string | string[];
  paymentMethod?: string | string[];
  paymentMethodLabel?: string | string[];
  billingName?: string | string[];
  billingDocument?: string | string[];
  billingEditPath?: string | string[];
  billingEditLabel?: string | string[];
  deliveryAddress?: string | string[];
  deliveryComplement?: string | string[];
  deliveryDate?: string | string[];
  deliveryWindow?: string | string[];
  deliveryStartTime?: string | string[];
  deliveryEndTime?: string | string[];
  deliveryEditPath?: string | string[];
  deliveryEditLabel?: string | string[];
  paymentEditPath?: string | string[];
  paymentEditLabel?: string | string[];
  confirmPath?: string | string[];
  disableConfirm?: string | string[];
};

type SectionCardDefinition = {
  key: string;
  title: string;
  icon: {
    type: IconType;
    name: IconName;
  };
  lines: string[];
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

const resolvePaymentIcon = (method?: string): SectionCardDefinition["icon"] => {
  const fallbackIcon: SectionCardDefinition["icon"] = {
    type: "MaterialCommunityIcons",
    name: "credit-card-outline",
  };

  if (!method) {
    return fallbackIcon;
  }

  switch (method.toLowerCase()) {
    case "pix":
      return {
        type: "MaterialIcons",
        name: "pix",
      };
    case "boleto":
      return {
        type: "MaterialCommunityIcons",
        name: "barcode",
      };
    case "new-card":
    case "cartao":
    case "cartao-credito":
    case "credito":
    case "credit-card":
    case "card":
      return {
        type: "MaterialCommunityIcons",
        name: "credit-card-outline",
      };
    default:
      return fallbackIcon;
  }
};

const getSingleParam = (value?: string | string[]) => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

const parseCurrencyParam = (value?: string | string[]) => {
  const single = getSingleParam(value);
  if (!single) {
    return null;
  }
  const normalized = single.replace(/[^\d,.-]/g, "").replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBooleanParam = (value?: string | string[]) => {
  const single = getSingleParam(value);
  if (!single) {
    return false;
  }
  const normalized = single.trim().toLowerCase();
  return ["true", "1", "yes", "sim"].includes(normalized);
};

const formatDateLabel = (value?: string | string[]) => {
  const single = getSingleParam(value);
  if (!single) {
    return undefined;
  }
  const timestamp = Date.parse(single);
  if (Number.isNaN(timestamp)) {
    return single;
  }
  return new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));
};

const formatTimeLabel = (value?: string | string[]) => {
  const single = getSingleParam(value);
  if (!single) {
    return undefined;
  }
  const dateString = `1970-01-01T${single}`;
  const timestamp = Date.parse(dateString);
  if (Number.isNaN(timestamp)) {
    return single;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const normalizeString = (value?: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const formatCpfValue = (value?: string) => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }
  if (normalized.toLowerCase().startsWith("cpf")) {
    return normalized;
  }
  const digits = normalized.replace(/\D/g, "");
  if (digits.length === 11) {
    return `CPF: ${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return normalized;
};

const coerceBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "sim"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "nao"].includes(normalized)) {
      return false;
    }
    return null;
  }
  return null;
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const extractIdentifier = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
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

const extractNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = parseNumericValue(record[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
};



const isValidUuid = (value?: string | null) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
};
const isCartItemSelected = (item: Record<string, unknown>) => {
  const candidates = ["is_selected", "selected", "isSelected", "selection", "checked"];
  for (const key of candidates) {
    if (key in item) {
      const coerced = coerceBoolean(item[key]);
      if (coerced !== null) {
        return coerced;
      }
    }
  }
  return true;
};

const normalizeDateForOrder = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString().split("T")[0];
  }
  return new Date(parsed).toISOString().split("T")[0];
};

const normalizeTimeForOrder = (value?: string | null) => {
  if (!value) {
    return "00:00:00";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "00:00:00";
  }
  const simpleMatch = trimmed.match(/^\d{1,2}:\d{2}(?::\d{2})?$/);
  if (simpleMatch) {
    const [hours, minutes, seconds = "00"] = trimmed.split(":");
    const normalizedHours = hours.padStart(2, "0");
    const normalizedSeconds = seconds.padStart(2, "0");
    return `${normalizedHours}:${minutes}:${normalizedSeconds}`;
  }
  const parsed = Date.parse(`1970-01-01T${trimmed}`);
  if (Number.isNaN(parsed)) {
    return "00:00:00";
  }
  const date = new Date(parsed);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};


const ensureValidTimeWindow = (startValue?: string | null, endValue?: string | null) => {
  const toTotalMinutes = (time: string) => {
    const [hours = "0", minutes = "0", seconds = "0"] = time.split(":");
    const total = Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;
    return Number.isFinite(total) ? Math.floor(total) : 0;
  };

  const formatFromMinutes = (value: number) => {
    const clamped = Math.min(Math.max(Math.floor(value), 0), 1439);
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  };

  let startMinutes = toTotalMinutes(normalizeTimeForOrder(startValue));
  let endMinutes = toTotalMinutes(normalizeTimeForOrder(endValue));

  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(startMinutes + 60, 1439);
    if (endMinutes <= startMinutes) {
      endMinutes = Math.min(startMinutes + 1, 1439);
      if (endMinutes <= startMinutes) {
        startMinutes = Math.max(startMinutes - 1, 0);
        endMinutes = Math.min(startMinutes + 1, 1439);
      }
    }
  }

  return {
    startTime: formatFromMinutes(startMinutes),
    endTime: formatFromMinutes(endMinutes),
  };
};

const ReviewConfirmOrder = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<ReviewConfirmOrderParams>();
  const { user, getInfoUser, getAddresses } = useSession();
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const [profileBillingName, setProfileBillingName] = useState<string | undefined>(() =>
    normalizeString(userMetadata.name) ??
    normalizeString(userMetadata.full_name) ??
    normalizeString(user?.email)
  );
  const [profileBillingDocument, setProfileBillingDocument] = useState<string | undefined>(() =>
    normalizeString(userMetadata.cpf)
  );
  useEffect(() => {
    let isActive = true;

    const fetchBillingProfile = async () => {
      if (!user?.id) {
        if (isActive) {
          setProfileBillingName(undefined);
          setProfileBillingDocument(undefined);
        }
        return;
      }

      try {
        const profile = await getInfoUser({ id: user.id });
        if (!isActive) {
          return;
        }

        const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

        setProfileBillingName(
          normalizeString(profile?.nome) ??
            normalizeString(profile?.name) ??
            normalizeString(metadata.name) ??
            normalizeString(metadata.full_name) ??
            normalizeString(user.email)
        );
        setProfileBillingDocument(
          normalizeString(profile?.cpf) ?? normalizeString(metadata.cpf)
        );
      } catch (error) {
        console.error(
          "ReviewConfirmOrder: erro ao carregar dados de faturamento do usuario:",
          error
        );
        if (!isActive) {
          return;
        }

        const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
        setProfileBillingName((current) =>
          current ??
          normalizeString(metadata.name) ??
          normalizeString(metadata.full_name) ??
          normalizeString(user?.email)
        );
        setProfileBillingDocument((current) =>
          current ?? normalizeString(metadata.cpf)
        );
      }
    };

    fetchBillingProfile();

    return () => {
      isActive = false;
    };
  }, [getInfoUser, user]);
  const paymentMethodValue = getSingleParam(params.paymentMethod);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }),
    []
  );

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

  const productTotal = parseCurrencyParam(params.productTotal) ?? 0;
  const shippingFee = parseCurrencyParam(params.shippingFee) ?? 0;
  const totalToPay =
    parseCurrencyParam(params.total) ?? productTotal + shippingFee;

  const paymentSummary =
    getSingleParam(params.paymentSummary) ||
    getSingleParam(params.paymentMethodLabel) ||
    paymentMethodValue ||
    "Boleto";

  const billingName =
    getSingleParam(params.billingName) ||
    profileBillingName ||
    normalizeString(userMetadata.name) ||
    normalizeString(userMetadata.full_name) ||
    normalizeString(user?.email) ||
    "Sem Usuario";
  const billingDocument =
    getSingleParam(params.billingDocument) ||
    formatCpfValue(profileBillingDocument) ||
    formatCpfValue(typeof userMetadata.cpf === "string" ? userMetadata.cpf : undefined) ||
    "CPF: 000.000.000-00";

  const deliveryAddress =
    getSingleParam(params.deliveryAddress) || "Rua Pará 408";
  const deliveryComplement = getSingleParam(params.deliveryComplement);
  const deliveryDateRaw = getSingleParam(params.deliveryDate);
  const deliveryStartTimeRaw = getSingleParam(params.deliveryStartTime);
  const deliveryEndTimeRaw = getSingleParam(params.deliveryEndTime);
  const deliveryDate = formatDateLabel(deliveryDateRaw) || "15/12/2025";
  const deliveryStartTimeLabel = formatTimeLabel(deliveryStartTimeRaw);
  const deliveryEndTimeLabel = formatTimeLabel(deliveryEndTimeRaw);
  const deliveryInterval =
    getSingleParam(params.deliveryWindow) ||
    (deliveryStartTimeLabel && deliveryEndTimeLabel
      ? `${deliveryStartTimeLabel} até ${deliveryEndTimeLabel}`
      : "13:30 até 14:30");

  const billingEditPath = getSingleParam(params.billingEditPath);
  const deliveryEditPath =
    getSingleParam(params.deliveryEditPath) || "/(auth)/cart/deliverymethod";
  const paymentEditPath =
    getSingleParam(params.paymentEditPath) || "/(auth)/cart/paymentmethod";
  const confirmPath = getSingleParam(params.confirmPath) || "/(auth)/home/";
  const disableConfirmParam = parseBooleanParam(params.disableConfirm);
  const deliveryNotes = deliveryComplement;
  const isConfirmDisabled = disableConfirmParam || isProcessingOrder;

  const sections = useMemo<SectionCardDefinition[]>(() => {
    const sectionList: SectionCardDefinition[] = [
      {
        key: "billing",
        title: "Faturamento",
        icon: {
          type: "MaterialCommunityIcons",
          name: "account-circle-outline",
        },
        lines: [billingName, billingDocument].filter(Boolean) as string[],
        actionLabel:
          getSingleParam(params.billingEditLabel) ||
          "Alterar dados de faturamento",
        onPress: () => {
          if (billingEditPath) {
            router.push(billingEditPath as never);
            return;
          }
          Alert.alert(
            "Opção indisponível",
            "Configure a rota de edição de faturamento para habilitar esta ação."
          );
        },
        disabled: !billingEditPath,
      },
      {
        key: "delivery",
        title: "Detalhes da entrega",
        icon: {
          type: "MaterialCommunityIcons",
          name: "map-marker-radius-outline",
        },
        lines: [
          deliveryAddress,
          deliveryComplement,
          `Dia: ${deliveryDate}`,
          `Horário: ${deliveryInterval}`,
        ].filter(Boolean) as string[],
        actionLabel:
          getSingleParam(params.deliveryEditLabel) ||
          "Alterar dados de entrega",
        onPress: () => router.push(deliveryEditPath as never),
      },
        {
          key: "payment",
          title: "Detalhes do pagamento",
          icon: resolvePaymentIcon(paymentMethodValue),
          lines: [paymentSummary, currencyFormatter.format(totalToPay)],
          actionLabel:
            getSingleParam(params.paymentEditLabel) ||
            "Alterar forma de pagamento",
          onPress: () => router.push(paymentEditPath as never),
      },
    ];

    return sectionList;
  }, [
    billingDocument,
    billingEditPath,
    billingName,
    deliveryAddress,
    deliveryComplement,
    deliveryDate,
    deliveryEditPath,
    deliveryInterval,
    currencyFormatter,
    params.billingEditLabel,
      params.deliveryEditLabel,
      params.paymentEditLabel,
      paymentMethodValue,
      paymentEditPath,
      paymentSummary,
      router,
      totalToPay,
  ]);

  const confirmOrder = useCallback(async () => {
  if (!user?.id) {
    Alert.alert(
      "Erro ao confirmar compra",
      "Não foi possível identificar o usuário autenticado."
    );
    return;
  }
  if (isProcessingOrder) {
    return;
  }
  setIsProcessingOrder(true);
  try {
    const { data: cartRecord, error: cartError } = await cartService.getOrCreateActiveCart(
      user.id
    );
    if (cartError || !cartRecord || typeof cartRecord !== "object") {
      throw new Error("Não foi possível localizar o carrinho ativo.");
    }
    const cartData = Array.isArray(cartRecord)
      ? ((cartRecord[0] ?? null) as Record<string, unknown> | null)
      : (cartRecord as Record<string, unknown> | null);
    if (!cartData) {
      throw new Error("Não foi possível carregar os dados do carrinho.");
    }
    const cartId =
      extractIdentifier(cartData, ["id", "cart_id", "id_cart"]) ??
      extractIdentifier(cartData, ["cartId", "idCart"]);
    if (!cartId) {
      throw new Error("Não foi possível identificar o carrinho ativo.");
    }
    const { data: rawItems, error: itemsError } = await cartService.getCartItemsByCartId(
      cartId,
      user.id
    );
    if (itemsError) {
      throw new Error("Não foi possível carregar os itens do carrinho.");
    }
    const cartItemsArray = (Array.isArray(rawItems) ? rawItems : []) as Record<string, unknown>[];
    const selectedItems = cartItemsArray.filter(isCartItemSelected);
    if (!selectedItems.length) {
      throw new Error("Não há itens selecionados no carrinho.");
    }
    const addressIdRaw =
      extractIdentifier(cartData, [
        "address_id",
        "delivery_address_id",
        "profile_address_id",
        "addressId",
      ]) ?? null;

    let addressId: string | null = isValidUuid(addressIdRaw) ? addressIdRaw : null;

    if (!addressId) {
      try {
        const { data: addressData } = await getAddresses({ user_id: user.id });
        const addressesArray = (Array.isArray(addressData) ? addressData : []) as Record<string, unknown>[];
        const defaultAddress =
          addressesArray.find((record) =>
            ["is_default", "isDefault", "is_default_address", "isDefaultAddress", "default", "is_main", "isMain"].some((key) =>
              coerceBoolean(record[key])
            )
          ) ??
          addressesArray[0] ??
          null;
        const fallbackAddressId = defaultAddress
          ? extractIdentifier(defaultAddress, ["id", "address_id", "addressId"])
          : null;
        if (isValidUuid(fallbackAddressId)) {
          addressId = fallbackAddressId;
        }
      } catch (addressLookupError) {
        console.error(
          "ReviewConfirmOrder: erro ao localizar endere?o de entrega:",
          addressLookupError
        );
      }
    }

    if (!addressId) {
      throw new Error(
        "Não foi possível identificar um endereço de entrega válido. Atualize os dados de entrega e tente novamente."
      );
    }

const paymentMethodIdRaw =
      paymentMethodValue ??
      extractIdentifier(cartData, [
        "profile_payment_method_id",
        "payment_method_id",
        "paymentMethodId",
      ]) ??
      null;
    const paymentMethodId = isValidUuid(paymentMethodIdRaw) ? paymentMethodIdRaw : null;
    const { startTime: deliveryTimeStart, endTime: deliveryTimeEnd } = ensureValidTimeWindow(
      deliveryStartTimeRaw,
      deliveryEndTimeRaw
    );

    const orderPayload: Record<string, unknown> = {
      profile_id: user.id,
      cart_id: cartId,
      address_id: addressId,
      profile_payment_method_id: paymentMethodId,
      total_amount: totalToPay,
      status: "pending",
      payment_method: paymentMethodValue ?? "desconhecido",
      delivery_method: "delivery",
      delivery_date: normalizeDateForOrder(deliveryDateRaw),
      delivery_time_start: deliveryTimeStart,
      delivery_time_end: deliveryTimeEnd,
      delivery_notes: deliveryNotes ?? "",
    };
    const orderResult = await orderService.createOrder(orderPayload as any);
    const orderIdentifier =
      extractIdentifier(orderResult as Record<string, unknown>, ["order_id", "id", "id_order"]) ??
      null;
    if (!orderIdentifier) {
      throw new Error("Não foi possível identificar o pedido criado.");
    }
    const orderItemsPayload = selectedItems
      .map((item) => {
        const storeId =
          extractIdentifier(item, ["store_id", "storeId", "id_store", "store"]) ?? null;
        const productId =
          extractIdentifier(item, ["produto_id", "product_id", "productId", "id_product"]) ??
          null;
        if (!storeId || !productId) {
          return null;
        }
        const quantity =
          extractNumber(item, ["quantity", "qty"]) ?? extractNumber(item, ["amount"]) ?? 1;
        const unitPrice =
          extractNumber(item, ["unit_price", "price", "unitPrice", "value"]) ?? 0;
        const totalPrice =
          extractNumber(item, ["total_price", "total", "totalPrice"]) ??
          unitPrice * quantity;
        return {
          order_id: orderIdentifier,
          store_id: storeId,
          produto_id: productId,
          quantity: Math.max(1, Math.trunc(quantity)),
          unit_price: unitPrice,
        };
      })
      .filter((value): value is {
        order_id: string;
        store_id: string;
        produto_id: string;
        quantity: number;
        unit_price: number;
      } => Boolean(value));
    if (!orderItemsPayload.length) {
      throw new Error("Não foi possível preparar os itens do pedido.");
    }
    await orderItemService.createOrderItems(orderItemsPayload);
    await Promise.all(
      orderItemsPayload.map(async (item) => {
        const produtoId = item.produto_id;
        if (!isValidUuid(produtoId)) {
          console.warn("ReviewConfirmOrder: id de produto inválido ao limpar o carrinho", produtoId);
          return;
        }
        const { error } = await cartService.removeItemFromCart({
          userId: user.id,
          cart_id: cartId,
          produto_id: produtoId,
        });
        if (error) {
          throw new Error("Falha ao remover itens do carrinho após criar o pedido.");
        }
      })
    );
    Alert.alert(
      "Estamos processando o seu pedido!",
      "Você finalizou a compra e receberá atualizações em breve. Agora, você será redirecionado para a tela inicial. Obrigado por comprar conosco!"
    );
    setTimeout(() => {
      if (confirmPath) {
        router.dismissAll();
        router.push(confirmPath as never);
      }
    }, 1000 * 6);
  } catch (caughtError) {
    console.error("ReviewConfirmOrder: erro ao confirmar pedido:", caughtError);
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Ocorreu um erro ao confirmar sua compra. Tente novamente.";
    Alert.alert("Erro ao confirmar compra", message);
  } finally {
    setIsProcessingOrder(false);
  }
}, [
  confirmPath,
  deliveryDateRaw,
  deliveryEndTimeRaw,
  deliveryNotes,
  deliveryStartTimeRaw,
  getAddresses,
  isProcessingOrder,
  paymentMethodValue,
  router,
  totalToPay,
  user?.id,
]);

const handleConfirm = useCallback(() => {
  if (isConfirmDisabled) {
    return;
  }
  Alert.alert(
    "Confirmar compra",
    "Deseja confirmar a compra?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Confirmar",
        style: "default",
        onPress: () => {
          void confirmOrder();
        },
      },
    ],
    { cancelable: true }
  );
}, [confirmOrder, isConfirmDisabled]);
  return (
    <ScreenContainer style={styles.container} safeAreaEdges={["top", "bottom"]}>
      <HeaderScreen title="Confirmar Pedido" showButtonBack />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionIntroTitle}>Revise e confirme</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produto</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(productTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete</Text>
            <Text
              style={[
                styles.summaryValue,
                shippingFee === 0 && styles.summaryValueFree,
              ]}
            >
              {shippingFee === 0
                ? "Grátis"
                : currencyFormatter.format(shippingFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, styles.summaryHighlightLabel]}>
                Você pagará
              </Text>
              {paymentSummary ? (
                <Text style={styles.summarySubValue}>{paymentSummary}</Text>
              ) : null}
            </View>
            <Text style={[styles.summaryValue, styles.summaryHighlightValue]}>
              {currencyFormatter.format(totalToPay)}
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.key} style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Icon
                    type={section.icon.type}
                    name={section.icon.name}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  {section.lines.map((line, index) => (
                    <Text
                      key={`${section.key}-${index}`}
                      style={[
                        styles.infoSecondaryText,
                        index === 0 && styles.infoPrimaryText,
                        index === section.lines.length - 1 &&
                          styles.infoSecondaryTextLast,
                      ]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.infoActionButton}
                activeOpacity={0.7}
                onPress={section.onPress}
                disabled={section.disabled}
              >
                <Text
                  style={[
                    styles.infoActionText,
                    section.disabled && styles.infoActionTextDisabled,
                  ]}
                >
                  {section.actionLabel}
                </Text>
                <View style={styles.infoActionChevron}>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="chevron-right"
                    size={18}
                    color={
                      section.disabled
                        ? theme.colors.disabled
                        : theme.colors.primary
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: theme.spacing.md + insets.bottom },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{currencyFormatter.format(totalToPay)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            isConfirmDisabled && styles.confirmButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={isConfirmDisabled}
        >
          <Text style={styles.confirmButtonText}>Confirmar a compra</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default ReviewConfirmOrder;
