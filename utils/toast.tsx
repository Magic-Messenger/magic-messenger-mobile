import { Text, View } from "react-native";
import { ToastConfig } from "react-native-toast-message";

import { Icon } from "../components/ui/Icon";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import { heightPixel, spacingPixel } from "./pixelHelper";

export const toastConfig = {
  success: ({ text1 }: { text1: string }) => (
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
} as ToastConfig;
