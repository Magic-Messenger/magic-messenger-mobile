import { FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getApiChatsGroupMessages,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { UploadFileResultDto } from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import {
  convertMessageStatus,
  convertMessageType,
  decryptGroupKeyForUser,
  encryptForGroup,
  trackEvent,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlashListRef<MessageDto>>(null);
  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const { userName: currentUserName, credentials } = useUserStore();
  const {
    chatId,
    userName,
    publicKey,
    groupKey,
    groupNonce,
    groupAccountCount,
    groupAdminAccount,
  } = useLocalSearchParams();

  const decryptedGroupKey = decryptGroupKeyForUser(
    groupKey as string,
    groupNonce as string,
    userPrivateKey() as string,
    groupAdminAccount as string,
  );

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsername, setTypingUsername] = useState<string | null>(null);

  const { mutateAsync: sendApiMessage } = usePostApiChatsSendMessage();

  const loadMessages = async () => {
    if (loading) return;
    setLoading(true);
    const { data, success } = await getApiChatsGroupMessages({
      chatId: chatId as string,
    });

    if (success && data?.messages?.data) {
      setLoading(false);
      setMessages(data?.messages?.data as never[]);
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [listRef, chatId, listRef]);

  const usersPublicKey = useMemo(() => {
    return {
      receiverPublicKey: publicKey as string,
      senderPrivateKey: userPublicKey() as string,
    };
  }, [publicKey, userPublicKey]);

  const handleChatControl = async (message: string | UploadFileResultDto) => {
    if (chatId) {
      await handleSendMessage(message);
    }
  };

  const onClearReply = () => {
    setReplyMessage(null);
  };

  const handleReply = useCallback((message: MessageDto) => {
    setReplyMessage(message);
  }, []);

  const handleSendMessage = async (message: string | UploadFileResultDto) => {
    const isFileMessage =
      typeof message === "object" && message?.fileUrl !== undefined;
    const response = await sendApiMessage({
      data: {
        chatId: chatId as string,
        messageType: isFileMessage ? message?.messageType : MessageType.Text,
        ...(!isFileMessage && {
          content: encryptForGroup(
            message as string,
            decryptedGroupKey as string,
          ),
        }),
        ...(isFileMessage && {
          file: {
            size: message.contentLength,
            contentType: message.contentType,
            filePath: encryptForGroup(
              message.fileUrl as string,
              decryptedGroupKey as string,
            ),
          },
        }),
        ...(replyMessage && { repliedToMessage: replyMessage?.messageId }),
      },
    });

    if (response?.success) {
      onClearReply();
    }
  };

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.joinChat(chatId as string);
      magicHubClient.on(
        "typing",
        (data) =>
          currentUserName !== data.username && setTypingUsername(data.username),
      );
      magicHubClient.on(
        "stop_typing",
        (data) => currentUserName !== data.username && setTypingUsername(""),
      );
      magicHubClient.on("group_message_received", (message) => {
        trackEvent("group_message_received", { message });
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            messageType: convertMessageType(message.messageType as never),
            messageStatus: convertMessageStatus(message.messageStatus as never),
          },
        ]);
        if (listRef.current) {
          listRef.current.scrollToEnd({ animated: true });
        }
      });
    }
    return () => {
      if (magicHubClient) {
        magicHubClient.leaveChat(chatId as string);
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");
        magicHubClient.off("group_message_received");
        magicHubClient.off("user_offline");
      }
    };
  }, [magicHubClient]);

  return {
    t,
    router,
    listRef,
    loading,
    chatId: chatId as string,
    messages,
    userName,
    groupAccountCount,
    typingUsername,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleChatControl,
  };
};
