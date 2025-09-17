import { useMemo } from "react";

import { MessageDto, MessageType } from "@/api/models";
import { useUserStore } from "@/store";
import { decrypt, userPublicKey } from "@/utils";

export function useChatHelper(message: MessageDto, receiverPublicKey: string) {
  const { userName: currentUserName } = useUserStore();
  const isSentByCurrentUser = message?.senderUsername === currentUserName;

  const decryptedContent = useMemo(() => {
    const senderKey = isSentByCurrentUser ? receiverPublicKey : userPublicKey();
    const receiverKey = isSentByCurrentUser ? userPublicKey() : receiverPublicKey; //prettier-ignore

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
          receiverKey as string,
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
          receiverKey as string,
        );
      }
    }
  }, [message, currentUserName, isSentByCurrentUser, receiverPublicKey]);

  return { decryptedContent, isSentByCurrentUser };
}
