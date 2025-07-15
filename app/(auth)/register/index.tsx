import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <ThemedText type="title">Register Page !</ThemedText>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <ThemedText type="default">Go Login Page !</ThemedText>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}
