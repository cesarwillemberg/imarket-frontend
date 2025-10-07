import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import LocationBackground from "@/src/assets/images/address/undraw_destination_fkst.svg";
import { FloatingActionButton } from "@/src/components/auth/FloatingActionButton";
import { Icon } from "@/src/components/common/Icon";
import LoadingIcon from "@/src/components/common/LoadingIcon";
import { Title } from "@/src/components/common/Title/index";
import { useSession } from "@/src/providers/SessionContext/Index";
import { inputAddressProps } from "@/src/services/address-service";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";

export default function Address() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user, getAddresses } = useSession();

  const [addressesRegistered, setAddressRegistered] = useState<inputAddressProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const animationLoading = useRef<LottieView>(null);

  const handleGetAddresses = async () => {
    if(!user) return;
    const { data, error } = await getAddresses({ user_id: user.id });
    if(error) {
      console.error("❌ Erro ao buscar endereços:", error);
      setAddressRegistered([]);
      return;
    }
    if(data && data.length > 0) {
      setAddressRegistered(data);
    } else {
      setAddressRegistered([]);
    }
    
  }

  const fetchData = async () => {
    setIsLoading(true);
    await handleGetAddresses();
    setIsLoading(false);
  };

  useEffect(()=>{
    fetchData();
  },[])

  const onRefresh = async () => {
    setRefreshing(true);
    await handleGetAddresses();
    setRefreshing(false);
  };

  const addressOptions = [
  { id: "home", icon: "home-outline", label: "Casa", type: "MaterialCommunityIcons"},
  { id: "work", icon: "briefcase-outline", label: "Trabalho", type: "MaterialCommunityIcons" },
  { id: "love", icon: "heart-outline", label: "Amor", type: "MaterialCommunityIcons" },
  { id: "school", icon: "school-outline", label: "Escola", type: "MaterialCommunityIcons" },
  { id: "friend", icon: "account-multiple-outline", label: "Amigo", type: "MaterialCommunityIcons" },
  { id: "other", icon: "map-marker-outline", label: "Outro", type: "MaterialCommunityIcons" },
];


  return (
    <ScreenContainer>
      <HeaderScreen title={"Meus Endereços"} showButtonBack  />
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, isLoading || refreshing ? { justifyContent: "center", alignItems: "center" } : {}]}
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
                  <View style={{ flex: 1 }}>
                    {
                      addressesRegistered.length === 0 ? (
                        <View style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "orange",
                          marginTop: "-20%"
                        }} >
                            <LocationBackground width={300} height={300} />
                            <Title 
                              align="center" 
                              style={{fontSize: 20}}
                            >
                              Você ainda não possui nenhum endereço cadastrado
                            </Title>
                        </View>
                      ) : (
                        <View style={{ flex: 1, paddingTop: 20 }}>
                          {
                            addressesRegistered.map((address, index) => (
                              <View key={index} style={{
                                flexDirection: "row",
                                borderWidth: 2,
                                borderColor: theme.colors.primary,
                                borderRadius: 8,
                                padding: theme.spacing.md,
                                marginBottom: theme.spacing.sm,
                                backgroundColor: theme.colors.background,
                              }}>
                                <View style={{ alignItems: "center", flexDirection: "row", flex: 1 }}>
                                  <View style={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: theme.colors.background_forms,
                                    borderRadius: theme.radius.full,
                                    marginRight: theme.spacing.md,
                                    borderColor: theme.colors.primary,
                                    borderWidth: 2,
                                    height: 80,
                                    width: 80,
                                    overflow: "hidden",
                                  }}>
                                    <Icon 
                                      name={addressOptions.find(option => option.id === address.address_type)?.icon} 
                                      type={addressOptions.find(option => option.id === address.address_type)?.type} 
                                      color={theme.colors.primary} 
                                      size={32} 
                                    />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Title style={{ textTransform: "capitalize", marginBottom: 0, padding: 0, display: address.address_type ? "flex" : "none" }}>{address.address_type}</Title>
                                    <Text style={{ color: theme.colors.text, display: address.street ? "flex" : "none" }}>{address.street} { address.street_number ? `,  Nº ${address.street_number}` : ""}</Text>
                                    <Text style={{ color: theme.colors.text, display: address.neighborhood ? "flex" : "none" }}>{address.neighborhood}</Text>
                                    <Text style={{ color: theme.colors.text, display: address.city ? "flex" : "none" }}>{address.city} - {address.state_acronym}</Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.text, display: address.complement ? "flex" : "none" }}>{address.complement}</Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.text, display: address.reference ? "flex" : "none" }}>{address.reference}</Text>
                                  </View>
                                </View>
                                <View 
                                  style={{ 
                                    flexDirection: "row", 
                                    justifyContent: "space-between" 
                                  }}>
                                  <Icon 
                                    name="check-circle-outline"
                                    type="MaterialCommunityIcons"                                    
                                    color={address.is_default ? theme.colors.primary : theme.colors.disabled} 
                                    size={24}
                                  />
                                  <TouchableOpacity onPress={() => {}}>
                                    <Icon 
                                      name="more-vertical"
                                      type="feather"                                   
                                      color={address.is_default ? theme.colors.primary : theme.colors.disabled} 
                                      size={24}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))
                          }
                        </View>
                      )
                    }
                  </View>

                  <FloatingActionButton />
                </>
              )
            }
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

