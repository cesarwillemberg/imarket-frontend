import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon, IconName, IconType } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
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

const ReviewConfirmOrder = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<ReviewConfirmOrderParams>();
  const { user, getInfoUser } = useSession();
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
  const deliveryDate = formatDateLabel(params.deliveryDate) || "15/12/2025";
  const deliveryStartTimeLabel = formatTimeLabel(params.deliveryStartTime);
  const deliveryEndTimeLabel = formatTimeLabel(params.deliveryEndTime);
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
  const isConfirmDisabled = parseBooleanParam(params.disableConfirm);

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

  const handleConfirm = useCallback(() => {
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
            Alert.alert(
              "Estamos processando o seu pedido!",
              "Você finalizou a compra e receberá atualizações em breve. Agora, você será redirecionado para a tela inicial. Obrigado por comprar conosco!"
            );
            setTimeout(() => {
              if (confirmPath) {
                router.dismissAll();
                router.push(confirmPath as never);
                return;
              }
            }, 1000 * 6);
          },
        },
      ],
      { cancelable: true }
    );
  }, [confirmPath, router]);

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
