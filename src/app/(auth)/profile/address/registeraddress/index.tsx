import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useRef, useState } from "react";
import { ScrollView } from "react-native";
import createCommonStyles from "../../chats/styled";
import createStyles from "./styled";


export default function RegisterAddress() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const commonStyles = createCommonStyles(theme);

    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const animationLoading = useRef<LottieView>(null);

    return (
        <ScreenContainer>
            <ScrollView>
                <HeaderScreen title="Registrar Endereço" showButtonBack />
                <>
                    {
                        isLoading || refreshing ? (
                        <LoadingIcon 
                            autoPlay={true} 
                            source={loadingCart} 
                            loop={true}
                            refAnimationLoading={animationLoading}
                        />
                        ) : (
                            <>
                            </>
                        )
                    }
                </>
            </ScrollView>
        </ScreenContainer>
    )
}