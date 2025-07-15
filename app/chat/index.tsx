import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { View } from "react-native";

export default function ChatScreen() {
  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <ThemedText type="title">Chat Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
