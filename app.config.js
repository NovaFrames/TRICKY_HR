const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||"";

module.exports = {
  expo: {
    name: "TidyHr",
    slug: "trickyhr",
    version: "3.5.12",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme: "tidyhr",

    updates: {
      enabled: false,
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mykevit.kevit",
      buildNumber: "4",

      infoPlist: {
        NSCameraUsageDescription:
          "TidyHR uses the camera to scan attendance QR codes and upload employee profile or attendance photos.",
        NSPhotoLibraryUsageDescription:
          "TidyHR uses the photo library so employees can upload profile and attendance images.",
        NSMicrophoneUsageDescription:
          "TidyHR uses the microphone for voice or video communication features.",
        NSLocationWhenInUseUsageDescription:
          "TidyHR uses your location while you use the app to verify workplace attendance and QR check-ins.",

        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },

        UIBackgroundModes: ["fetch"],
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.mykevit.www.trickyhr",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],

      adaptiveIcon: {
        backgroundColor: "#121212",
        foregroundImage: "./assets/images/adptive-icon.png",
        backgroundImage: "./assets/images/background.png",
      },

      versionCode: 118,
      userInterfaceStyle: "automatic",
      predictiveBackGestureEnabled: false,

      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",

      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "TidyHR uses your location while you use the app to verify workplace attendance and QR check-ins.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],

      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            ndkVersion: "26.1.10909125",
            usesCleartextTraffic: true,
            packagingOptions: {
              pickFirst: [],
            },
          },
        },
      ],

      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#121212",
          },
        },
      ],

      "@react-native-community/datetimepicker",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      eas: {
        "projectId": "22f358a6-06e9-4577-bfc6-497c55078a62"
      },
      googleMapsApiKey: googleMapsApiKey || undefined,
    },
  },
};