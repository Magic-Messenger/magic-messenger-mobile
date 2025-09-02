import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type Rule =
  | "minLength"
  | "capital"
  | "lowercase"
  | "number"
  | "specialChar"
  | "match";
type Language = "tr" | "en" | "es" | "nl" | "fr";

interface PasswordChecklistProps {
  rules: Rule[];
  value: string;
  valueAgain?: string;
  minLength?: number;
  language?: string | Language;
  messages?: Partial<Record<Rule, string>>;
  passedIcon?: React.ReactNode;
  notPassedIcon?: React.ReactNode;
  onChange?: (isValid: boolean) => void;
  validTextColor?: string;
  invalidTextColor?: string;
  containerStyle?: ViewStyle;
  rowStyle?: ViewStyle;
  textStyle?: TextStyle;
  iconStyle?: TextStyle;
}

const translations: Record<Language, Record<Rule, string>> = {
  tr: {
    minLength: "Şifre en az {minLength} karakterden oluşmalıdır.",
    capital: "Şifre en az bir büyük harf içermelidir.",
    lowercase: "Şifre en az bir küçük harf içermelidir.",
    number: "Şifre en az bir rakam içermelidir.",
    specialChar:
      "Şifre en az bir özel karakter içermelidir (@, $, !, %, *, ?, &).",
    match: "Şifre ve tekrar alanı birbiriyle eşleşmelidir.",
  },
  en: {
    minLength: "Password must contain at least {minLength} characters.",
    capital: "Password must include at least one uppercase letter.",
    lowercase: "Password must include at least one lowercase letter.",
    number: "Password must contain at least one numeric character.",
    specialChar:
      "Password must include at least one special character (@, $, !, %, *, ?, &).",
    match: "Password and confirmation must match.",
  },
  es: {
    minLength: "La contraseña debe tener al menos {minLength} caracteres.",
    capital: "La contraseña debe incluir al menos una letra mayúscula.",
    lowercase: "La contraseña debe incluir al menos una letra minúscula.",
    number: "La contraseña debe contener al menos un número.",
    specialChar:
      "La contraseña debe incluir al menos un carácter especial (@, $, !, %, *, ?, &).",
    match: "La contraseña y la confirmación deben coincidir.",
  },
  nl: {
    minLength: "Het wachtwoord moet minimaal {minLength} tekens bevatten.",
    capital: "Het wachtwoord moet minimaal één hoofdletter bevatten.",
    lowercase: "Het wachtwoord moet minimaal één kleine letter bevatten.",
    number: "Het wachtwoord moet minimaal één cijfer bevatten.",
    specialChar:
      "Het wachtwoord moet minimaal één speciaal teken bevatten (@, $, !, %, *, ?, &).",
    match: "Het wachtwoord en de bevestiging moeten overeenkomen.",
  },
  fr: {
    minLength: "Le mot de passe doit contenir au moins {minLength} caractères.",
    capital: "Le mot de passe doit inclure au moins une majuscule.",
    lowercase: "Le mot de passe doit inclure au moins une minuscule.",
    number: "Le mot de passe doit contenir au moins un chiffre.",
    specialChar:
      "Le mot de passe doit inclure au moins un caractère spécial (@, $, !, %, *, ?, &).",
    match: "Le mot de passe et la confirmation doivent correspondre.",
  },
};

const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  rules,
  value,
  valueAgain,
  minLength = 8,
  language = "en",
  messages = {},
  passedIcon,
  notPassedIcon,
  onChange,
  validTextColor = "green",
  invalidTextColor = "red",
  containerStyle,
  rowStyle,
  textStyle,
  iconStyle,
}) => {
  const t = translations[language as Language];

  const checks = rules.map((rule) => {
    switch (rule) {
      case "minLength":
        return {
          rule,
          passed: value?.length >= minLength,
          label: (messages.minLength || t.minLength).replace(
            "{minLength}",
            minLength.toString(),
          ),
        };
      case "capital":
        return {
          rule,
          passed: /[A-Z]/.test(value),
          label: messages.capital || t.capital,
        };
      case "lowercase":
        return {
          rule,
          passed: /[a-z]/.test(value),
          label: messages.lowercase || t.lowercase,
        };
      case "number":
        return {
          rule,
          passed: /\d/.test(value),
          label: messages.number || t.number,
        };
      case "specialChar":
        return {
          rule,
          passed: /[@$!%*?&]/.test(value),
          label: messages.specialChar || t.specialChar,
        };
      case "match":
        return {
          rule,
          passed: value?.length > 0 && value === valueAgain,
          label: messages.match || t.match,
        };
      default:
        return { rule, passed: true, label: "" };
    }
  });

  const allPassed = checks.every((c) => c.passed);

  useEffect(() => {
    if (onChange) {
      onChange(allPassed);
    }
  }, [allPassed, onChange]);

  return (
    <View style={[styles.container, containerStyle]}>
      {checks.map((c, idx) => (
        <View key={idx} style={[styles.row, rowStyle]}>
          {c.passed
            ? passedIcon || (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={validTextColor}
                  style={[styles.icon, iconStyle]}
                />
              )
            : notPassedIcon || (
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={invalidTextColor}
                  style={[styles.icon, iconStyle]}
                />
              )}
          <Text
            style={[
              styles.text,
              textStyle,
              { color: c.passed ? validTextColor : invalidTextColor },
            ]}
          >
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default PasswordChecklist;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  icon: {
    marginRight: 8,
  },
});
