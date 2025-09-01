import { View } from "react-native";

import { AppLayout, ThemedText } from "@/components";

export default function NotesScreen() {
  return (
    <AppLayout>
      <View>
        <ThemedText type="default">Notes</ThemedText>
      </View>
    </AppLayout>
  );
}
