import { Colors, Fonts } from "@/constants";
import { fontPixel, heightPixel, spacingPixel } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef, useState } from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../../app/ThemedText";

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface BaseDropdownProps {
  label?: string;
  options: DropdownOption[];
  enabled?: boolean;
  style?: any;
  dropdownStyle?: any;
  labelStyle?: any;
  required?: boolean;
  error?: string;
}

interface StandaloneDropdownProps extends BaseDropdownProps {
  selectedValue: string | number;
  onValueChange: (itemValue: string | number) => void;
  control?: never;
  name?: never;
  rules?: never;
}

interface ControlledDropdownProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseDropdownProps {
  control?: Control<TFieldValues>;
  name?: TName;
  rules?: Parameters<typeof Controller>[0]["rules"];
  selectedValue?: never;
  onValueChange?: never;
}

type ModernDropdownProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = StandaloneDropdownProps | ControlledDropdownProps<TFieldValues, TName>;

const DropdownComponent = forwardRef<
  View,
  BaseDropdownProps & {
    value: string | number;
    onChange: (value: string | number) => void;
  }
>(
  (
    {
      label,
      value,
      onChange,
      options,
      enabled = true,
      style,
      dropdownStyle,
      labelStyle,
      required = false,
      error,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);

    const selectedOption = options.find((option) => option.value === value);
    const displayText = selectedOption ? selectedOption.label : "";

    const handleSelect = (selectedValue: string | number) => {
      onChange(selectedValue);
      setIsVisible(false);
    };

    const renderOption = ({ item }: { item: DropdownOption }) => (
      <TouchableOpacity
        style={[
          styles.optionItem,
          item.value === value && styles.selectedOption,
        ]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.optionText,
            item.value === value && styles.selectedOptionText,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );

    return (
      <View ref={ref} style={[styles.container, style]}>
        {label && (
          <ThemedText style={[styles.label, labelStyle]}>
            {label}
            {required && <ThemedText style={styles.required}> *</ThemedText>}
          </ThemedText>
        )}

        <TouchableOpacity
          style={[
            styles.dropdown,
            !enabled && styles.disabledDropdown,
            error && styles.errorDropdown,
            dropdownStyle,
          ]}
          onPress={() => enabled && setIsVisible(true)}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[styles.dropdownText, !enabled && styles.disabledText]}
          >
            {displayText}
          </ThemedText>
          <Text style={[styles.arrow, !enabled && styles.disabledText]}>▼</Text>
        </TouchableOpacity>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsVisible(false)}
          >
            <View style={styles.modalContent}>
              <LinearGradient
                style={styles.modalHeader}
                colors={Colors.buttonPrimary as never}
              >
                <ThemedText style={styles.modalTitle}>
                  {label || "Seçim Yapın"}
                </ThemedText>
              </LinearGradient>
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(_, index) => index.toString()}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }
);

DropdownComponent.displayName = "DropdownComponent";

export const Dropdown = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ModernDropdownProps<TFieldValues, TName>
) => {
  if (props.control && props.name) {
    return (
      <Controller
        control={props.control}
        name={props.name}
        rules={props.rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DropdownComponent
            {...props}
            value={value || ""}
            onChange={onChange}
            error={error?.message || props.error}
          />
        )}
      />
    );
  }

  const standaloneProps = props as StandaloneDropdownProps;
  return (
    <DropdownComponent
      {...standaloneProps}
      value={standaloneProps.selectedValue}
      onChange={standaloneProps.onValueChange}
    />
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingPixel(16),
  },
  label: {
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProSemiBold,
    color: Colors.white,
    marginBottom: spacingPixel(8),
  },
  required: {
    color: Colors.white,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
  },
  dropdown: {
    backgroundColor: Colors.secondary,
    borderRadius: 9,
    paddingHorizontal: spacingPixel(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0,
    height: heightPixel(45),
  },
  disabledDropdown: {
    backgroundColor: Colors.secondary,
  },
  errorDropdown: {
    borderColor: Colors.danger,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: fontPixel(13),
    color: Colors.white,
    flex: 1,
  },
  disabledText: {
    color: Colors.textDisabled,
  },
  arrow: {
    fontSize: fontPixel(12),
    color: Colors.white,
    marginLeft: spacingPixel(8),
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
    marginTop: spacingPixel(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    width: width * 0.85,
    maxHeight: heightPixel(400),
    overflow: "hidden",
  },
  modalHeader: {
    paddingVertical: spacingPixel(16),
    paddingHorizontal: spacingPixel(20),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontPixel(17),
    fontFamily: Fonts.SFProBold,
    color: Colors.white,
  },
  optionsList: {
    maxHeight: heightPixel(300),
  },
  optionItem: {
    paddingVertical: spacingPixel(16),
    paddingHorizontal: spacingPixel(20),
    borderBottomWidth: 0.5,
  },
  selectedOption: {
    backgroundColor: Colors.secondarySelected,
  },
  optionText: {
    fontSize: fontPixel(15),
    color: Colors.white,
  },
  selectedOptionText: {
    fontFamily: Fonts.SFProSemiBold,
  },
});
