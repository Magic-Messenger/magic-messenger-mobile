import { AppLayout, Button, LicenseInput, ThemedText } from "@/components";
import { commonStyle, spacing } from "@/constants";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function LicenseNumberScreen() {
  return (
    <AppLayout container scrollable>
      <View style={styles.mainContainer}>
        <ThemedText type="title">Fill in License Code</ThemedText>
        <ThemedText type="default">
          You’re license will be activated on this device. It’s not possible to
          activate the license on multiple devices.
        </ThemedText>

        <LicenseInput
          groupCount={4}
          charactersPerGroup={4}
          onChangeText={(text) => console.log("result:", text)}
          onComplete={(text) => {
            console.log("complete:", text);
            router.push("/(auth)/login");
          }}
          style={styles.licenseInput}
        />

        <Button type="primary" label="Next" style={commonStyle.mt10} />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    ...spacing({
      mt: 80,
    }),
  },
  licenseInput: {
    ...spacing({
      mt: 60,
    }),
  },
});
