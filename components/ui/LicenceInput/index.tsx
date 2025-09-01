import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardType,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { Colors, Fonts } from "@/constants";

interface LicenseInputProps {
  groupCount?: number;
  charactersPerGroup?: number;
  value?: string;
  onChangeText?: (text: string) => void;
  onComplete?: (text: string) => void;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  textStyle?: TextStyle;
  autoFocus?: boolean;
  keyboardType?: KeyboardType;
  secureTextEntry?: boolean;
  editable?: boolean;
  placeholder?: string;
}

export const LicenseInput: React.FC<LicenseInputProps> = ({
  groupCount = 4,
  charactersPerGroup = 4,
  value = "",
  onChangeText,
  onComplete,
  style,
  inputStyle,
  textStyle,
  autoFocus = false,
  keyboardType = "default",
  secureTextEntry = false,
  editable = true,
  placeholder = "",
}) => {
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Initialize input values
  useEffect(() => {
    const groups = [];
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    for (let i = 0; i < groupCount; i++) {
      const startIndex = i * charactersPerGroup;
      const endIndex = startIndex + charactersPerGroup;
      groups.push(cleanValue.slice(startIndex, endIndex));
    }

    setInputValues(groups);
  }, [value, groupCount, charactersPerGroup]);

  // Handle input change
  const handleChangeText = (text: string, groupIndex: number): void => {
    const cleanText = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const newInputValues = [...inputValues];

    if (cleanText.length > charactersPerGroup) {
      // Handle paste - distribute characters across groups
      const allChars = cleanText.split("");
      let charIndex = 0;

      for (
        let i = groupIndex;
        i < groupCount && charIndex < allChars.length;
        i++
      ) {
        let groupText = "";
        for (
          let j = 0;
          j < charactersPerGroup && charIndex < allChars.length;
          j++
        ) {
          groupText += allChars[charIndex];
          charIndex++;
        }
        newInputValues[i] = groupText;
      }

      setInputValues(newInputValues);

      // Focus next empty group or last group
      const nextGroupIndex = Math.min(
        groupIndex + Math.ceil(cleanText.length / charactersPerGroup),
        groupCount - 1,
      );
      inputRefs.current[nextGroupIndex]?.focus();
    } else {
      // Normal input
      newInputValues[groupIndex] = cleanText;
      setInputValues(newInputValues);

      // Move to next group if current is full
      if (
        cleanText.length === charactersPerGroup &&
        groupIndex < groupCount - 1
      ) {
        inputRefs.current[groupIndex + 1]?.focus();
      }
    }

    // Call callbacks
    const fullValue = newInputValues.join("");
    onChangeText?.(fullValue);

    if (fullValue.length === groupCount * charactersPerGroup) {
      onComplete?.(fullValue);
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, groupIndex: number): void => {
    if (e.nativeEvent.key === "Backspace") {
      const newInputValues = [...inputValues];

      if (inputValues[groupIndex]) {
        // Clear current group
        newInputValues[groupIndex] = "";
        setInputValues(newInputValues);

        const fullValue = newInputValues.join("");
        onChangeText?.(fullValue);
      } else if (groupIndex > 0) {
        // Move to previous group and clear it
        inputRefs.current[groupIndex - 1]?.focus();
        newInputValues[groupIndex - 1] = "";
        setInputValues(newInputValues);

        const fullValue = newInputValues.join("");
        onChangeText?.(fullValue);
      }
    }
  };

  // Handle focus
  const handleFocus = (groupIndex: number): void => {
    setFocusedIndex(groupIndex);
  };

  const handleBlur = (): void => {
    setFocusedIndex(-1);
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: groupCount }).map((_, groupIndex) => (
        <View key={groupIndex} style={styles.groupWrapper}>
          <TextInput
            ref={(ref) => (inputRefs.current[groupIndex] = ref)}
            style={[
              styles.input,
              inputStyle,
              focusedIndex === groupIndex && styles.inputFocused,
              inputValues[groupIndex] && styles.inputFilled,
              textStyle,
            ]}
            value={inputValues[groupIndex] || ""}
            onChangeText={(text) => handleChangeText(text, groupIndex)}
            onKeyPress={(e) => handleKeyPress(e, groupIndex)}
            onFocus={() => handleFocus(groupIndex)}
            onBlur={handleBlur}
            maxLength={charactersPerGroup}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            editable={editable}
            placeholder={placeholder}
            autoFocus={autoFocus && groupIndex === 0}
            selectTextOnFocus
            textAlign="center"
            autoCapitalize="characters"
            autoCorrect={false}
            blurOnSubmit={false}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  groupWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    color: Colors.white,
    fontFamily: Fonts.SFProMedium,
  },
  inputFocused: {
    backgroundColor: "#1A1A2E",
  },
  inputFilled: {
    backgroundColor: Colors.secondaryBackground,
  },
});
