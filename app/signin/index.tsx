import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

import LogoLight from "@/assets/images/splashscreen/logo.svg";
import LogoDark from "@/assets/images/splashscreen/logo_dark.svg";
import { SignInForm } from "@/components/auth/SignInForm";

import Apple from "@/assets/images/login/apple.svg";
import Facebook from "@/assets/images/login/facebook.svg";
import Google from "@/assets/images/login/google.svg";
import X from "@/assets/images/login/x.svg";
import SocialButton from "@/components/common/SocialButton";


export default function SignIn() {

  const { theme, currentTheme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const handleSingUp = () => {
    router.push("/signup");
  }


  return (
    <ScreenContainer style={{ flex: 1, alignItems: "center", justifyContent: "center"}}>
      <>
        <View style={styles.logo_wrapper}>
          {currentTheme === "light" ? (
            <LogoLight width={250} height={250} />
          ) : (
            <LogoDark width={250} height={250} />
          )}
        </View>
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
      </>
    </ScreenContainer>
  );
};
