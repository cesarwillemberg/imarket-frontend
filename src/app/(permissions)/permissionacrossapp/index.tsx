import { createTextStyles } from "@/src/assets/styles/textStyles";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Icon } from "@/src/components/common/Icon";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import TrackingIllustration from "@/src/assets/images/onboarding/undraw_applications_h0mq.svg";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
  TRACKING_PERMISSION_ROUTE,
} from "@/src/utils/permissions";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./styled";

export default function PermissionAcrossTheApp() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const textStyles = createTextStyles(theme);
  const router = useRouter();
  const { session } = useSession();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

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
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Icon
                  type="MaterialCommunityIcons"
                  name="access-point"
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.buttonText}>
                  Permitir atividades de rastreamento
                </Text>
              </>
            )}
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
