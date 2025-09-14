import { Button } from "@/components/common/Button";
import { useTheme } from "@/themes/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createStyles from "./Styled";


const { width } = Dimensions.get("window");

const CarrouselOnboarding = ({ data }) => {
  const { theme, currentTheme } = useTheme();
  const styles = createStyles(theme);

  const router = useRouter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < data.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1 });
    }
  };

  const handleSkip = async () => {
    // flatListRef.current?.scrollToIndex({ index: data.length - 1 });
    router.navigate("/signin");
    await AsyncStorage.setItem("isFirstAccess", "false");
  };

  const handleStart = async () => {
    router.navigate("/signin");
    await AsyncStorage.setItem("isFirstAccess", "false");
  };

  // dots indicadores
  const renderDots = () => {
    return data.map((_, index) => (
      <View
        key={index}
        style={[styles.dot, currentSlide === index ? styles.activeDot : null]}
      />
    ));
  };

  return (
    <View style={[styles.container]}>
      {/* Lista com swipe */}
      <View style={{ height: 700 }}>
        <FlatList
          ref={flatListRef}
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <item.svg width={250} height={250} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.dotsContainer}>{renderDots()}</View>

      <View style={styles.buttonContainer}>
        {currentSlide < data.length - 1 ? (
          <View style={{ flex: 1, marginTop: 20 }}>
            <Button
              title="Próximo"
              onPress={nextSlide}
              style={styles.nextButton}
            />
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Pular</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, marginTop: 20 }}>
            <Button
              title="Começar"
              onPress={handleStart}
              style={styles.getStartedButton}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default CarrouselOnboarding;
