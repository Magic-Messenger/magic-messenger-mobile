import { AppLayout, ThemedText } from "@/components";
import { View } from "react-native";

export default function ExploreScreen() {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ThemedText type="title">Explore Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
