import createTabStyles from "@/src/assets/styles/tabStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { Input } from "@/src/components/common/Input";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

type PickerType = "date" | "start" | "end";

const formatDate = (value: Date | null) => {
  if (!value) {
    return "";
  }
  return value.toLocaleDateString("pt-BR");
};

const formatTime = (value: Date | null) => {
  if (!value) {
    return "";
  }
  return value.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DeliveryDateAndTime = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarBaseStyle = useMemo(() => createTabStyles(theme).tabBar, [theme]);

  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    addressLine?: string | string[];
    destinationLabel?: string | string[];
  }>();

  const addressLineParam = Array.isArray(params.addressLine)
    ? params.addressLine[0]
    : params.addressLine;
  const destinationLabelParam = Array.isArray(params.destinationLabel)
    ? params.destinationLabel[0]
    : params.destinationLabel;

  const [deliveryDate, setDeliveryDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [startTime, setStartTime] = useState<Date>(() => {
    const next = new Date();
    next.setHours(14, 0, 0, 0);
    return next;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const next = new Date();
    next.setHours(15, 0, 0, 0);
    return next;
  });
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) {
        return;
      }

      parent.setOptions({
        tabBarStyle: [tabBarBaseStyle, { display: "none" }],
      });

      return () => {
        parent.setOptions({
          tabBarStyle: tabBarBaseStyle,
        });
      };
    }, [navigation, tabBarBaseStyle])
  );

  const applyPickerValue = useCallback(
    (pickerType: PickerType, selected?: Date) => {
      if (!selected) {
        return;
      }

      if (pickerType === "date") {
        setDeliveryDate(selected);
        return;
      }

      if (pickerType === "start") {
        setStartTime(selected);
        if (selected >= endTime) {
          const adjusted = new Date(selected.getTime());
          adjusted.setHours(selected.getHours() + 1);
          setEndTime(adjusted);
        }
        return;
      }

      if (pickerType === "end") {
        if (selected <= startTime) {
          const adjusted = new Date(startTime.getTime());
          adjusted.setHours(startTime.getHours() + 1);
          setEndTime(adjusted);
          return;
        }
        setEndTime(selected);
      }
    },
    [endTime, startTime]
  );

  const handlePickerChange = useCallback(
    (pickerType: PickerType) =>
      (event: DateTimePickerEvent, selected?: Date) => {
        if (event.type === "set") {
          applyPickerValue(pickerType, selected);
        }

        if (Platform.OS === "android") {
          setActivePicker(null);
        }
      },
    [applyPickerValue]
  );

  const showPicker = useCallback((picker: PickerType) => {
    setActivePicker(picker);
  }, []);

  const onContinue = useCallback(() => {
    router.push("/(auth)/cart/finalizeorder");
  }, [router]);

  const shouldDisableContinue = !deliveryDate || !startTime || !endTime;

  return (
    <ScreenContainer style={styles.container}>
      <HeaderScreen title="Finalizar Pedido" showButtonBack />
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Escolha quando sua compra chegará</Text>
          {addressLineParam ? (
            <View style={styles.addressRow}>
              <View style={styles.addressIconWrapper}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="map-marker"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.addressText}>
                Envio para: {addressLineParam}
              </Text>
            </View>
          ) : destinationLabelParam ? (
            <View style={styles.addressRow}>
              <View style={styles.addressIconWrapper}>
                <Icon
                  type="MaterialCommunityIcons"
                  name="storefront"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.addressText}>
                Retirada em: {destinationLabelParam}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Desejo receber meu pedido dia:</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => showPicker("date")}
            style={styles.inputTouchable}
          >
            <Input
              value={formatDate(deliveryDate)}
              editable={false}
              pointerEvents="none"
              style={styles.input}
            />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.cardLabel}>Entre:</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => showPicker("start")}
                style={styles.inputTouchable}
              >
                <Input
                  value={formatTime(startTime)}
                  editable={false}
                  pointerEvents="none"
                  style={styles.input}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.timeColumn, styles.timeColumnLast]}>
              <Text style={styles.cardLabel}>Até:</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => showPicker("end")}
                style={styles.inputTouchable}
              >
                <Input
                  value={formatTime(endTime)}
                  editable={false}
                  pointerEvents="none"
                  style={styles.input}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.shippingRow}>
          <Text style={styles.shippingLabel}>Frete</Text>
          <Text style={styles.shippingValue}>Grátis</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.continueButton,
            shouldDisableContinue && styles.continueButtonDisabled,
          ]}
          disabled={shouldDisableContinue}
          onPress={onContinue}
        >
          <Text style={styles.continueButtonText}>Continuar a compra</Text>
        </TouchableOpacity>
      </View>

      {activePicker ? (
        Platform.OS === "ios" ? (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={
                  activePicker === "date"
                    ? deliveryDate
                    : activePicker === "start"
                    ? startTime
                    : endTime
                }
                mode={activePicker === "date" ? "date" : "time"}
                is24Hour
                display="spinner"
                onChange={handlePickerChange(activePicker)}
                minimumDate={activePicker === "date" ? new Date() : undefined}
              />
              <TouchableOpacity
                style={styles.pickerCloseButton}
                onPress={() => setActivePicker(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerCloseText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <DateTimePicker
            value={
              activePicker === "date"
                ? deliveryDate
                : activePicker === "start"
                ? startTime
                : endTime
            }
            mode={activePicker === "date" ? "date" : "time"}
            is24Hour
            display="default"
            onChange={handlePickerChange(activePicker)}
            minimumDate={activePicker === "date" ? new Date() : undefined}
          />
        )
      ) : null}
    </ScreenContainer>
  );
};

export default DeliveryDateAndTime;
