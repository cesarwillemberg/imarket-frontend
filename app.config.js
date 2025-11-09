import 'dotenv/config';

export default {
  expo: {
    name: "iMarket",
    slug: "iMaerket-frontend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    scheme: "imarketfrontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: {
      policy: "appVersion",
    },
    packagerOpts: {
      config: "metro.config.js",
      sourceExts: ["js", "jsx", "ts", "tsx", "svg"],
    },
    ios: {
      supportsTablet: true,
      buildNumber: "1",
      // bundleIdentifier: "com.cesar.willemberg.imarket_frontend",
    },
    android: {
      versionCode: 3,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./src/assets/images/android-icon-foreground.png",
        backgroundImage: "./src/assets/images/android-icon-background.png",
        monochromeImage: "./src/assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: "resize",
      userInterfaceStyle: "automatic",
      permissions: [
        "android.permission.WAKE_LOCK",
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "com.google.android.gms.permission.AD_ID",
      ],
      package: "com.cesar.willemberg.imarket_frontend",
      config: {
        googleMaps: {
          apiKey: "AIzaSyC0thWUzUQmTAouTt0O3gh3PMBnIpSpg7M",
        }
      }
    },
    web: {
      output: "static",
      favicon: "./src/assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/android-icon-foreground.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-font",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Permita que o $(PRODUCT_NAME) acesse suas fotos para poder escolher sua foto de perfil.",
        },
      ],
      [
        "expo-maps",
        {
          "requestLocationPermission": true,
          "locationPermission": "Allow $(PRODUCT_NAME) to use your location"
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Permita que o $(PRODUCT_NAME) acesse sua localizacao mesmo em segundo plano para encontrar lojas proximas.",
          locationWhenInUsePermission:
            "Permita que o $(PRODUCT_NAME) acesse sua localizacao enquanto voce usa o app para selecionar enderecos no mapa.",
        },
      ],
      [
        "react-native-edge-to-edge",
        {
          android: {
            parentTheme: "Default",
            enforceNavigationBarContrast: false,
          },
        },
      ],
      "expo-web-browser",
      "expo-tracking-transparency",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "35dd46f1-e04e-4cc2-95aa-65527414d05a",
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
