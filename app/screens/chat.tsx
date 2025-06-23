import { ThemedText } from "@/components/ThemedText";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ThemedText type="title">Chat Page !</ThemedText>
      </View>
    </SafeAreaView>
  );
}
