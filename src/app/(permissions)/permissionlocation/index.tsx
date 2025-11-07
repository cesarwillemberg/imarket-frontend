import LocationIllustration from "@/src/assets/images/onboarding/undraw_my-location_dcug.svg";
import { createTextStyles } from "@/src/assets/styles/textStyles";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
  LOCATION_PERMISSION_ROUTE,
  skipPermissionRequest,
} from "@/src/utils/permissions";
import {
  getCurrentPositionAsync,
  LocationAccuracy,
  requestForegroundPermissionsAsync,
} from "expo-location";
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

export default function PermissionLocation() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
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

        if (pendingRoute !== LOCATION_PERMISSION_ROUTE) {
          router.replace(pendingRoute);
        }
      } catch (error) {
        console.error("PermissionLocation: failed to verify status", error);
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
      const { status, canAskAgain } =
        await requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          canAskAgain
            ? "Precisamos da sua localização para mostrar mercados perto de você."
            : "Ative a localização nas configurações do sistema para continuar.",
          !canAskAgain
            ? [
                {
                  text: "Cancelar",
                  style: "cancel",
                },
                {
                  text: "Abrir configurações",
                  onPress: () => Linking.openSettings(),
                },
              ]
            : undefined
        );
        return;
      }

      await getCurrentPositionAsync({
        accuracy: LocationAccuracy.Lowest,
      });

      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Erro ao acessar localização",
        "Não conseguimos acessar sua localização agora. Tente novamente."
      );
      console.error("PermissionLocation: request error", error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSkipPermission = async () => {
    if (isSkippingPermission) return;

    try {
      setIsSkippingPermission(true);
      await skipPermissionRequest("location");
      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      Alert.alert(
        "Não foi possível continuar",
        "Tente novamente ou ajuste essa permissão mais tarde nas configurações."
      );
      console.error("PermissionLocation: skip error", error);
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
            <LocationIllustration width={220} height={220} />
          </View>

          <View style={styles.textBlock}>
            <Text style={[textStyles.titleText, styles.title]}>
              Acesso localização
            </Text>
            <Text style={[textStyles.centeredText, styles.description]}>
              Permita que o iMarket acesse sua localização.
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
                <Text style={styles.buttonText}>Acesso localização</Text>
                <Icon
                  type="MaterialCommunityIcons"
                  name="map-marker-radius"
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
            Usamos sua localização para exibir mercados, ofertas e entregas
            perto de você.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
