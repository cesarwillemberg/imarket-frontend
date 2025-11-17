import PushIllustration from "@/src/assets/images/onboarding/undraw_push-notifications_5z1s.svg";
import { createTextStyles } from "@/src/assets/styles/textStyles";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
  NOTIFICATION_PERMISSION_ROUTE,
  skipPermissionRequest,
} from "@/src/utils/permissions";
import * as Notifications from "expo-notifications";
import { isRegisteredForRemoteNotificationsAsync } from "expo-notifications";
import { useRouter } from "expo-router";
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

export default function PermissionNotification() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const textStyles = createTextStyles(theme);
  const router = useRouter();
  const { session } = useSession();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSkippingPermission, setIsSkippingPermission] = useState(false);
  const animationLoading = useRef<LottieView>(null);

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

        if (pendingRoute !== NOTIFICATION_PERMISSION_ROUTE) {
          router.replace(pendingRoute);
        }
      } catch (error) {
        console.error("PermissionNotification: failed to verify status", error);
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

      const existingSettings = await Notifications.getPermissionsAsync();
      let finalStatus = existingSettings.status;
      let canAskAgain = existingSettings.canAskAgain ?? true;

      if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
        const requestedSettings = await Notifications.requestPermissionsAsync();
        finalStatus = requestedSettings.status;
        canAskAgain = requestedSettings.canAskAgain ?? canAskAgain;
      }

      if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
        Alert.alert(
          "Ative as notificações",
          "Para acompanhar pedidos e promoções, permita que o iMarket envie notificações.",
          !canAskAgain
            ? [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Abrir configurações",
                  onPress: () => Linking.openSettings(),
                },
              ]
            : undefined
        );
        return;
      }

      if (typeof isRegisteredForRemoteNotificationsAsync === "function") {
        const isRegisteredForNotifications =
          await isRegisteredForRemoteNotificationsAsync();
        if (!isRegisteredForNotifications) {
          Alert.alert(
            "Ative as notificações",
            "Parece que as notificações ainda estão bloqueadas. Verifique as configurações do dispositivo para liberar o envio.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Abrir configurações",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      }

      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Erro ao solicitar notificações",
        "Não foi possível solicitar as notificações agora. Tente novamente."
      );
      console.error("PermissionNotification: request error", error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSkipPermission = async () => {
    if (isSkippingPermission) return;

    try {
      setIsSkippingPermission(true);
      await skipPermissionRequest("notification");
      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Não foi possível continuar",
        "Tente novamente ou permita essa configuração depois nas configurações."
      );
      console.error("PermissionNotification: skip error", error);
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
            <PushIllustration width={230} height={230} />
          </View>

          <View style={styles.textBlock}>
            <Text style={[textStyles.titleText, styles.title]}>
              Permitir notificações
            </Text>
            <Text style={[textStyles.centeredText, styles.description]}>
              Permita que o iMarket envie notificações sobre pedidos,
              promoções, mensagens e entregas.
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
                <Text style={styles.buttonText}>Permitir notificações</Text>
                <Icon
                  type="MaterialCommunityIcons"
                  name="bell-ring"
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
            Você pode alterar essa permissão quando quiser nas configurações do
            seu dispositivo.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
