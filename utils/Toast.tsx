import { Colors, Fonts } from "@/constants";
import { Text, View } from "react-native";
import { BaseToast, ErrorToast } from "react-native-toast-message";
import { heightPixel, spacingPixel } from "./PixelHelper";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      style={{
        borderLeftWidth: 0,
        backgroundColor: Colors.toatBackground,
        borderRadius: 20,
        marginTop: spacingPixel(20),
      }}
      text1Style={{
        fontSize: 16,
        color: Colors.white,
        fontFamily: Fonts.SFProSemiBold,
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={2}
      style={{
        borderLeftWidth: 0,
        backgroundColor: Colors.toatBackgroundDanger,
        borderRadius: 20,
        marginTop: spacingPixel(20),
      }}
      text1Style={{
        fontSize: 16,
        color: Colors.white,
        fontFamily: Fonts.SFProSemiBold,
      }}
    />
  ),
  tomatoToast: ({ text1, props }: { text1: string; props: any }) => (
    <View
      style={{
        height: heightPixel(60),
        width: "100%",
        backgroundColor: "tomato",
      }}
    >
      <Text style={{ color: "white" }}>{text1}</Text>
      <Text style={{ color: "white" }}>{props.uuid}</Text>
    </View>
  ),
};
