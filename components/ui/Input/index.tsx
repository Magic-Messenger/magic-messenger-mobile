import { ThemedText } from "@/components";
import { Colors, Fonts } from "@/constants";
import { fontPixel, heightPixel, spacingPixel } from "@/utils";
import React, { forwardRef } from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

interface BaseInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  error?: string;
  rules?: never;
}

// React Hook Form ile kullanım için props
interface ControlledInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseInputProps {
  control: Control<TFieldValues>;
  name: TName;
  defaultValue?: string;
  rules?: Parameters<typeof Controller>[0]["rules"];
}

// Standalone kullanım için props
interface UncontrolledInputProps extends BaseInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  control?: never;
  name?: never;
  defaultValue?: never;
}

type CustomInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = ControlledInputProps<TFieldValues, TName> | UncontrolledInputProps;

// Input bileşenini forwardRef ile sarmalayalım
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
      style,
      inputStyle,
      labelStyle,
      required = false,
      error,
      ...props
    },
    ref
  ) => {
    return (
      <View style={[style]}>
        {label && (
          <ThemedText style={[styles.label, labelStyle]}>
            {label}
            {required && (
              <Text style={[styles.required, labelStyle]}>{`*`}</Text>
            )}
          </ThemedText>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
            error && styles.errorInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          placeholderTextColor="#999"
          {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

InputComponent.displayName = "InputComponent";

// Ana Input component
export const Input = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  defaultValue,
  ...props
}: CustomInputProps<TFieldValues, TName>) => {
  // Eğer control prop'u varsa, React Hook Form Controller kullan
  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={props.rules}
        defaultValue={defaultValue || ""}
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
  input: {
    borderWidth: 0,
    borderRadius: 9,
    paddingHorizontal: spacingPixel(12),
    fontSize: fontPixel(13),
    backgroundColor: Colors.secondary,
    color: Colors.white,
    fontFamily: Fonts.SFProMedium,
    height: heightPixel(45),
  },
  multilineInput: {
    height: heightPixel(100),
    textAlignVertical: "top",
  },
  disabledInput: {
    color: Colors.tint,
  },
  errorInput: {
    borderColor: Colors.danger,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontPixel(13),
    fontFamily: Fonts.SFProMedium,
    marginTop: spacingPixel(4),
  },
});
