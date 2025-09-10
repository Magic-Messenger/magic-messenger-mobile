import React, { forwardRef } from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { Colors, Fonts } from "@/constants";
import { fontPixel, heightPixel, spacingPixel } from "@/utils";

import { ThemedText } from "../../app/ThemedText";
import { Icon, IconLibrary, IconNameForLibrary } from "../Icon";

interface IconProps {
  type?: IconLibrary;
  name: IconNameForLibrary<any>;
  size?: number;
  color?: string;
  onPress?: () => void;
}

interface BaseInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  editableStyle?: TextStyle;
  style?: ViewStyle | any;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  error?: string;
  rules?: never;
  leftIcon?: IconProps;
  rightIcon?: IconProps;
}

interface ControlledInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseInputProps {
  control: Control<TFieldValues>;
  name: TName;
  defaultValue?: string;
  rules?: Parameters<typeof Controller>[0]["rules"];
}

interface UncontrolledInputProps extends BaseInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  control?: never;
  name?: never;
  defaultValue?: never;
}

type CustomInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControlledInputProps<TFieldValues, TName> | UncontrolledInputProps;

const InputComponent = forwardRef<
  TextInput,
  BaseInputProps & {
    value?: string;
    onChangeText?: (text: string) => void;
  }
>(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      secureTextEntry = false,
      keyboardType = "default",
      multiline = false,
      numberOfLines = 1,
      editable = true,
      editableStyle,
      style,
      inputStyle,
      labelStyle,
      required = false,
      error,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();

    const renderIcon = (iconProps: IconProps, position: "left" | "right") => {
      const IconComponent = (
        <Icon
          type={iconProps.type || "material"}
          name={iconProps.name}
          size={iconProps.size || 20}
          color={iconProps.color || Colors.white}
        />
      );

      if (iconProps.onPress) {
        return (
          <TouchableOpacity
            style={[
              styles.iconContainer,
              position === "left"
                ? styles.leftIconContainer
                : styles.rightIconContainer,
            ]}
            onPress={iconProps.onPress}
            activeOpacity={0.7}
          >
            {IconComponent}
          </TouchableOpacity>
        );
      }

      return (
        <View
          style={[
            styles.iconContainer,
            position === "left"
              ? styles.leftIconContainer
              : styles.rightIconContainer,
          ]}
        >
          {IconComponent}
        </View>
      );
    };

    return (
      <View style={[style]}>
        {label && (
          <ThemedText style={[styles.label, labelStyle]}>
            {t(label)}
            {required && (
              <Text style={[styles.required, labelStyle]}>{`*`}</Text>
            )}
          </ThemedText>
        )}
        <View style={styles.inputWrapper}>
          {leftIcon && renderIcon(leftIcon, "left")}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              !editable && styles.disabledInput,
              error && styles.errorInput,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              inputStyle,
              editableStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder ? t(placeholder) : undefined}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            placeholderTextColor={Colors.placeholder}
            {...props}
          />
          {rightIcon && renderIcon(rightIcon, "right")}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

InputComponent.displayName = "InputComponent";

// Ana Input component
export const Input = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  defaultValue,
  ...props
}: CustomInputProps<TFieldValues, TName>) => {
  if (control && name) {
    return (
      <Controller
        control={control as never}
        name={name}
        rules={props.rules}
        defaultValue={(defaultValue || "") as never}
        render={({
          field: { onChange, onBlur, value, ref },
          fieldState: { error },
        }) => (
          <InputComponent
            {...props}
            ref={ref}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message || props.error}
          />
        )}
      />
    );
  }

  // Eğer control yoksa, standalone olarak kullan
  return <InputComponent {...(props as UncontrolledInputProps)} />;
};

const styles = StyleSheet.create({
  label: {
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProSemiBold,
    color: Colors.white,
    marginBottom: spacingPixel(7),
  },
  required: {
    color: Colors.white,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 9,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: spacingPixel(12),
    fontSize: fontPixel(16),
    backgroundColor: "transparent",
    color: Colors.white,
    fontFamily: Fonts.SFProMedium,
    height: heightPixel(45),
  },
  inputWithLeftIcon: {
    paddingLeft: spacingPixel(40),
  },
  inputWithRightIcon: {
    paddingRight: spacingPixel(40),
  },
  multilineInput: {
    paddingVertical: spacingPixel(12),
    height: heightPixel(125),
  },
  disabledInput: {
    color: Colors.tint,
  },
  errorInput: {
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: 9,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
    marginTop: spacingPixel(4),
  },
  iconContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    height: "100%",
    width: spacingPixel(32),
  },
  leftIconContainer: {
    left: spacingPixel(8),
  },
  rightIconContainer: {
    right: spacingPixel(8),
  },
});

// Export types for external use
export type { IconProps };
