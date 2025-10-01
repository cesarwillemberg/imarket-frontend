import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import createStyles from "./styled";

import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import LocationBackground from "@/src/assets/images/address/undraw_destination_fkst.svg";
import { FloatingActionButton } from "@/src/components/auth/FloatingActionButton";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { Title } from "@/src/components/common/Title/index";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";

export default function Address() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [isAddressRegistered, setAddressRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const animationLoading = useRef<LottieView>(null);

  const handleGetInfoUser = async () => {
    // if (!user || !user.id) {
    //   console.warn("Usuário não disponível ou ID indefinido.");
    //   return;
    // }

    // try {
    //   const data = await getInfoUser({id: user.id});

    //   setProfilePicture(data.profile_picture || "")
    //   setName(data.nome || "");
    //   setCPF(data.cpf || "");
    //   set_date_of_birth(data.data_nascimento || "");
    //   set_email(data.email || "");
    //   set_phone(data.telefone || "");
      
    // } catch (error) {
    //   console.error("Erro ao buscar informações do usuário:", error);
    // }

    // setAddressRegistered(false);
  }

  const fetchData = async () => {
    setIsLoading(true);
    await handleGetInfoUser();
    setIsLoading(false);
  };

  useEffect(()=>{
    fetchData();
  },[])

  const onRefresh = async () => {
    setRefreshing(true);
    await handleGetInfoUser();
    setRefreshing(false);
  };


  return (
    <ScreenContainer>
      <HeaderScreen title={"Meus Endereços"} showButtonBack  />
        <ScrollView 
          contentContainerStyle={[styles.container, isLoading || refreshing ? { justifyContent: "center", alignItems: "center" } : {}]}
          // scrollEnabled={false}
          refreshControl={
            <RefreshControl   
              refreshing={refreshing}
              onRefresh={onRefresh}
              title="Carregando..."
              colors={['#ff0000', '#00ff00', '#0000ff']}
              tintColor="#ff0000"
              titleColor="#00ff00" 
              />
          }
        >
          <View style={styles.container}>
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
                  <View style={{
                    justifyContent: "center", 
                    alignContent: "center", 
                    marginTop: "-40%",
                    flex: 1,
                  }}>
                    {
                      isAddressRegistered ? (
                        <>
                          <Text style={{color: theme.colors.text}}>AAAAA</Text>
                        </>
                      ) : (
                        <View style={{
                          alignItems: "center",
                          justifyContent: "center", 
                        }} >
                            <LocationBackground width={300} height={300} />
                            <Title 
                              align="center" 
                              style={{fontSize: 20}}
                            >
                              Você ainda não possui nenhum endereço cadastrado
                            </Title>
                        </View>
                      )
                    }
                  </View>

                  <FloatingActionButton />
                </>
              )
            }
          </View>
      </ScrollView>
    </ScreenContainer>
  );
}

