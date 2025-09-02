import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components";
import { Colors, flexBox, Fonts, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { fontPixel, heightPixel, widthPixel } from "@/utils";

import { SettingsItemOption, SettingsItemType } from "./type";

export const SettingsItem = (props: SettingsItemType) => {
  const { title, description, value, options, onSettingsChanged } = props;
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();

  const renderItem = ({ item }: { item: SettingsItemOption }) => (
    <TouchableOpacity onPress={() => onSettingsChanged?.(item.value)}>
      <View
        style={[
          styles.option,
          typeof value === "number" &&
            item.value === value &&
            styles.activeOption,
        ]}
      >
        <ThemedText style={styles.optionText}>{t(item.label)}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.item}>
      <View style={styles.leftContainer}>
        <ThemedText style={styles.title}>{t(title)}</ThemedText>
        <ThemedText style={styles.description}>{t(description)}</ThemedText>
      </View>
      <View style={styles.rightContainer}>
        {options ? (
          <FlatList
            contentContainerStyle={styles.optionsContainer}
            data={options}
            horizontal
            renderItem={renderItem}
          />
        ) : (
          <Switch
            thumbColor={Colors.white}
            trackColor={{
              true: Colors.primary,
              false: Colors.inactiveColor,
            }}
            ios_backgroundColor={value ? Colors.primary : Colors.inactiveColor}
            value={value as boolean}
            onValueChange={onSettingsChanged}
          />
        )}
      </View>
    </View>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    item: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: widthPixel(8),
      minHeight: heightPixel(72),
      ...flexBox(0, "row", "space-between", "center"),
      ...spacing({
        mb: 16,
        p: 16,
        pl: 12,
        pr: 12,
      }),
    },
    leftContainer: {
      flex: 6,
      justifyContent: "center",
    },
    rightContainer: {
      flex: 4,
      justifyContent: "center",
      alignItems: "flex-end",
    },
    title: {
      fontSize: fontPixel(14),
      fontFamily: Fonts.SFProSemiBold,
      color: colors.white,
    },
    description: {
      fontSize: fontPixel(10),
      fontFamily: Fonts.SFProRegular,
      color: colors.white,
      ...spacing({
        mt: 8,
      }),
    },
    optionsContainer: {
      ...flexBox(1, "row", "space-between", "center"),
      gap: widthPixel(5),
      borderRadius: widthPixel(5),
    },
    option: {
      ...flexBox(0, "row", "center", "center"),
      backgroundColor: colors.secondaryBackgroundAlpha,
      width: widthPixel(24),
      height: heightPixel(24),
      borderRadius: widthPixel(5),
      ...spacing({
        p: 2,
      }),
    },
    activeOption: {
      backgroundColor: colors.primary,
    },
    optionText: {
      fontSize: fontPixel(8),
      fontFamily: Fonts.SFProMedium,
    },
  });
