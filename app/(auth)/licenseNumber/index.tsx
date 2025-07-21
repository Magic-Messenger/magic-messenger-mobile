import { AppLayout, Button, LicenseInput, SectionHeader } from "@/components";
import { commonStyle, spacing } from "@/constants";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function LicenseNumberScreen() {
  return (
    <AppLayout container scrollable>
      <View style={styles.mainContainer}>
        <SectionHeader
          title="Fill in License Code"
          description="You’re license will be activated on this device. It’s not possible to
          activate the license on multiple devices."
        />

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
});
