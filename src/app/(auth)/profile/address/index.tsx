import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
  const { user, getAddresses, deleteAddress } = useSession();

  const [addressesRegistered, setAddressRegistered] = useState<inputAddressProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<inputAddressProps | null>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const animationLoading = useRef<LottieView>(null);

  const handleGetAddresses = async () => {
    if(!user) return;
    const { data, error } = await getAddresses({ user_id: user.id });
    if(error) {
      console.error("âŒ Erro ao buscar endereços:", error);
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

  const handleOpenOptions = (address: inputAddressProps) => {
    const rawId =
      address.address_id ??
      (address as Record<string, unknown>)?.["id"] ??
      (address as Record<string, unknown>)?.["address_id"] ??
      (address as Record<string, unknown>)?.["addressId"];

    const normalizedAddress = {
      ...address,
      id: rawId !== undefined && rawId !== null ? String(rawId) : undefined,
    };

    setSelectedAddress(normalizedAddress);
    setIsOptionsModalVisible(true);
  };

  const handleCloseOptions = () => {
    setIsOptionsModalVisible(false);
    setSelectedAddress(null);
    setIsDeletingAddress(false);
    setIsConfirmDeleteVisible(false);
  };

  const handleDeletePress = () => {
    if (!selectedAddress?.address_id) {
      Alert.alert("Error", "Could not identify the selected address.");
      return;
    }

    if (!user || isDeletingAddress) {
      return;
    }

    setIsConfirmDeleteVisible(true);
  };

  const handleCancelDelete = () => {
    if (isDeletingAddress) {
      return;
    }
    setIsConfirmDeleteVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAddress?.address_id || !user || isDeletingAddress) {
      return;
    }

    try {
      setIsDeletingAddress(true);
      const { error } = await deleteAddress({
        address_id: String(selectedAddress.address_id),
        user_id: user.id,
      });

      if (error) {
        Alert.alert("Error", "Could not delete the address. Please try again.");
        return;
      }

      await handleGetAddresses();
      setIsConfirmDeleteVisible(false);
      handleCloseOptions();
      Alert.alert("Success", "Address deleted successfully.");
    } catch (error) {
      console.error("Error deleting address:", error);
      Alert.alert("Error", "Something went wrong while deleting the address.");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleEditAddress = () => {
    if (!selectedAddress) return;
    console.log("Edit address", selectedAddress.address_id);
    handleCloseOptions();
  };

  const handleMakeDefault = () => {
    if (!selectedAddress) return;
    console.log("Make default address", selectedAddress.address_id);
    handleCloseOptions();
  };


  return (
    <ScreenContainer>
      <HeaderScreen title={"Meus endereços"} showButtonBack  />
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
                                  <TouchableOpacity onPress={() => handleOpenOptions(address)}>
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
        <Modal
          animationType="slide"
          transparent
          visible={isOptionsModalVisible}
          onRequestClose={handleCloseOptions}
        >
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={handleCloseOptions}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedAddress?.address_type
                  ? selectedAddress.address_type.charAt(0).toUpperCase() +
                    selectedAddress.address_type.slice(1)
                  : "Endereco"}
              </Text>
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.deleteButton,
                    isDeletingAddress && styles.actionButtonDisabled,
                  ]}
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                  disabled={isDeletingAddress}
                >
                  <Icon
                    name="trash-can-outline"
                    type="MaterialCommunityIcons"
                    size={22}
                    color={isDeletingAddress ? theme.colors.disabled : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.deleteButtonText,
                      isDeletingAddress && styles.deleteButtonTextDisabled,
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditAddress}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="pencil-outline"
                    type="MaterialCommunityIcons"
                    size={22}
                    color={theme.colors.text}
                  />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleMakeDefault}
                activeOpacity={0.85}
              >
                <Icon
                  name="check-circle-outline"
                  type="MaterialCommunityIcons"
                  size={22}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.primaryButtonText}>Make it a default address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={isConfirmDeleteVisible}
          onRequestClose={handleCancelDelete}
        >
          <View style={styles.confirmOverlay}>
            <TouchableWithoutFeedback onPress={handleCancelDelete}>
              <View style={styles.confirmBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmTitle}>
                Are you sure you want to delete this address?
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[
                    styles.confirmPrimaryButton,
                    isDeletingAddress && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmDelete}
                  activeOpacity={0.7}
                  disabled={isDeletingAddress}
                >
                  <Text style={styles.confirmPrimaryText}>
                    {isDeletingAddress ? "Removing..." : "Yes"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmSecondaryButton,
                    isDeletingAddress && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleCancelDelete}
                  activeOpacity={0.7}
                  disabled={isDeletingAddress}
                >
                  <Text style={styles.confirmSecondaryText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}









