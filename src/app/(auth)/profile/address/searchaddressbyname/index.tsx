import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import createCommonStyles from "../../chats/styled";
import createStyles from "./styled";


export default function SearchAddressByName() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const commonStyles = createCommonStyles(theme);

    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingButton, setIsLoadingButton] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    const animationLoading = useRef<LottieView>(null);


    const onRefresh = async () => {
        setRefreshing(true);
        try {
            
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);


    return (
        <ScreenContainer>
            <View style={styles.container}>
                <HeaderScreen title="Buscar Endereço" showButtonBack />
                <ScrollView
                  style={styles.scrollView}
                    contentContainerStyle={[
                    styles.scrollViewContent,
                    isLoading || refreshing
                        ? styles.loadingContainer
                        : styles.contentContainer,
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            title="Carregando..."
                            colors={["#ff0000", "#00ff00", "#0000ff"]}
                            tintColor="#ff0000"
                            titleColor="#00ff00"
                        />
                    }
                >
                {isLoading || refreshing ? (
                    <LoadingIcon
                        autoPlay
                        source={loadingCart}
                        loop
                        refAnimationLoading={animationLoading}
                    />
                ) : (
                    <View>
                        
                    </View>
                )}

                </ScrollView>
            </View>
        </ScreenContainer>
    );
}