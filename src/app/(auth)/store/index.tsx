import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { Input } from "@/src/components/common/Input";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import SearchBar from "@/src/components/common/SearchBar";
import { Theme, useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { DEFAULT_FILTERS, MOCKED_STORES, Store } from "./mockStores";
import createStyles from "./styled";


type StoreFilters = {
  state: string | null;
  city: string | null;
  radiusKm: number | null;
};

export default function StoreScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        MOCKED_STORES.map((store) => [store.id, false])
      ) as Record<string, boolean>
  );
  const [filters, setFilters] = useState<StoreFilters>({
    state: DEFAULT_FILTERS.state,
    city: DEFAULT_FILTERS.city,
    radiusKm: DEFAULT_FILTERS.radiusKm,
  });
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const locationLabel = filters.city && filters.state
    ? `${filters.city} - ${filters.state}`
    : filters.state ?? "Selecionar local";

  const parseDistance = useCallback((distance: string) => {
    const normalized = distance.replace(",", ".").replace(/[^\d.]/g, "");
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? Infinity : parsed;
  }, []);

  const filteredStores = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return MOCKED_STORES.filter((store) => {
      const matchesSearch =
        !normalized ||
        store.name.toLowerCase().includes(normalized) ||
        store.description.toLowerCase().includes(normalized) ||
        store.category.toLowerCase().includes(normalized);

      if (!matchesSearch) {
        return false;
      }

      if (filters.state && store.state !== filters.state) {
        return false;
      }

      if (filters.city && store.city !== filters.city) {
        return false;
      }

      if (
        filters.radiusKm !== null &&
        parseDistance(store.distance) > filters.radiusKm
      ) {
        return false;
      }

      return true;
    });
  }, [filters.city, filters.radiusKm, filters.state, parseDistance, searchTerm]);

  const handleOpenFilters = () => {
    setFilterModalVisible(true);
  };

  const handleStorePress = (store: Store) => {
    router.push(`/(auth)/store/${store.id}`);
  };

  const toggleFavorite = (storeId: string) => {
    setFavoriteStoreIds((current) => ({
      ...current,
      [storeId]: !current[storeId],
    }));
  };

  const handleApplyFilters = (nextFilters: StoreFilters) => {
    setFilters(nextFilters);
    setFilterModalVisible(false);
  };

  const handleCancelFilters = () => {
    setFilterModalVisible(false);
  };

  const handleClearLocation = () => {
    setFilters((current) => ({
      ...current,
      state: null,
      city: null,
    }));
  };

  const handleClearRadius = () => {
    setFilters((current) => ({
      ...current,
      radiusKm: null,
    }));
  };

  const renderStore = ({ item }: ListRenderItemInfo<Store>) => {
    const isFavorite = favoriteStoreIds[item.id];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.storeCard}
        onPress={() => handleStorePress(item)}
      >
        <View style={[styles.storeAvatar, { backgroundColor: item.brandColor }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.storeLogo} />
          ) : (
            <Text style={styles.avatarInitials}>
              {item.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0))
                .join("")
                .toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.storeDetails}>
          <View style={styles.cardHeader}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.name}
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Favoritar ${item.name}`}
              onPress={() => toggleFavorite(item.id)}
              activeOpacity={0.7}
              style={[
                styles.favoriteButton,
                isFavorite && styles.favoriteButtonActive,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                type="MaterialCommunityIcons"
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? theme.colors.onPrimary : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {!item.isOpen && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Fechada</Text>
            </View>
          )}

          <Text style={styles.storeDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon
              type="MaterialCommunityIcons"
              name="star"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.metaText, styles.metaTextWithIcon]}>
              {item.rating.toFixed(1)}
            </Text>
          </View>

          <Text style={styles.metaDivider}>|</Text>

          <Text style={styles.metaText}>{item.category}</Text>

            <Text style={styles.metaDivider}>|</Text>

            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="map-marker"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.metaText, styles.metaTextWithIcon]}>
                {item.distance}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="clock-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.metaText, styles.metaTextWithIcon]}>
                {item.deliveryTime}
              </Text>
            </View>
          </View>

          {item.promotion ? (
            <View style={styles.promoPill}>
              <Icon
                type="MaterialCommunityIcons"
                name="tag-heart"
                size={16}
                color={theme.colors.success}
              />
              <Text style={styles.promoText} numberOfLines={1}>
                {item.promotion}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const listContentStyle = filteredStores.length
    ? styles.listContent
    : [styles.listContent, styles.listContentEmpty];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Lojas" />
        <View style={styles.content}>
          <View style={styles.searchRow}>
            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search..."
            />
          </View>

          <View style={styles.locationRow}>
            <TouchableOpacity
              onPress={handleOpenFilters}
              style={styles.filterShortcut}
              accessibilityRole="button"
              activeOpacity={0.7}
              accessibilityLabel="Abrir filtros"
            >
              <Icon
                type="MaterialCommunityIcons"
                name="tune"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.filterChipsWrapper}>
              {filters.city || filters.state ? (
                <View style={styles.filterChip}>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="map-marker"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.filterChipText}>{locationLabel}</Text>
                  <TouchableOpacity
                    onPress={handleClearLocation}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar localidade"
                    style={styles.filterChipRemove}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon
                      type="MaterialCommunityIcons"
                      name="close-circle"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {filters.radiusKm !== null ? (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    {filters.radiusKm} km
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearRadius}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar raio"
                    style={styles.filterChipRemove}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon
                      type="MaterialCommunityIcons"
                      name="close-circle"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {!filters.city && !filters.state && filters.radiusKm === null ? (
                <TouchableOpacity
                  style={styles.filterChipGhost}
                  onPress={handleOpenFilters}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar filtros"
                >
                  <Text style={styles.filterChipGhostText}>
                    Adicionar filtros
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FlatList
            data={filteredStores}
            keyExtractor={(item) => item.id}
            renderItem={renderStore}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listContentStyle}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="store-off"
                    size={48}
                    color={theme.colors.disabled}
                  />
                </View>
                <Text style={styles.emptyStateText}>
                  Nenhuma loja encontrada para a sua busca.
                </Text>
              </View>
            }
          />
        </View>
      </View>
      <FilterModal
        visible={isFilterModalVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        theme={theme}
        styles={styles}
      />
    </ScreenContainer>
  );
}

const SliderComponent = (() => {
  try {
     
    const sliderModule = require("@react-native-community/slider");
    return sliderModule?.default ?? sliderModule;
  } catch (error) {
    return null;
  }
})();

type DistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  disabled?: boolean;
};

const DistanceSlider = ({
  value,
  onChange,
  min = 1,
  max = 20,
  theme,
  styles,
  disabled = false,
}: DistanceSliderProps) => {
  if (SliderComponent) {
    return (
      <SliderComponent
        value={value}
        onValueChange={(next: number) => onChange(Math.round(next))}
        minimumValue={min}
        maximumValue={max}
        step={1}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.disabled}
        thumbTintColor={theme.colors.primary}
        style={styles.slider}
        disabled={disabled}
      />
    );
  }

  const handleIncrement = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta));
    onChange(next);
  };

  return (
    <View
      style={[
        styles.sliderFallback,
        disabled && styles.sliderDisabled,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.sliderFallbackButton,
          disabled && styles.sliderFallbackButtonDisabled,
        ]}
        onPress={() => handleIncrement(-1)}
        disabled={disabled}
      >
        <Text style={styles.sliderFallbackButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.sliderFallbackValue}>{value} km</Text>
      <TouchableOpacity
        style={[
          styles.sliderFallbackButton,
          disabled && styles.sliderFallbackButtonDisabled,
        ]}
        onPress={() => handleIncrement(1)}
        disabled={disabled}
      >
        <Text style={styles.sliderFallbackButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

type FilterModalProps = {
  visible: boolean;
  filters: StoreFilters;
  onApply: (filters: StoreFilters) => void;
  onCancel: () => void;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
};

const STATE_OPTIONS = ["RS", "SC", "PR"];
const CITY_OPTIONS: Record<string, string[]> = {
  RS: ["Ijui", "Santa Maria", "Porto Alegre"],
  SC: ["Florianopolis", "Joinville", "Blumenau"],
  PR: ["Curitiba", "Londrina", "Maringa"],
};

const FilterModal = ({
  visible,
  filters,
  onApply,
  onCancel,
  theme,
  styles,
}: FilterModalProps) => {
  const [stateValue, setStateValue] = useState(filters.state ?? "");
  const [cityValue, setCityValue] = useState(filters.city ?? "");
  const [radiusValue, setRadiusValue] = useState(filters.radiusKm ?? 5);
  const [radiusEnabled, setRadiusEnabled] = useState(filters.radiusKm !== null);

  useEffect(() => {
    setStateValue(filters.state ?? "");
    setCityValue(filters.city ?? "");
    setRadiusValue(filters.radiusKm ?? 5);
    setRadiusEnabled(filters.radiusKm !== null);
  }, [filters]);

  const availableCities = stateValue
    ? CITY_OPTIONS[stateValue] ?? []
    : [];

  useEffect(() => {
    if (stateValue && availableCities.length > 0 && !availableCities.includes(cityValue)) {
      setCityValue("");
    }
  }, [availableCities, cityValue, stateValue]);

  const handleApply = () => {
    onApply({
      state: stateValue ? stateValue : null,
      city: cityValue ? cityValue : null,
      radiusKm: radiusEnabled ? radiusValue ?? 5 : null,
    });
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.filterModalContainer}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.filterModalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.filterModalCard}>
        <View style={styles.filterModalHandle} />
        <Text style={styles.filterModalTitle}>Filtros</Text>

        <View style={styles.filterFieldGroup}>
          <Text style={styles.filterLabel}>Estado</Text>
          <Input
            value={stateValue}
            onChangeText={(text) => setStateValue(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={2}
            placeholder="Estado"
            style={styles.filterFieldInput}
          />
          <View style={styles.filterOptionRow}>
            {STATE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterOptionBadge,
                  stateValue === option && styles.filterOptionBadgeActive,
                ]}
                onPress={() => setStateValue(option)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    stateValue === option && styles.filterOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterFieldGroup}>
          <Text style={styles.filterLabel}>Cidade</Text>
          <Input
            value={cityValue}
            onChangeText={setCityValue}
            placeholder="Cidade"
            style={styles.filterFieldInput}
            autoCapitalize="words"
          />
          {availableCities.length > 0 ? (
            <View style={styles.filterOptionRow}>
              {availableCities.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOptionBadge,
                    cityValue === option && styles.filterOptionBadgeActive,
                  ]}
                  onPress={() => setCityValue(option)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      cityValue === option && styles.filterOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.filterFieldGroup}>
          <View style={styles.radiusHeader}>
            <Text style={styles.filterLabel}>Em um raio de distancia:</Text>
            <TouchableOpacity
              style={styles.radiusToggle}
              onPress={() => setRadiusEnabled((current) => !current)}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name={radiusEnabled ? "close-circle-outline" : "check-circle"}
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.radiusToggleText}>
                {radiusEnabled ? "Sem limite" : "Com limite"}
              </Text>
            </TouchableOpacity>
          </View>
          <DistanceSlider
            value={radiusValue ?? 5}
            onChange={(value) => {
              setRadiusEnabled(true);
              setRadiusValue(value);
            }}
            min={1}
            max={20}
            theme={theme}
            styles={styles}
            disabled={!radiusEnabled}
          />
          <View style={styles.sliderValueRow}>
            {radiusEnabled ? (
              <>
                <View style={styles.sliderValueBox}>
                  <Text style={styles.sliderValueText}>{radiusValue ?? 5}</Text>
                </View>
                <Text style={styles.sliderValueSuffix}>km</Text>
              </>
            ) : (
              <Text style={styles.sliderValueUnlimited}>Sem limite definido</Text>
            )}
          </View>
        </View>

        <Button
          title="Aplicar Filtros"
          onPress={handleApply}
          style={styles.applyFilterButton}
        />

        <TouchableOpacity
          style={styles.cancelFilterButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelFilterButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
};
