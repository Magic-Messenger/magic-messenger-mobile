import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { View } from "react-native";

export default function ExploreScreen() {
  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <ThemedText type="title">Explore Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
