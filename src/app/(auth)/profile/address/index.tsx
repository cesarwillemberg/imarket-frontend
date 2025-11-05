import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
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
import { Title } from "@/src/components/common/Title";
import { useSession } from "@/src/providers/SessionContext/Index";
import { inputAddressProps } from "@/src/services/address-service";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useRef, useState } from "react";

const ADDRESS_OPTIONS = [
  { id: "Casa", icon: "home-outline", label: "Casa", type: "MaterialCommunityIcons" },
  { id: "Trabalho", icon: "briefcase-outline", label: "Trabalho", type: "MaterialCommunityIcons" },
  { id: "Amor", icon: "heart-outline", label: "Amor", type: "MaterialCommunityIcons" },
  { id: "Escola", icon: "school-outline", label: "Escola", type: "MaterialCommunityIcons" },
  { id: "Amigo", icon: "account-multiple-outline", label: "Amigo", type: "MaterialCommunityIcons" },
  { id: "Outro", icon: "map-marker-outline", label: "Outro", type: "MaterialCommunityIcons" },
] as const;

export default function Address() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    user,
    getAddresses,
    deleteAddress,
    changeDefaultAddress,
  } = useSession();
  const router = useRouter();

  const [addresses, setAddresses] = useState<inputAddressProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<inputAddressProps | null>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const animationLoading = useRef<LottieView>(null);

  const loadAddresses = async () => {
    if (!user) return;

    const { data, error } = await getAddresses({ user_id: user.id });
    if (error) {
      console.error("Error fetching addresses:", error);
      setAddresses([]);
      return;
    }

    const safeAddresses = Array.isArray(data) ? data : [];
    const sortedAddresses = [...safeAddresses].sort((a, b) => {
      const parseTimestamp = (value?: string) => {
        if (typeof value !== "string") {
          return 0;
        }
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const aTimestamp = parseTimestamp(a.created_at);
      const bTimestamp = parseTimestamp(b.created_at);

      if (aTimestamp === bTimestamp) {
        return 0;
      }

      return aTimestamp - bTimestamp;
    });
    setAddresses(sortedAddresses);
  };

  const handleInitialFetch = async () => {
    setIsLoading(true);
    await loadAddresses();
    setIsLoading(false);
  };

  useEffect(() => {
    handleInitialFetch();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleOpenOptions = (address: inputAddressProps) => {
    setSelectedAddress(address);
    setIsOptionsModalVisible(true);
    setIsConfirmDeleteVisible(false);
    setIsDeleting(false);
    setIsSettingDefault(false);
  };

  const handleCloseOptions = () => {
    setIsOptionsModalVisible(false);
    setSelectedAddress(null);
    setIsConfirmDeleteVisible(false);
    setIsDeleting(false);
    setIsSettingDefault(false);
  };

  const handleDeletePress = () => {
    if (!selectedAddress) return;

    const targetId = selectedAddress.address_id;
    if (!targetId) {
      Alert.alert("Error", "Could not identify the selected address.");
      return;
    }

    if (selectedAddress.is_default) {
      Alert.alert(
        "Default address",
        "You cannot delete your default address. Set another address as default first."
      );
      return;
    }

    if (!user || isDeleting) return;
    setIsConfirmDeleteVisible(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setIsConfirmDeleteVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAddress || !user || isDeleting) return;

    const targetId = selectedAddress.address_id;
    if (!targetId) {
      Alert.alert("Error", "Could not identify the selected address.");
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await deleteAddress({
        address_id: String(targetId),
        user_id: user.id,
      });

      if (error) {
        Alert.alert("Error", "Could not delete the address. Please try again.");
        return;
      }

      await loadAddresses();
      setIsConfirmDeleteVisible(false);
      handleCloseOptions();
      Alert.alert("Success", "Address deleted successfully.");
    } catch (error) {
      console.error("Error deleting address:", error);
      Alert.alert("Error", "Something went wrong while deleting the address.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMakeDefault = async () => {
    if (!selectedAddress || selectedAddress.is_default || !user || isSettingDefault) return;

    const targetId = selectedAddress.address_id;
    if (!targetId) {
      Alert.alert("Error", "Could not identify the selected address.");
      return;
    }

    try {

      const input = {
        user_id: user.id,
        address_id: String(targetId),
      }

      setIsSettingDefault(true);
      const { data, error } = await changeDefaultAddress(input);

      if (error) {
        Alert.alert("Error", "Could not update the default address. Please try again.");
        return;
      }

      await loadAddresses();
      Alert.alert("Success", "Default address updated.");
      handleCloseOptions();
    } catch (error) {
      console.error("Error updating default address:", error);
      Alert.alert("Error", "Something went wrong while updating the default address.");
    } finally {
      setIsSettingDefault(false);
    }
  };


  const handleEditAddress = () => {
    if (!selectedAddress) return;

    router.push({
      pathname: '/(auth)/profile/address/selecteditaddress',
      params: { address: JSON.stringify(selectedAddress) }
    })

    handleCloseOptions();
  };

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <LocationBackground width={300} height={300} />
        <Title align="center" style={styles.emptyStateTitle}>
          Você ainda não possui nenhum endereço cadastrado
        </Title>
      </View>
    ),
    [styles.emptyState, styles.emptyStateTitle]
  );

  const renderAddressCard = (address: inputAddressProps, index: number) => {
    const option = ADDRESS_OPTIONS.find((optionItem) => optionItem.id === address.address_type);

    return (
      <View
        key={`${address.address_id ?? index}`}
        style={[
          styles.addressCard,
          address.is_default && styles.addressCardActive,
        ]}
      >
        <View style={styles.addressInfoRow}>
          <View style={styles.addressIconWrapper}>
            <Icon
              name={option?.icon ?? "map-marker-outline"}
              type={option?.type ?? "MaterialCommunityIcons"}
              color={theme.colors.primary}
              size={32}
            />
          </View>
          <View style={styles.addressDetails}>
            <Title
              style={[
                styles.addressTitle,
                address.address_type ? undefined : styles.hidden,
              ]}
            >
              {address.address_type}
            </Title>
            <Text
              style={[
                styles.addressLine,
                address.street ? undefined : styles.hidden,
              ]}
            >
              {address.street}
              {address.street_number ? `, Nº ${address.street_number}` : ""}
            </Text>
            <Text
              style={[
                styles.addressLine,
                address.neighborhood ? undefined : styles.hidden,
              ]}
            >
              {address.neighborhood}
            </Text>
            <Text
              style={[
                styles.addressLine,
                address.city ? undefined : styles.hidden,
              ]}
            >
              {address.city}
              {address.state_acronym ? ` - ${address.state_acronym}` : ""}
            </Text>
            <Text
              style={[
                styles.addressMeta,
                address.complement ? undefined : styles.hidden,
              ]}
            >
              {address.complement}
            </Text>
            <Text
              style={[
                styles.addressMeta,
                address.reference ? undefined : styles.hidden,
              ]}
            >
              {address.reference}
            </Text>
          </View>
        </View>
        <View style={styles.addressActions}>
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
    );
  };

  const isDefaultButtonDisabled = selectedAddress?.is_default || isSettingDefault;
  const defaultButtonLabel = selectedAddress?.is_default
    ? "Already the default address"
    : isSettingDefault
      ? "Setting default..."
      : "Make it a default address";

  return (
    <ScreenContainer>
      <HeaderScreen title="Meus endereços" showButtonBack />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            (isLoading || refreshing) && styles.scrollContainerCentered,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              title="Atualizando..."
              titleColor={theme.colors.primary}
            />
          }
        >
          {isLoading || refreshing ? (
            <LoadingIcon
              autoPlay
              loop
              source={loadingCart}
              refAnimationLoading={animationLoading}
            />
          ) : (
            <>
              <View style={styles.listWrapper}>
                {addresses.length === 0 ? (
                <View style={styles.emptyState}>
                  <LocationBackground width={300} height={300} />
                  <Title align="center" style={styles.emptyStateTitle}>
                    Você ainda não possui nenhum endereço cadastrado
                  </Title>
                </View>
              ) : (
                addresses.map(renderAddressCard)
              )}
              </View>
            </>
          )}
        </ScrollView>

        <FloatingActionButton />

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
                  : "Endereços"}
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.deleteButton,
                    isDeleting && styles.actionButtonDisabled,
                  ]}
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                  disabled={isDeleting}
                >
                  <Icon
                    name="trash-can-outline"
                    type="MaterialCommunityIcons"
                    size={22}
                    color={isDeleting ? theme.colors.disabled : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.deleteButtonText,
                      isDeleting && styles.deleteButtonTextDisabled,
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
                style={[
                  styles.primaryButton,
                  isDefaultButtonDisabled && styles.primaryButtonDisabled,
                ]}
                onPress={handleMakeDefault}
                activeOpacity={0.85}
                disabled={isDefaultButtonDisabled}
              >
                <Icon
                  name="check-circle-outline"
                  type="MaterialCommunityIcons"
                  size={22}
                  color={isDefaultButtonDisabled ? theme.colors.disabled : theme.colors.onPrimary}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    isDefaultButtonDisabled && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {defaultButtonLabel}
                </Text>
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
                    isDeleting && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmDelete}
                  activeOpacity={0.7}
                  disabled={isDeleting}
                >
                  <Text style={styles.confirmPrimaryText}>
                    {isDeleting ? "Removing..." : "Yes"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmSecondaryButton,
                    isDeleting && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleCancelDelete}
                  activeOpacity={0.7}
                  disabled={isDeleting}
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

