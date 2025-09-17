import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Button, Icon, Input } from "@/components";
import { Colors, Fonts } from "@/constants";
import { fontPixel, heightPixel, spacingPixel } from "@/utils";

import { ThemedText } from "../../app/ThemedText";

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface BaseDropdownProps {
  label?: string;
  options: DropdownOption[];
  placeholder?: string;
  enabled?: boolean;
  required?: boolean;
  error?: string;
  clearable?: boolean;
  style?: any;
}

interface StandaloneDropdownProps extends BaseDropdownProps {
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  control?: never;
  name?: never;
  rules?: never;
}

interface ControlledDropdownProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseDropdownProps {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Parameters<typeof Controller>[0]["rules"];
  selectedValue?: never;
  onValueChange?: never;
}

type ModernDropdownProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = StandaloneDropdownProps | ControlledDropdownProps<TFieldValues, TName>;

const DropdownComponent: React.FC<
  BaseDropdownProps & {
    value: string | number;
    onChange: (val: string | number) => void;
  }
> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  enabled = true,
  required = false,
  error,
  clearable = false,
  style,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const [tempValue, setTempValue] = useState<string | number>(value);

  const selectedOption = options.find((o) => o.value === value);

  const handleOpen = () => {
    setTempValue(value);
    setVisible(true);
  };

  const handleConfirm = () => {
    onChange(tempValue);
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  if (Platform.OS === "android") {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <ThemedText style={styles.label}>
            {label}
            {required && <ThemedText style={styles.required}> *</ThemedText>}
          </ThemedText>
        )}

        <View
          style={[
            styles.androidInputWrapper,
            error && styles.errorInput,
            !enabled && styles.disabledInput,
          ]}
        >
          <View
            style={[
              styles.androidPickerContainer,
              !enabled && styles.disabledInput,
            ]}
          >
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              enabled={enabled}
              style={styles.androidPicker}
              dropdownIconRippleColor="transparent"
              dropdownIconColor="transparent"
            >
              {placeholder && (
                <Picker.Item
                  label={t(placeholder)}
                  value=""
                  color={Colors.secondary}
                />
              )}
              {options.map((opt) => (
                <Picker.Item
                  key={opt.value.toString()}
                  label={opt.label}
                  value={opt.value}
                  color={Colors.secondary}
                />
              ))}
            </Picker>
            <View style={styles.androidDropdownIconOverlay}>
              <Icon
                type="feather"
                name="chevron-down"
                style={styles.androidDropdownIcon}
              />
            </View>
          </View>

          {clearable && value && enabled && (
            <TouchableOpacity
              onPress={() => onChange("")}
              style={styles.clearButton}
            >
              <Icon type="feather" name="x" style={styles.clearIcon} />
            </TouchableOpacity>
          )}
        </View>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && (
        <ThemedText style={styles.label}>
          {label}
          {required && <ThemedText style={styles.required}> *</ThemedText>}
        </ThemedText>
      )}

      <View
        style={[
          styles.inputWrapper,
          error && styles.errorInput,
          !enabled && styles.disabledInput,
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.8}
          onPress={() => enabled && handleOpen()}
        >
          <Input
            style={[styles.input, !enabled && styles.disabledText]}
            editableStyle={styles.editable}
            value={selectedOption?.label || ""}
            placeholder={placeholder ? t(placeholder) : undefined}
            placeholderTextColor={Colors.placeholder}
            editable={false}
            pointerEvents="none"
            rightIcon={{
              type: "feather",
              name: "chevron-down",
              size: fontPixel(22),
            }}
          />
        </TouchableOpacity>

        {clearable && value && enabled && (
          <TouchableOpacity
            onPress={() => onChange("")}
            style={styles.clearButton}
          >
            <Icon type="feather" name="x" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Picker
              selectedValue={tempValue}
              onValueChange={(val) => setTempValue(val)}
              enabled={enabled}
              style={styles.picker}
              itemStyle={styles.itemStyle}
              dropdownIconColor={Colors.white}
            >
              {options.map((opt) => (
                <Picker.Item
                  key={opt.value.toString()}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
            <View style={styles.buttonRow}>
              <View style={styles.cancelButton}>
                <Button
                  type="danger"
                  label={t("common.cancel")}
                  onPress={handleCancel}
                />
              </View>
              <View style={styles.confirmButton}>
                <Button
                  type="primary"
                  label={t("common.confirm")}
                  onPress={handleConfirm}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const Dropdown = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ModernDropdownProps<TFieldValues, TName>,
) => {
  if ("control" in props && props.control && props.name) {
    return (
      <Controller
        control={props.control as never}
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
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: spacingPixel(10),
    paddingHorizontal: spacingPixel(8),
    height: heightPixel(45),
  },
  androidInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: spacingPixel(10),
    paddingHorizontal: spacingPixel(8),
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: fontPixel(16),
    fontFamily: Fonts.SFProMedium,
  },
  editable: {
    color: Colors.white,
  },
  disabledInput: {
    backgroundColor: Colors.secondary,
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textDisabled,
  },
  androidPickerContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    position: "relative",
  },
  androidPicker: {
    flex: 1,
    color: Colors.white,
    backgroundColor: "transparent",
  },
  androidDropdownIconOverlay: {
    position: "absolute",
    right: spacingPixel(10),
    top: "50%",
    transform: [{ translateY: -fontPixel(11) }],
    pointerEvents: "none",
  },
  androidDropdownIcon: {
    fontSize: fontPixel(22),
    color: Colors.white,
  },
  clearButton: {
    paddingHorizontal: spacingPixel(4),
  },
  clearIcon: {
    fontSize: fontPixel(20),
    color: Colors.white,
  },
  errorInput: {
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
    marginTop: spacingPixel(4),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacingPixel(16),
  },
  picker: {
    color: Colors.white,
  },
  itemStyle: {
    color: Colors.white,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacingPixel(10),
    paddingHorizontal: spacingPixel(16),
    paddingVertical: spacingPixel(12),
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.white,
    fontFamily: Fonts.SFProMedium,
    fontSize: fontPixel(16),
  },
});
