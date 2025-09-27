import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { ColorDto, useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

interface CreateGroupFormData {
  groupName: string;
  participants: string[];
}

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    participantContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacingPixel(7),
    },
    participantItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      padding: spacingPixel(5),
      borderRadius: spacingPixel(5),
    },
  });

export const useCreateGroup = () => {
  const { t } = useTranslation();
  const theme = useColor();
  const styles = useThemedStyles(createStyles);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>();
  const { participants: selectedParticipants } = useLocalSearchParams();

  const [participants, setParticipants] = useState<string[]>([]);

  const onSubmit = (data) => {
    console.log(data);
  };

  const goToAddParticipants = () => {
    router.push("/(tabs)/(groups)/participants/screens");
  };

  const removeParticipant = (participant: string) => {
    console.log("participant: ", participant);
    setParticipants((prev) => prev.filter((p) => p !== participant));
  };

  /* useEffect(() => {
    let participantsArray: string[] = [];
    if (Array.isArray(selectedParticipants)) {
      participantsArray = selectedParticipants;
    } else if (typeof selectedParticipants === "string") {
      participantsArray = [selectedParticipants];
    }

    if (
      participantsArray.length !== participants.length ||
      participantsArray.some((p, i) => p !== participants[i])
    ) {
      setParticipants(participantsArray);
    }
  }, [selectedParticipants]); */

  return {
    t,
    theme,
    styles,
    control,
    errors,
    isSubmitting,
    participants,
    handleSubmit: handleSubmit(onSubmit),
    goToAddParticipants,
    removeParticipant,
  };
};
