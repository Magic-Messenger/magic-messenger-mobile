import { FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getApiChatsMessages,
  usePostApiChatsCreate,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { UploadFileResultDto } from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import {
  convertMessageStatus,
  convertMessageType,
  encrypt,
  trackEvent,
  userPublicKey,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlashListRef<MessageDto>>(null);
  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const { userName: currentUserName } = useUserStore();
  const { chatId: contactChatId, userName, publicKey } = useLocalSearchParams();

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const [chatId, setChatId] = useState<string | null>(
    (contactChatId as string) ?? null,
  );
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const { mutateAsync: sendApiMessage } = usePostApiChatsSendMessage();
  const { mutateAsync: createApiChat } = usePostApiChatsCreate();

  const loadMessages = async () => {
    if (loading) return;
    setLoading(true);
    const { data, success } = await getApiChatsMessages({
      chatId: contactChatId as string,
    });

    if (success && data?.messages?.data) {
      setLoading(false);
      setMessages(data?.messages?.data as never[]);
      if (!chatId) setChatId(contactChatId as string);
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contactChatId || chatId) {
      loadMessages();
    }
  }, [contactChatId, listRef, chatId, listRef]);

  const usersPublicKey = useMemo(() => {
    return {
      receiverPublicKey: publicKey as string,
      senderPrivateKey: userPublicKey() as string,
    };
  }, [publicKey, userPublicKey]);

  const handleChatControl = async (message: string | UploadFileResultDto) => {
    if (contactChatId) {
      await handleSendMessage(message);
    } else {
      const response = await createApiChat({
        data: {
          usernames: [userName as string],
        },
      });
      if (response?.success && response?.data) {
        setChatId(response?.data as string);
        /* setTimeout(() => {
          loadMessages();
        }, 500); */
      }
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
          content: encrypt(
            message as string,
            usersPublicKey.receiverPublicKey,
            usersPublicKey.senderPrivateKey,
          ),
        }),
        ...(isFileMessage && {
          file: {
            size: message.contentLength,
            contentType: message.contentType,
            filePath: encrypt(
              message.fileUrl as string,
              usersPublicKey.receiverPublicKey,
              usersPublicKey.senderPrivateKey,
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
      magicHubClient.on("user_online", (data) => {
        setOnlineUsers((prev) => [...prev, data.username]);
      });

      magicHubClient.on(
        "typing",
        (data) =>
          currentUserName !== data.username && setTypingUsername(data.username),
      );
      magicHubClient.on(
        "stop_typing",
        (data) => currentUserName !== data.username && setTypingUsername(""),
      );
      magicHubClient.on("message_received", (message) => {
        trackEvent("message_received", { message });
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
        magicHubClient.off("message_received");
        magicHubClient.off("user_offline");
      }
    };
  }, [magicHubClient]);

  return {
    t,
    router,
    listRef,
    loading,
    chatId,
    messages,
    userName,
    onlineUsers,
    typingUsername,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleChatControl,
  };
};
