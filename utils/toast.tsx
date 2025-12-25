import { Text, TouchableOpacity, View } from "react-native";
import { ToastConfig } from "react-native-toast-message";

import { Icon } from "../components/ui/Icon";
import { AppImage } from "../components/ui/Image";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import { Images } from "../constants/Images";
import { heightPixel, spacingPixel } from "./pixelHelper";

export const toastConfig = {
  success: ({ text1, onPress }: { text1: string; onPress?: () => void }) => (
    <TouchableOpacity
      disabled={!onPress}
      activeOpacity={0.9}
      onPress={() => {
        onPress?.();
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "95%",
          minHeight: heightPixel(60),
          backgroundColor: Colors.toastBackground,
          borderRadius: spacingPixel(20),
          marginTop: spacingPixel(20),
          paddingVertical: spacingPixel(12),
          paddingHorizontal: spacingPixel(16),
        }}
      >
        <Icon
          type="feather"
          name="check-circle"
          size={24}
          color={Colors.white}
          style={{ marginRight: spacingPixel(12) }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            color: Colors.white,
            fontFamily: Fonts.SFProSemiBold,
            flexWrap: "wrap",
          }}
        >
          {text1}
        </Text>
      </View>
    </TouchableOpacity>
  ),
  error: ({ text1 }: { text1: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: "95%",
        minHeight: heightPixel(60),
        backgroundColor: Colors.toastBackgroundDanger,
        borderRadius: spacingPixel(20),
        marginTop: spacingPixel(20),
        paddingVertical: spacingPixel(12),
        paddingHorizontal: spacingPixel(16),
      }}
    >
      <Icon
        type="feather"
        name="alert-circle"
        size={24}
        color={Colors.white}
        style={{ marginRight: spacingPixel(12) }}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          color: Colors.white,
          fontFamily: Fonts.SFProSemiBold,
          flexWrap: "wrap",
        }}
      >
        {text1}
      </Text>
    </View>
  ),
  notification: ({
    text1,
    text2,
    onPress,
  }: {
    text1: string;
    text2?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      disabled={!onPress}
      activeOpacity={0.9}
      onPress={() => {
        onPress?.();
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "95%",
          minHeight: heightPixel(70),
          backgroundColor: Colors.secondaryBackground,
          borderRadius: spacingPixel(12),
          marginTop: spacingPixel(10),
          paddingVertical: spacingPixel(12),
          paddingHorizontal: spacingPixel(14),
        }}
      >
        <AppImage
          source={Images.icon}
          style={{
            width: heightPixel(40),
            height: heightPixel(40),
            borderRadius: spacingPixel(40),
            marginRight: spacingPixel(12),
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              color: Colors.white,
              fontFamily: Fonts.SFProSemiBold,
              marginBottom: spacingPixel(4),
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
          {text2 && (
            <Text
              style={{
                fontSize: 13,
                color: Colors.white,
                fontFamily: Fonts.SFProRegular,
                opacity: 0.9,
              }}
              numberOfLines={2}
            >
              {text2}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ),
} as ToastConfig;
