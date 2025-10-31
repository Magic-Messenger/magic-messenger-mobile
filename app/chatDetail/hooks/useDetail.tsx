import { useIsFocused } from "@react-navigation/core";
import { FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { throttle } from "lodash";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from "react-native";

import {
  getApiChatsMessages,
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
  usePostApiChatsCreate,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { Icon } from "@/components";
import {
  MessageDeliveredEvent,
  MessageSeenEvent,
  UploadFileResultDto,
} from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import {
  convertMessageStatus,
  convertMessageType,
  encrypt,
  showToast,
  trackEvent,
  userPublicKey,
} from "@/utils";

const INITIAL_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 100;

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const listRef = useRef<FlashListRef<MessageDto>>(null);

  const isFocused = useIsFocused();

  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: INITIAL_PAGE_SIZE,
    totalPages: 1,
    hasMore: true,
  });

  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const { userName: currentUserName } = useUserStore();
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const setOnlineUsers = useSignalRStore((s) => s.setOnlineUsers);

  const { chatId: contactChatId, userName, publicKey } = useLocalSearchParams();

  const { mutateAsync: sendApiMessage } = usePostApiChatsSendMessage();
  const { mutateAsync: createApiChat } = usePostApiChatsCreate();
  const { mutateAsync: deleteChat } = useDeleteApiChatsDelete();

  const { data: onlineUsersData } = useGetApiAccountGetOnlineUsers({
    query: {
      enabled: isFocused,
      refetchOnWindowFocus: true,
    },
  });

  const usersPublicKey = useMemo(
    () => ({
      receiverPublicKey: publicKey as string,
      senderPrivateKey: userPublicKey() as string,
    }),
    [publicKey],
  );

  useEffect(() => {
    if (onlineUsersData?.data)
      setOnlineUsers(onlineUsersData?.data as string[]);
  }, [onlineUsersData]);

  useEffect(() => {
    if (contactChatId) {
      setChatId(contactChatId as string);
    }
  }, [contactChatId]);

  const loadMessages = useCallback(
    async (pageNumber: number) => {
      if (isLoadingRef.current || !pagination.hasMore || !chatId) {
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);

      try {
        const { data, success } = await getApiChatsMessages({
          chatId: chatId as string,
          pageNumber,
          pageSize: pagination.pageSize,
        });

        if (!isMountedRef.current) return;

        if (success && data?.messages?.data) {
          const newMessages = data.messages.data as MessageDto[];
          const isFirstLoad = pageNumber === 1;

          setMessages((prev) => {
            return isFirstLoad ? newMessages : [...newMessages, ...prev];
          });

          setPagination((prev) => ({
            ...prev,
            currentPage: data.messages?.pageNumber as number,
            totalPages: data.messages?.totalPages as number,
            hasMore:
              (data.messages?.pageNumber as number) <
              (data.messages?.totalPages as number),
          }));

          if (isFirstLoad && listRef.current) {
            setTimeout(() => {
              listRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    },
    [chatId, pagination.pageSize, pagination.hasMore],
  );

  useEffect(() => {
    if (chatId) {
      loadMessages(1);
    }
  }, [chatId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleScroll = useMemo(
    () =>
      throttle(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offsetY = e.nativeEvent.contentOffset.y;

          if (
            offsetY <= SCROLL_THRESHOLD &&
            pagination.hasMore &&
            !isLoadingRef.current
          ) {
            loadMessages(pagination.currentPage + 1);
          }
        },
        1000,
        { leading: true, trailing: false },
      ),
    [pagination.hasMore, pagination.currentPage, loadMessages],
  );

  const handleReply = useCallback((message: MessageDto) => {
    setReplyMessage(message);
  }, []);

  const onClearReply = useCallback(() => {
    setReplyMessage(null);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string | UploadFileResultDto) => {
      let messageChatId = chatId as string;
      if (!messageChatId) {
        const createChatResponse = await createApiChat({
          data: {
            usernames: [userName as string],
          },
        });
        const newChatId = createChatResponse.data as string;
        messageChatId = newChatId;
        setChatId(newChatId);
      }

      const isFileMessage =
        typeof message === "object" && message?.fileUrl !== undefined;

      // Create optimistic message
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: MessageDto & {
        isPending?: boolean;
        tempId?: string;
      } = {
        messageId: tempId,
        tempId,
        isPending: true,
        chatId: messageChatId,
        senderUsername: currentUserName,
        messageType: isFileMessage ? message.messageType : MessageType.Text,
        createdAt: new Date().toISOString(),
        content: !isFileMessage
          ? encrypt(
              message as string,
              usersPublicKey.receiverPublicKey,
              usersPublicKey.senderPrivateKey,
            )
          : null,
        file: isFileMessage
          ? {
              size: message.contentLength,
              contentType: message.contentType,
              filePath: encrypt(
                message.fileUrl as string,
                usersPublicKey.receiverPublicKey,
                usersPublicKey.senderPrivateKey,
              ),
            }
          : null,
        repliedToMessage: replyMessage || null,
        messageStatus: 1, // Pending status
      } as any;

      // Add optimistic message to list
      setMessages((prev) => [...prev, optimisticMessage]);

      // Scroll to end
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        const response = await sendApiMessage({
          data: {
            chatId: messageChatId,
            messageType: isFileMessage
              ? message?.messageType
              : MessageType.Text,
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
            ...(replyMessage && {
              repliedToMessage: replyMessage?.messageId,
            }),
          },
        });

        if (response?.success) {
          onClearReply();
          // Remove optimistic message - the real one will come via SignalR
          setMessages((prev) =>
            prev.filter((m) => (m as any).tempId !== tempId),
          );
        } else {
          // Remove failed message
          setMessages((prev) =>
            prev.filter((m) => (m as any).tempId !== tempId),
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Remove failed message
        setMessages((prev) => prev.filter((m) => (m as any).tempId !== tempId));
      }
    },
    [
      chatId,
      userName,
      currentUserName,
      usersPublicKey,
      replyMessage,
      sendApiMessage,
      onClearReply,
    ],
  );

  const handleMessageReceived = (message: MessageDto) => {
    trackEvent("message_received", { message });

    setMessages((prev) => [
      ...prev,
      {
        ...message,
        messageType: convertMessageType(message.messageType as never),
        messageStatus: convertMessageStatus(message.messageStatus as never),
      },
    ]);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMessageDelivered = (
    messageDeliveredEvent: MessageDeliveredEvent,
  ) => {
    trackEvent("message_delivered", { messageDeliveredEvent });

    setMessages((prevMessages) =>
      prevMessages.map((item) =>
        item.messageId === messageDeliveredEvent.message?.messageId
          ? {
              ...item,
              messageStatus: messageDeliveredEvent.message?.messageStatus,
            }
          : item,
      ),
    );
  };

  const handleMessageSeen = (messageSeenEvent: MessageSeenEvent) => {
    trackEvent("message_seen", { messageSeenEvent });

    setMessages((prevMessages) =>
      prevMessages.map((item) =>
        item.messageId === messageSeenEvent.message?.messageId
          ? {
              ...item,
              messageStatus: messageSeenEvent.message?.messageStatus,
            }
          : item,
      ),
    );
  };

  useEffect(() => {
    if (magicHubClient && chatId) {
      magicHubClient.joinChat(chatId as string);
      magicHubClient.on("message_received", handleMessageReceived);
      magicHubClient.on("message_delivered", handleMessageDelivered);
      magicHubClient.on("message_seen", handleMessageSeen);
    }

    return () => {
      if (magicHubClient && chatId) {
        magicHubClient.leaveChat(chatId as string);
        magicHubClient.off("message_received");
        magicHubClient.off("message_delivered");
        magicHubClient.off("message_seen");
      }
    };
  }, [magicHubClient, chatId]);

  const handleDeleteChat = useCallback(async () => {
    try {
      const response = await deleteChat({
        params: {
          chatId: chatId || (contactChatId as string),
        },
      });
      if (response?.success) {
        trackEvent("chat_deleted", { chatId });
        showToast({
          type: "success",
          text1: t("chatDetail.delete.success"),
        });
        router.back();
      }
    } catch (error) {
      trackEvent("error_deleting_chat", { chatId, error });
    }
  }, [chatId, contactChatId, deleteChat, showToast, router]);

  const onAction = () => {
    Alert.alert(
      t("chatDetail.delete.title"),
      t("chatDetail.delete.message"),
      [
        {
          text: t("chatDetail.delete.confirm"),
          style: "destructive",
          onPress: handleDeleteChat,
        },
        {
          text: t("chatDetail.delete.cancel"),
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        chatId ? (
          <TouchableOpacity onPress={onAction}>
            <Icon type="feather" name="trash" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, chatId]);

  return {
    t,
    router,
    listRef,
    loading,
    chatId: chatId as string,
    messages,
    userName,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleSendMessage,
  };
};
