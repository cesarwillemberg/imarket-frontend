import HeaderScreen from "@/components/common/HeaderScreen";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionContext/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, findNodeHandle, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import createStyles from "./styled";

export default function EditProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user } = useSession();

  const [name, setName] = useState<string>("");
  const [cpf, setCPF] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputNameRef = useRef<TextInput>(null);
  const inputCPFRf = useRef<TextInput>(null);
  const inputDateOfBirthRef = useRef<TextInput>(null);

  const handleGetInfoUser = async () => {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", user?.id)
      .single();

      // setUserData(data);
      // setName(data?.nome);
      // setCPF(data?.cpf);
      // set_date_of_birth(data?.data_nascimento);
      // set_email(data?.email);
      // set_phone(data?.telefone);
      
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

  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (!inputRef.current || !scrollViewRef.current) return;

    const inputHandle = findNodeHandle(inputRef.current);
    if (!inputHandle) return;

    scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
      inputHandle,
      20,
      true
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Editar Perfil" />
        <ScrollView
          contentContainerStyle={[styles.container, isLoading ? { justifyContent: "center" } : {}]}
          scrollEnabled={false}
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
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <>
              <View>
                <View>
                  <Text style={{ color: theme.colors.text}}>IMG PERFIL</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

