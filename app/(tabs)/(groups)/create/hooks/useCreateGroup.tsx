import { router } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { usePostApiChatsCreate } from "@/api/endpoints/magicMessenger";
import { useGroupChatCreateStore, useUserStore } from "@/store";
import { ColorDto, useColor, useThemedStyles } from "@/theme";
import {
  encryptGroupKeyForUser,
  generateGroupKey,
  spacingPixel,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

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
  const { userName } = useUserStore();
  const styles = useThemedStyles(createStyles);

  const { mutateAsync: createGroup } = usePostApiChatsCreate();
  const { participants, removeParticipant, clearParticipants } =
    useGroupChatCreateStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>();

  const onSubmit = async (data: CreateGroupFormData) => {
    if (data && participants.length > 0) {
      const groupKey = generateGroupKey();

      const encryptedUserNames = [
        ...participants,
        { contactUsername: userName, publicKey: userPublicKey() },
      ].map(({ contactUsername, publicKey }) => {
        const encryptedData = encryptGroupKeyForUser(
          groupKey,
          publicKey as never,
          userPrivateKey() as string
        );

        return {
          username: contactUsername as string,
          groupKey: encryptedData?.cipherText,
          nonce: encryptedData?.nonce,
        };
      });

      const { success, data: responseData } = await createGroup({
        data: {
          usernames: participants?.map((p) => p.contactUsername) as string[],
          groupName: data.groupName,
          isGroupChat: true,
          encryptedGroupKeys: encryptedUserNames,
        },
      });
      if (success && responseData) {
        router.replace("/(tabs)/(groups)/home");
      }
    }
  };

  const goToAddParticipants = () => {
    router.push("/(tabs)/(groups)/participants/screens");
  };

  useEffect(() => {
    return () => clearParticipants();
  }, []);

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
