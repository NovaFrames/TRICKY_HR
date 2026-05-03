const { expo } = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  expo?.android?.config?.googleMaps?.apiKey ||
  "";

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      config: {
        ...(expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    extra: {
      ...expo.extra,
      googleMapsApiKey: googleMapsApiKey || undefined,
    },
  },
};
