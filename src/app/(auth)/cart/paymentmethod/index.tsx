import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon, IconName, IconType } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

type PaymentOption = {
  id: string;
  label: string;
  description?: string;
  icon: {
    type: IconType;
    name: IconName;
  };
};

type PaymentMethodParams = {
  productTotal?: string | string[];
  shippingFee?: string | string[];
  total?: string | string[];
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

export default function PaymentMethod() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useSession();
  const params = useLocalSearchParams<PaymentMethodParams>();

  const productTotalParam = getSingleParam(params.productTotal);
  const shippingFeeParam = getSingleParam(params.shippingFee);
  const totalParam = getSingleParam(params.total);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }),
    []
  );

  const productTotal = useMemo(
    () => parseCurrencyParam(productTotalParam) ?? 0,
    [productTotalParam]
  );

  const shippingFee = useMemo(
    () => parseCurrencyParam(shippingFeeParam) ?? 0,
    [shippingFeeParam]
  );

  const totalValue = useMemo(() => {
    const parsedTotal = parseCurrencyParam(totalParam);
    if (parsedTotal !== null) {
      return parsedTotal;
    }
    return productTotal + shippingFee;
  }, [productTotal, shippingFee, totalParam]);

  const recommendedOptions = useMemo<PaymentOption[]>(
    () => [
      {
        id: "pix",
        label: "Pix",
        description: "Pagamento instantaneo com confirmacao imediata.",
        icon: {
          type: "MaterialIcons",
          name: "pix",
        },
      },
      {
        id: "boleto",
        label: "Boleto",
        description: "Compensacao em ate 2 dias uteis.",
        icon: {
          type: "MaterialCommunityIcons",
          name: "barcode",
        },
      },
    ],
    []
  );

  const cardOptions = useMemo<PaymentOption[]>(
    () => [
      {
        id: "new-card",
        label: "Novo cartao de credito",
        description: "Cadastre um novo cartao para finalizar a compra.",
        icon: {
          type: "MaterialCommunityIcons",
          name: "credit-card-plus-outline",
        },
      },
    ],
    []
  );

  const [selectedOption, setSelectedOption] = useState<string | null>(
    recommendedOptions[0]?.id ?? null
  );

  useEffect(() => {
    if (!session) {
      router.replace("/signin");
    }
  }, [session, router]);

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

  const handleSelect = useCallback((optionId: string) => {
    setSelectedOption(optionId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedOption) {
      return;
    }

    const nextParams: Record<string, string> = {
      paymentMethod: selectedOption,
      productTotal: productTotalParam ?? productTotal.toFixed(2),
      shippingFee: shippingFeeParam ?? shippingFee.toFixed(2),
      total: totalParam ?? totalValue.toFixed(2),
    };

    router.push({
      pathname: "/(auth)/cart/reviewconfirmorder/",
      params: nextParams,
    });
  }, [
    productTotal,
    productTotalParam,
    router,
    selectedOption,
    shippingFee,
    shippingFeeParam,
    totalParam,
    totalValue,
  ]);

  const renderOption = useCallback(
    (option: PaymentOption) => {
      const isSelected = selectedOption === option.id;
      return (
        <TouchableOpacity
          key={option.id}
          style={[styles.optionCard, isSelected && styles.optionCardSelected]}
          activeOpacity={0.85}
          onPress={() => handleSelect(option.id)}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIconWrapper}>
              <Icon
                type={option.icon.type}
                name={option.icon.name}
                size={20}
                color={isSelected ? theme.colors.primary : theme.colors.disabled}
              />
            </View>
            <View style={styles.optionDetails}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.description ? (
                <Text style={styles.optionDescription}>{option.description}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.optionTrailing}>
            <View
              style={[
                styles.radioOuter,
                isSelected && { borderColor: theme.colors.primary },
              ]}
            >
              {isSelected ? <View style={styles.radioInner} /> : null}
            </View>
            <Icon
              type="MaterialCommunityIcons"
              name="chevron-right"
              size={20}
              color={theme.colors.disabled}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelect, selectedOption, styles, theme.colors.disabled, theme.colors.primary]
  );

  return (
    <ScreenContainer style={styles.container} safeAreaEdges={["top", "bottom"]}>
      <HeaderScreen title="Finalizar Pedido" showButtonBack />

      <View style={styles.body}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageSubtitle}>Escolha como pagar</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendados</Text>
            {recommendedOptions.map(renderOption)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cartoes</Text>
            {cardOptions.map(renderOption)}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.summaryWrapper}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produto</Text>
            <Text style={styles.summaryValue}>
              {currencyFormatter.format(productTotal)}
            </Text>
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
        </View>
        <TouchableOpacity
          style={[styles.continueButton, !selectedOption && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          disabled={!selectedOption}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continuar a compra</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
