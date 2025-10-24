import HeaderScreen from "@/src/components/common/HeaderScreen";
import { Icon } from "@/src/components/common/Icon";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEFAULT_FILTERS, MOCKED_STORES, Store } from "../mockStores";
import createStyles from "./styled";


const SCROLL_STEP = 220;

export default function StoreProfile() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const promoScrollRef = useRef<ScrollView | null>(null);
  const promoOffsetRef = useRef(0);

  const store: Store | undefined = useMemo(
    () => {
      const idValue = Array.isArray(id) ? id[0] : id;
      if (!idValue) return undefined;
      return MOCKED_STORES.find((item) => item.id === idValue);
    },
    [id]
  );

  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleFavorite = () => setIsFavorite((current) => !current);

  const handleScrollPromotions = (direction: "left" | "right") => {
    const node = promoScrollRef.current;
    if (!node) return;

    const current = promoOffsetRef.current;
    const next =
      direction === "left"
        ? Math.max(0, current - SCROLL_STEP)
        : current + SCROLL_STEP;

    promoOffsetRef.current = next;

    node.scrollTo({
      x: next,
      animated: true,
    });
  };

  if (!store) {
    return (
      <ScreenContainer>
        <HeaderScreen title="Loja não encontrada" showButtonBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            Não encontramos informações para esta loja.
          </Text>
          <TouchableOpacity
            style={styles.notFoundButton}
            activeOpacity={0.7}
            onPress={() =>
              router.replace({
                pathname: "/(auth)/store",
                params: {
                  state: DEFAULT_FILTERS.state,
                  city: DEFAULT_FILTERS.city,
                },
              })
            }
          >
            <Text style={styles.notFoundButtonText}>Voltar para lojas</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer safeAreaEdges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          <ImageBackground
            source={{ uri: store.bannerImage }}
            style={styles.bannerImage}
          >
            <View style={styles.bannerOverlay} />
          </ImageBackground>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.7}
          >
            <Icon
              type="feather"
              name="chevron-left"
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.logoWrapper}>
            <Image source={{ uri: store.logo }} style={styles.logo} />
          </View>

          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Adicionar aos favoritos"
            activeOpacity={0.7}
          >
            <Icon
              type="MaterialCommunityIcons"
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? theme.colors.onPrimary : theme.colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.storeName}>{store.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="star"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.metaText}>{store.rating.toFixed(2)}</Text>
            </View>
            <View style={styles.metaSeparator} />
            <Text style={styles.metaText}>{store.category}</Text>
            <View style={styles.metaSeparator} />
            <View style={styles.metaItem}>
              <Icon
                type="MaterialCommunityIcons"
                name="map-marker"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.metaText}>{store.distance}</Text>
            </View>
          </View>

          {store.promotion ? (
            <View style={styles.summaryPromo}>
              <Icon
                type="MaterialCommunityIcons"
                name="tag-heart"
                size={16}
                color={theme.colors.success}
              />
              <Text style={styles.summaryPromoText}>{store.promotion}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.sectionText}>{store.about}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              {store.info.map((item) => (
                <View style={styles.infoItem} key={item.label}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoColumn}>
              {store.workingHours.map((item) => (
                <View style={styles.infoItem} key={item.label}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos em Promoção</Text>
            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.7}
              style={styles.sectionLinkWrapper}
            >
              <Text style={styles.sectionLink}>Ver Tudo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promoCarousel}>
            <TouchableOpacity
              onPress={() => handleScrollPromotions("left")}
              style={styles.carouselArrow}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name="chevron-left"
                size={26}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <ScrollView
              horizontal
              ref={promoScrollRef}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoList}
              onScroll={(event) => {
                promoOffsetRef.current = event.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
            >
              {store.promotions.map((promo) => (
                <View style={styles.promoCard} key={promo.id}>
                  <Image source={{ uri: promo.image }} style={styles.promoImage} />
                  <Text style={styles.promoName} numberOfLines={2}>
                    {promo.name}
                  </Text>
                  {promo.originalPrice ? (
                    <Text style={styles.promoOriginal}>
                      De {promo.originalPrice}
                    </Text>
                  ) : null}
                  <Text style={styles.promoPrice}>
                    Por {promo.price} <Text style={styles.promoUnit}>{promo.unit}</Text>
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => handleScrollPromotions("right")}
              style={styles.carouselArrow}
              activeOpacity={0.7}
            >
              <Icon
                type="MaterialCommunityIcons"
                name="chevron-right"
                size={26}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {}}
          activeOpacity={0.7}
          style={styles.footerLinkWrapper}
        >
          <Text style={styles.footerLink}>
            Ver todos produtos de {store.name}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
