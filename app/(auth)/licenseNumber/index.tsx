import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppLayout, Button, LicenseInput, SectionHeader } from "@/components";
import { spacing } from "@/constants";
import { useThemedStyles } from "@/theme";

export default function LicenseNumberScreen() {
  const styles = useThemedStyles(createStyle);

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
          onComplete={(_text) => router.push("/login/screens/login")}
        />

        <Button type="primary" label="Next" style={styles.mt10} />
      </View>
    </AppLayout>
  );
}

const createStyle = () =>
  StyleSheet.create({
    mainContainer: {
      ...spacing({
        mt: 80,
      }),
    },
  });
