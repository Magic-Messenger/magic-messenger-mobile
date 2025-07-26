import { AppLayout, ThemedText } from "@/components";
import { View } from "react-native";

export default function NotesScreen() {
  return (
    <AppLayout>
      <View>
        <ThemedText type="default">Notes</ThemedText>
      </View>
    </AppLayout>
  );
}
