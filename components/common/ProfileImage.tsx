import { getProfileImageUrl } from "@/hooks/useGetImage";
import React, { useEffect, useState } from "react";
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
    borderRadius,
    style,
    fallbackSource = require("@/assets/images/emptyprofile.png"),
}: ProfileImageProps) {
    const [uri, setUri] = useState<string>();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        let mounted = true;
        setImageError(false);

        const loadImage = async () => {
            const url = await getProfileImageUrl(customerIdC, compIdN, empIdN);
            if (mounted) setUri(url);
        };

        loadImage();

        return () => {
            mounted = false;
        };
    }, [customerIdC, compIdN, empIdN]);

    return (
        <Image
            source={!uri || imageError ? fallbackSource : { uri }}
            onError={() => setImageError(true)}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: 4,
                },
                style,
            ]}
        />
    );
}
