import { AppLayout, ThemedText } from "@/components";
import { router } from "expo-router";
import { Button, View } from "react-native";

export default function HomeScreen() {
  console.log("env file: ", process.env);
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button title="Chat Screen" onPress={() => router.push("/chat")} />
        <ThemedText type="title">Home Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
