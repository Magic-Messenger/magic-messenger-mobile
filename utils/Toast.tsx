import { ThemedText } from "@/components";
import { Colors, Fonts } from "@/constants";
import { View } from "react-native";
import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftWidth: 0,
        backgroundColor: Colors.toatBackground,
        borderRadius: 20,
        marginTop: 20,
      }}
      text1Style={{
        fontSize: 16,
        color: Colors.white,
        fontFamily: Fonts.SFProSemiBold,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftWidth: 0,
        backgroundColor: Colors.toatBackgroundDanger,
        borderRadius: 20,
        marginTop: 20,
      }}
      text1Style={{
        fontSize: 16,
        color: Colors.white,
        fontFamily: Fonts.SFProSemiBold,
      }}
    />
  ),
  tomatoToast: ({ text1, props }) => (
    <View style={{ height: 60, width: "100%", backgroundColor: "tomato" }}>
      <ThemedText>{text1}</ThemedText>
      <ThemedText>{props.uuid}</ThemedText>
    </View>
  ),
};
