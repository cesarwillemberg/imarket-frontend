import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon, IconName, IconType } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
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

export default function PaymentMethod() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useSession();

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

    router.push({
      pathname: "/(auth)/cart/finalizeorder",
      params: {
        paymentMethod: selectedOption,
      },
    });
  }, [router, selectedOption]);

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
