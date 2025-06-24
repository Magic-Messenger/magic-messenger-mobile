import { AppLayout, ThemedText } from "@/components";
import { View } from "react-native";

export default function ChatScreen() {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ThemedText type="title">Chat Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
