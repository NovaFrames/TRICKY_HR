import { getProfileImageUrl } from "@/hooks/useGetImage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from "react-native";

type ProfileImageProps = {
    customerIdC?: string | null;
    compIdN?: string | number | null;
    empIdN?: string | number | null;
    size?: number;
    borderRadius?: number;
    style?: StyleProp<ImageStyle>;
    fallbackSource?: ImageSourcePropType;
};

export default function ProfileImage({
    customerIdC,
    compIdN,
    empIdN,
    size = 60,
    borderRadius = 4,
    style,
    fallbackSource = require("@/assets/images/emptyprofile.png"),
}: ProfileImageProps) {
    const [uri, setUri] = useState<string>();
    const [imageError, setImageError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Date.now());

    const loadImage = useCallback(() => {
        let mounted = true;
        setImageError(false);

        const resolveImage = async () => {
            const url = await getProfileImageUrl(customerIdC, compIdN, empIdN);
            if (mounted) {
                setUri(url);
                setRefreshKey(Date.now());
            }
        };

        void resolveImage();

        return () => {
            mounted = false;
        };
    }, [customerIdC, compIdN, empIdN]);

    useFocusEffect(loadImage);

    const imageUri = useMemo(() => {
        if (!uri) return undefined;
        const separator = uri.includes("?") ? "&" : "?";
        return `${uri}${separator}v=${refreshKey}`;
    }, [refreshKey, uri]);

    return (
        <Image
            source={!imageUri || imageError ? fallbackSource : { uri: imageUri }}
            onError={() => setImageError(true)}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: borderRadius,
                },
                style,
            ]}
        />
    );
}
