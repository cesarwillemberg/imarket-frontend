import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import Apple from "@/src/assets/images/login/apple.svg";
import Facebook from "@/src/assets/images/login/facebook.svg";
import Google from "@/src/assets/images/login/google.svg";
import X from "@/src/assets/images/login/x.svg";
import { SignInForm } from "@/src/components/auth/SignInForm";
import Logo from "@/src/components/common/Logo";
import SocialButton from "@/src/components/common/SocialButton";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
} from "@/src/utils/permissions";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";


export default function SignIn() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const stylesCommon = createCommonStyles(theme);
  const router = useRouter();
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    let isMounted = true;

    const redirect = async () => {
      try {
        const pendingRoute = await getPendingPermissionRoute();
        if (!isMounted) return;

        router.replace(pendingRoute ?? HOME_ROUTE);
      } catch (error) {
        console.error("SignIn: failed to check permissions", error);
        if (isMounted) {
          router.replace(HOME_ROUTE);
        }
      }
    };

    redirect();

    return () => {
      isMounted = false;
    };
  }, [router, session]);


  const handleSingUp = () => {
    router.push("/signup");
  }


  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={stylesCommon.centeredContainer}>
        <Logo />
        <View style={styles.form_wrapper}>
          <SignInForm />
          <View style={styles.register_container}>
            <Text style={styles.register_prompt_text}>
              Não possui uma conta?
            </Text>
            <TouchableOpacity onPress={handleSingUp}>
              <Text style={styles.register_link}>CADASTRE-SE</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <Text style={styles.divider_text}>OU</Text>
        </View>
        <View style={styles.social_login_wrapper}>
          <SocialButton icon={<Facebook width={60} height={60}/>} onPress={() => console.log("Login com Facebook")}/>
          <SocialButton icon={<X width={60} height={60}/>} onPress={() => console.log("Login com X")}/>
          <SocialButton icon={<Apple width={60} height={60}/>} onPress={() => console.log("Login com Apple")}/>
          <SocialButton icon={<Google width={60} height={60}/>} onPress={() => console.log("Login com Google")}/>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};
