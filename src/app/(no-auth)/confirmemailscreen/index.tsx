import { Button } from "@/src/components/common/Button";
import BackButton from "@/src/components/common/BackButton";
import Logo from "@/src/components/common/Logo";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Title } from "@/src/components/common/Title";
import { useTheme } from "@/src/themes/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

type ConfirmEmailParams = {
  email?: string | string[];
};

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<ConfirmEmailParams>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const parsedEmail = Array.isArray(email) ? email[0] : email;
  const emailTarget = parsedEmail ?? "o seu email";

  return (
    <ScreenContainer safeAreaEdges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <BackButton />
        </View>

        <View style={styles.body}>
          <Logo />
          <Title align="center" style={styles.title}>
            Confirmar Email
          </Title>
          <Text style={styles.description}>
            Foi enviado um email de confirmação para{" "}
            <Text style={styles.email}>{emailTarget}</Text>. Por favor,
            verifique-o para poder efetuar o login.
          </Text>
        </View>

        <Button
          title="CONFIRMAR"
          onPress={() => router.replace("/signin")}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
}
