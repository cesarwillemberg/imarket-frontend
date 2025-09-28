import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";


import Apple from "@/src/assets/images/login/apple.svg";
import Facebook from "@/src/assets/images/login/facebook.svg";
import Google from "@/src/assets/images/login/google.svg";
import X from "@/src/assets/images/login/x.svg";
import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { SignInForm } from "@/src/components/auth/SignInForm";
import Logo from "@/src/components/common/Logo";
import SocialButton from "@/src/components/common/SocialButton";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useEffect } from "react";


export default function SignIn() {

  const { theme, currentTheme } = useTheme();
  const styles = createStyles(theme);
  const stylesCommon = createCommonStyles(theme);
  const router = useRouter();
  const { session, user} = useSession();

  useEffect(() => {
    if (session) {
      router.replace("/(auth)/home");
    }
  }, [session, router]);


  const handleSingUp = () => {
    router.push("/signup");
  }


  return (
    <ScreenContainer>
      <View style={stylesCommon.centeredContainer}>
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
      </View>
    </ScreenContainer>
  );
};
