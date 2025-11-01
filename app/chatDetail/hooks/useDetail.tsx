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
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  TouchableOpacity,
} from "react-native";

import {
  getApiChatsMessages,
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
  usePostApiChatsCreate,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageStatus, MessageType } from "@/api/models";
import { Icon } from "@/components";
import {
  INITIAL_PAGE_SIZE,
  MESSAGE_STATUS_PRIORITY,
  MessageDeliveredEvent,
  MessageSeenEvent,
  SCROLL_THRESHOLD,
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

  // Add these refs at the top of your component
  const updateQueueRef = useRef<Map<string, any>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

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

      // Create an optimistic message
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
        messageStatus: MessageStatus.Sent, // Pending status
      } as any;

      // Add an optimistic message to the list
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
          // Remove a failed message
          setMessages((prev) =>
            prev.filter((m) => (m as any).tempId !== tempId),
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Remove a failed message
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

  const handleMessageReceived = useCallback(
    (message: MessageDto) => {
      trackEvent("message_received", message);

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
    },
    [listRef],
  );

  // Batch processor that applies all queued updates at once with priority checks
  const processBatchUpdates = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;

    const updates = new Map(updateQueueRef.current);
    updateQueueRef.current.clear();

    setMessages((prevMessages) =>
      prevMessages.map((item) => {
        const update = updates.get(item.messageId as string);
        if (!update) return item;

        const currentPriority =
          MESSAGE_STATUS_PRIORITY[item.messageStatus as never];
        const newPriority = MESSAGE_STATUS_PRIORITY[update.messageStatus];

        const shouldUpdate =
          newPriority > currentPriority ||
          (item.messageStatus !== update.messageStatus &&
            newPriority >= currentPriority);

        if (shouldUpdate) {
          return {
            ...item,
            messageStatus: update.messageStatus,
          };
        }
        return item;
      }),
    );
  }, []);

  // Schedule batch processing
  const scheduleBatchUpdate = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      processBatchUpdates();
      batchTimeoutRef.current = null;
    }, 250); // Batch updates within 250ms window
  }, [processBatchUpdates]);

  const handleMessageDelivered = useCallback(
    (messageDeliveredEvent: MessageDeliveredEvent) => {
      trackEvent("message_delivered", { messageDeliveredEvent });

      const messageId = messageDeliveredEvent.message?.messageId;
      const newStatus = Number(messageDeliveredEvent.message?.messageStatus);

      if (!messageId || !newStatus) return;

      // Check if this update should override the queued one
      const existingUpdate = updateQueueRef.current.get(messageId);
      if (existingUpdate) {
        const existingPriority =
          MESSAGE_STATUS_PRIORITY[existingUpdate.messageStatus as never];

        /// Only update queue if new status has higher or equal priority
        if (newStatus >= existingPriority) {
          updateQueueRef.current.set(messageId, {
            messageStatus: convertMessageStatus(newStatus),
          });
        }
      } else {
        // No existing update, add to queue
        updateQueueRef.current.set(messageId, {
          messageStatus: convertMessageStatus(newStatus),
        });
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate],
  );

  const handleMessageSeen = useCallback(
    (messageSeenEvent: MessageSeenEvent) => {
      trackEvent("message_seen", { messageSeenEvent });

      const messageId = messageSeenEvent.message?.messageId;
      const newStatus = Number(messageSeenEvent.message?.messageStatus);

      if (!messageId || !newStatus) return;

      // Check if this update should override the queued one
      const existingUpdate = updateQueueRef.current.get(messageId);
      trackEvent("message_seen existingUpdate", existingUpdate);

      if (existingUpdate) {
        const existingPriority =
          MESSAGE_STATUS_PRIORITY[existingUpdate.messageStatus as never];

        // Only update queue if new status has higher or equal priority
        if (newStatus >= existingPriority) {
          updateQueueRef.current.set(messageId, {
            messageStatus: convertMessageStatus(newStatus),
          });
        }
      } else {
        // No existing update, add to queue
        updateQueueRef.current.set(messageId, {
          messageStatus: convertMessageStatus(newStatus),
        });
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate],
  );

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

      // Clear any pending batch updates on unmounting
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      updateQueueRef.current.clear();
    };
  }, [
    magicHubClient,
    chatId,
    handleMessageReceived,
    handleMessageDelivered,
    handleMessageSeen,
  ]);

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

  useEffect(() => {
    const onKeyboardShow = () => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(showEvent, onKeyboardShow);

    return () => {
      subscription.remove && subscription.remove();
    };
  }, [listRef]);

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
