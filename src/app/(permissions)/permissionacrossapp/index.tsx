import TrackingIllustration from "@/src/assets/images/onboarding/undraw_applications_h0mq.svg";
import { createTextStyles } from "@/src/assets/styles/textStyles";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
  skipPermissionRequest,
  TRACKING_PERMISSION_ROUTE,
} from "@/src/utils/permissions";
import { useRouter } from "expo-router";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import createStyles from "./styled";

export default function PermissionAcrossTheApp() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const animationLoading = useRef<LottieView>(null);
  const textStyles = createTextStyles(theme);
  const router = useRouter();
  const { session } = useSession();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSkippingPermission, setIsSkippingPermission] = useState(false);

  useEffect(() => {
    if (!session) return router.replace("/signin");

    let isMounted = true;

    const ensureCorrectScreen = async () => {
      try {
        const pendingRoute = await getPendingPermissionRoute();
        if (!isMounted) return;

        if (!pendingRoute) {
          router.replace(HOME_ROUTE);
          return;
        }

        if (pendingRoute !== TRACKING_PERMISSION_ROUTE) {
          router.replace(pendingRoute);
        }
      } catch (error) {
        console.error("PermissionAcrossApp: failed to verify status", error);
        if (isMounted) router.replace(HOME_ROUTE);
      }
    };

    ensureCorrectScreen();

    return () => {
      isMounted = false;
    };
  }, [router, session]);

  const handleRequestPermission = async () => {
    if (isRequestingPermission) return;

    try {
      setIsRequestingPermission(true);

      const { status, canAskAgain } = await requestTrackingPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permita o rastreamento",
          "Precisamos da sua autorização para rastrear atividades e personalizar a experiência.",
          !canAskAgain
            ? [
                { text: "Cancelar", style: "cancel" },
                { text: "Abrir configurações", onPress: () => Linking.openSettings() },
              ]
            : undefined
        );
        return;
      }

      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Erro ao solicitar permissão",
        "Não conseguimos verificar essa permissão agora. Tente novamente."
      );
      console.error("PermissionAcrossApp: request error", error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSkipPermission = async () => {
    if (isSkippingPermission) return;

    try {
      setIsSkippingPermission(true);
      await skipPermissionRequest("tracking");
      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Não foi possível continuar",
        "Tente novamente mais tarde ou ajuste essa permissão nas configurações."
      );
      console.error("PermissionAcrossApp: skip error", error);
    } finally {
      setIsSkippingPermission(false);
    }
  };

  return (
    <ScreenContainer
      style={styles.container}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.illustrationWrapper}>
            <TrackingIllustration width={230} height={230} />
          </View>

          <View style={styles.textBlock}>
            <Text style={[textStyles.titleText, styles.title]}>
              Permitir atividades
            </Text>
            <Text style={[textStyles.centeredText, styles.description]}>
              Permita que o iMarket rastreie suas atividades em outros apps
              para oferecer recomendações personalizadas.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.permissionButton,
              isRequestingPermission && {
                opacity: theme.opacity.disabled,
              },
            ]}
            activeOpacity={theme.opacity.pressed}
            onPress={handleRequestPermission}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? (
              <ActivityIndicator size={"small"} color={theme.colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Permitir atividades de rastreamento
                </Text>
                <Icon
                  type="MaterialCommunityIcons"
                  name="radar"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.skipButton,
              (isRequestingPermission || isSkippingPermission) && {
                opacity: theme.opacity.disabled,
              },
            ]}
            activeOpacity={theme.opacity.pressed}
            onPress={handleSkipPermission}
            disabled={isRequestingPermission || isSkippingPermission}
          >
            <Text style={styles.skipButtonText}>Não, obrigado</Text>
          </TouchableOpacity>

          <Text style={[textStyles.centeredText, styles.helperText]}>
            Você pode mudar essa configuração a qualquer momento nos ajustes do
            sistema.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
