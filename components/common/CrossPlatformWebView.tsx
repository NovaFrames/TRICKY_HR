import React, { useMemo, useState } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type CrossPlatformWebViewProps = {
  source: { uri: string };
  style?: StyleProp<ViewStyle>;
  startInLoadingState?: boolean;
  renderLoading?: () => React.ReactNode;
  onError?: (event: { nativeEvent: any }) => void;
  onHttpError?: (event: { nativeEvent: any }) => void;
  originWhitelist?: string[];
  setSupportMultipleWindows?: boolean;
};

const CrossPlatformWebView: React.FC<CrossPlatformWebViewProps> = (props) => {
  const [loading, setLoading] = useState(Boolean(props.startInLoadingState));
  const wrapperStyle = useMemo(
    () => [styles.wrapper, props.style] as StyleProp<ViewStyle>,
    [props.style],
  );

  if (Platform.OS !== "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NativeWebView = require("react-native-webview").WebView;
    return <NativeWebView {...props} />;
  }

  const {
    source,
    renderLoading,
    onError,
  } = props;

  return (
    <View style={wrapperStyle}>
      {loading && (
        <View style={styles.loadingLayer}>
          {renderLoading ? renderLoading() : null}
        </View>
      )}
      {React.createElement("iframe", {
        src: source?.uri || "",
        style: styles.iframe as any,
        allow: "fullscreen",
        onLoad: () => setLoading(false),
        onError: () => {
          setLoading(false);
          onError?.({
            nativeEvent: { description: "Failed to load document preview." },
          });
        },
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  loadingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  },
});

export default CrossPlatformWebView;
