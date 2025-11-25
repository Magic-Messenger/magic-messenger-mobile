import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { MessageDto, MessageType } from "@/api/models";
import { useUserStore } from "@/store";
import {
  decrypt,
  decryptForGroup,
  decryptGroupKeyForUser,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

export function useChatHelper(message: MessageDto, receiverPublicKey: string) {
  const { userName: currentUserName } = useUserStore();
  const isSentByCurrentUser = message?.senderUsername === currentUserName;

  const decryptedContent = useMemo(() => {
    const senderKey = isSentByCurrentUser ? receiverPublicKey : userPublicKey();
    const receiverKey = isSentByCurrentUser ? userPublicKey() : receiverPublicKey; //prettier-ignore
    if (
      message?.file &&
      message?.file?.filePath?.cipherText &&
      message?.file?.filePath?.nonce &&
      receiverPublicKey
    ) {
      return decrypt(
        message.file.filePath.cipherText,
        message.file.filePath.nonce,
        senderKey as string,
        receiverKey as string
      );
    }
    if (
      message?.messageType === MessageType.Audio ||
      message?.messageType === MessageType.Image ||
      message?.messageType === MessageType.Video
    ) {
      if (
        message?.file &&
        message?.file?.filePath?.cipherText &&
        message?.file?.filePath?.nonce &&
        receiverPublicKey
      ) {
        return decrypt(
          message.file.filePath.cipherText,
          message.file.filePath.nonce,
          senderKey as string,
          receiverKey as string
        );
      }
    } else if (message?.messageType === MessageType.Text) {
      if (
        message?.content?.cipherText &&
        message?.content?.nonce &&
        receiverPublicKey
      ) {
        return decrypt(
          message.content.cipherText,
          message.content.nonce,
          senderKey as string,
          receiverKey as string
        );
      }
    }
  }, [message, currentUserName, isSentByCurrentUser, receiverPublicKey]);

  const decryptedReplyMessage = useMemo(() => {
    const isReplySentByCurrentUser = message?.repliedToMessage?.senderUsername === currentUserName; //prettier-ignore
    const senderKey = isReplySentByCurrentUser ? receiverPublicKey : userPublicKey(); //prettier-ignore
    const receiverKey = isReplySentByCurrentUser ? userPublicKey() : receiverPublicKey; //prettier-ignore

    if (
      message?.repliedToMessage &&
      message?.repliedToMessage?.content?.cipherText &&
      message?.repliedToMessage?.content?.nonce
    ) {
      return decrypt(
        message?.repliedToMessage?.content?.cipherText as string,
        message?.repliedToMessage?.content?.nonce as string,
        senderKey as string,
        receiverKey as string
      );
    } else if (
      message?.repliedToMessage?.file &&
      message?.repliedToMessage?.file?.filePath?.cipherText &&
      message?.repliedToMessage?.file?.filePath?.nonce &&
      receiverPublicKey
    ) {
      return decrypt(
        message?.repliedToMessage?.file?.filePath?.cipherText as string,
        message?.repliedToMessage?.file?.filePath?.nonce as string,
        senderKey as string,
        receiverKey as string
      );
    }
  }, [message, currentUserName, receiverPublicKey]);

  const replyMessageType = message?.repliedToMessage?.messageType;

  return {
    decryptedContent,
    isSentByCurrentUser,
    decryptedReplyMessage,
    replyMessageType,
  };
}

export function useGroupChatHelper(message: MessageDto) {
  const { groupKey, groupNonce, groupAdminAccount } = useLocalSearchParams();
  const { userName: currentUserName } = useUserStore();
  const isSentByCurrentUser = message?.senderUsername === currentUserName;

  const decryptedGroupKey = decryptGroupKeyForUser(
    groupKey as string,
    groupNonce as string,
    userPrivateKey() as string,
    groupAdminAccount as string
  );

  const decryptedContent = useMemo(() => {
    if (
      message?.messageType === MessageType.Audio ||
      message?.messageType === MessageType.Image ||
      message?.messageType === MessageType.Video
    ) {
      if (
        message?.file &&
        message?.file?.filePath?.cipherText &&
        message?.file?.filePath?.nonce &&
        decryptedGroupKey
      ) {
        return decryptForGroup(
          message?.file.filePath?.cipherText as string,
          message?.file.filePath?.nonce as string,
          decryptedGroupKey as string
        );
      }
    } else if (message?.messageType === MessageType.Text) {
      if (
        message?.content?.cipherText &&
        message?.content?.nonce &&
        decryptedGroupKey
      ) {
        return decryptForGroup(
          message?.content?.cipherText as string,
          message?.content?.nonce as string,
          decryptedGroupKey as string
        );
      }
    }
  }, [message, currentUserName, isSentByCurrentUser]);

  const decryptedReplyMessage = useMemo(() => {
    if (
      message?.repliedToMessage &&
      message?.repliedToMessage?.content?.cipherText &&
      message?.repliedToMessage?.content?.nonce
    ) {
      return decryptForGroup(
        message?.repliedToMessage?.content?.cipherText as string,
        message?.repliedToMessage?.content?.nonce as string,
        decryptedGroupKey as string
      );
    } else if (
      message?.repliedToMessage?.file &&
      message?.repliedToMessage?.file?.filePath?.cipherText &&
      message?.repliedToMessage?.file?.filePath?.nonce &&
      decryptedGroupKey
    ) {
      return decryptForGroup(
        message?.repliedToMessage?.file?.filePath?.cipherText as string,
        message?.repliedToMessage?.file?.filePath?.nonce as string,
        decryptedGroupKey as string
      );
    }
  }, [message, currentUserName, decryptedGroupKey]);

  const replyMessageType = message?.repliedToMessage?.messageType;

  return {
    decryptedContent,
    isSentByCurrentUser,
    decryptedReplyMessage,
    replyMessageType,
  };
}
