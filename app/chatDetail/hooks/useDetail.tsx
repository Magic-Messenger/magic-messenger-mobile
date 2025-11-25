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
import { CaptureProtection } from "react-native-capture-protection";

import {
  getApiChatsMessages,
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
  usePostApiAccountBlockAccount,
  usePostApiChatsClear,
  usePostApiChatsCreate,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageStatus, MessageType } from "@/api/models";
import { ActionSheetRef, Icon } from "@/components";
import {
  INITIAL_PAGE_SIZE,
  MESSAGE_STATUS_PRIORITY,
  MessageDeliveredEvent,
  MessageReceivedEvent,
  MessageSeenEvent,
  SCROLL_THRESHOLD,
  UploadFileResultDto,
} from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import {
  convertMessageStatus,
  convertMessageType,
  encrypt,
  groupMessagesByDate,
  MessageWithDate,
  showToast,
  trackEvent,
  userPublicKey,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const listRef = useRef<FlashListRef<MessageWithDate>>(null);
  const actionRef = useRef<ActionSheetRef | null>(null);

  const isFocused = useIsFocused();

  const [isScreenshotEnabled, setIsScreenshotEnabled] =
    useState<boolean>(false);
  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messageStatuses, setMessageStatuses] = useState(new Map());
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

  const currentUserName = useUserStore((s) => s.userName);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const setOnlineUsers = useSignalRStore((s) => s.setOnlineUsers);
  const receivedMessage = useSignalRStore((s) => s.receivedMessage);
  const setReceivedMessage = useSignalRStore((s) => s.setReceivedMessage);

  const { chatId: contactChatId, userName, publicKey } = useLocalSearchParams();

  const { mutateAsync: sendApiMessage } = usePostApiChatsSendMessage();
  const { mutateAsync: createApiChat } = usePostApiChatsCreate();
  const { mutateAsync: deleteChat } = useDeleteApiChatsDelete();
  const { mutateAsync: clearChatRequest } = usePostApiChatsClear();
  const { mutateAsync: blockContactRequest } = usePostApiAccountBlockAccount();

  const { data: onlineUsersData } = useGetApiAccountGetOnlineUsers({
    query: {
      enabled: isFocused,
      refetchInterval: isFocused ? 10000 : false,
      refetchOnWindowFocus: true,
    },
  });

  const usersPublicKey = useMemo(
    () => ({
      receiverPublicKey: publicKey as string,
      senderPrivateKey: userPublicKey() as string,
    }),
    [publicKey]
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

        if (success && data?.isScreenShotEnable !== undefined)
          setIsScreenshotEnabled(data?.isScreenShotEnable);

        if (success && data?.messages?.data) {
          const newMessages = data.messages.data as MessageDto[];
          const isFirstLoad = pageNumber === 1;

          const messagesData = isFirstLoad
            ? newMessages
            : [...newMessages, ...messages];
          setMessages(messagesData);

          // Initialize status for the new message
          setMessageStatuses((prevStatuses) => {
            const newStatuses = new Map(prevStatuses);
            messagesData.forEach((messageData) => {
              newStatuses.set(messageData.messageId, messageData.messageStatus);
            });
            return newStatuses;
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
    [chatId, pagination.pageSize, pagination.hasMore]
  );

  const initializeScreenshot = useCallback(async () => {
    if (isScreenshotEnabled) {
      await CaptureProtection.allow();
    } else {
      await CaptureProtection.prevent({
        appSwitcher: false,
        screenshot: true,
        record: true,
      });
    }
  }, [isScreenshotEnabled]);

  useEffect(() => {
    initializeScreenshot();
  }, [isScreenshotEnabled]);

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
        { leading: true, trailing: false }
      ),
    [pagination.hasMore, pagination.currentPage, loadMessages]
  );

  const handleReply = useCallback((message: MessageDto) => {
    setReplyMessage(message);
  }, []);

  const onClearReply = useCallback(() => {
    setReplyMessage(null);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string | UploadFileResultDto) => {
      onClearReply?.();
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
              usersPublicKey.senderPrivateKey
            )
          : null,
        file: isFileMessage
          ? {
              size: message.contentLength,
              contentType: message.contentType,
              filePath: encrypt(
                message.fileUrl as string,
                usersPublicKey.receiverPublicKey,
                usersPublicKey.senderPrivateKey
              ),
            }
          : null,
        repliedToMessage: replyMessage || null,
        messageStatus: MessageStatus.Sent, // Pending status
      } as any;

      trackEvent("sendMessage: ", optimisticMessage);

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
                usersPublicKey.senderPrivateKey
              ),
            }),
            ...(isFileMessage && {
              file: {
                size: message.contentLength,
                contentType: message.contentType,
                filePath: encrypt(
                  message.fileUrl as string,
                  usersPublicKey.receiverPublicKey,
                  usersPublicKey.senderPrivateKey
                ),
              },
            }),
            ...(replyMessage && {
              repliedToMessage: replyMessage?.messageId,
            }),
            createdAt: optimisticMessage?.createdAt,
          },
        });

        if (response?.success) {
          // Remove optimistic message - the real one will come via SignalR
          setMessages((prev) =>
            prev.filter((m) => (m as any).tempId !== tempId)
          );
        } else {
          // Remove a failed message
          setMessages((prev) =>
            prev.filter((m) => (m as any).tempId !== tempId)
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
    ]
  );

  // Batch processor that applies all queued status updates at once
  const processBatchUpdates = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;

    const updates = new Map(updateQueueRef.current);
    updateQueueRef.current.clear();

    setMessageStatuses((prevStatuses) => {
      const newStatuses = new Map(prevStatuses);

      updates.forEach((update, messageId) => {
        const currentStatus = prevStatuses.get(messageId);
        const currentPriority = MESSAGE_STATUS_PRIORITY[currentStatus] || 0;
        const newPriority = MESSAGE_STATUS_PRIORITY[update.messageStatus];

        // Only update if new status has higher priority
        if (newPriority > currentPriority) {
          newStatuses.set(messageId, update.messageStatus);
        }
      });

      return newStatuses;
    });
  }, []);

  // Schedule batch processing
  const scheduleBatchUpdate = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      processBatchUpdates();
      batchTimeoutRef.current = null;
    }, 500); // Batch updates within 500ms window
  }, [processBatchUpdates]);

  const handleMessageDelivered = useCallback(
    (messageDeliveredEvent: MessageDeliveredEvent) => {
      trackEvent("message_delivered", { messageDeliveredEvent });

      const messageId = messageDeliveredEvent.message?.messageId;
      const newStatus = Number(messageDeliveredEvent.message?.messageStatus);

      if (!messageId || !newStatus) return;

      // Check if this update should override the queued one
      const existingUpdate = updateQueueRef.current.get(messageId);
      trackEvent("message_delivered existingUpdate", existingUpdate);

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
        trackEvent("message_delivered no existing update", {
          messageId,
          messageStatus: convertMessageStatus(newStatus),
        });
        updateQueueRef.current.set(messageId, {
          messageStatus: convertMessageStatus(newStatus),
        });
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate]
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
        trackEvent("message_seen no existing update", {
          messageId,
          messageStatus: convertMessageStatus(newStatus),
        });
        updateQueueRef.current.set(messageId, {
          messageStatus: convertMessageStatus(newStatus),
        });
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate]
  );

  const handleMessageReceived = useCallback(
    (messageReceivedEvent: MessageReceivedEvent) => {
      trackEvent("message_received", { messageReceivedEvent });

      const newMessage = messageReceivedEvent.message;
      if (
        !newMessage ||
        (chatId as string) !== messageReceivedEvent?.chat?.chatId
      )
        return;

      setMessages((prev) => [
        ...prev,
        {
          ...newMessage,
          messageType: convertMessageType(newMessage.messageType as never),
          messageStatus: convertMessageStatus(
            newMessage.messageStatus as never
          ),
        },
      ]);

      // Initialize status for the new message
      setMessageStatuses((prevStatuses) => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(
          newMessage.messageId,
          convertMessageStatus(newMessage.messageStatus as never)
        );
        return newStatuses;
      });

      setReceivedMessage(undefined);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [listRef, chatId]
  );

  useEffect(() => {
    if (receivedMessage) handleMessageReceived(receivedMessage);
  }, [receivedMessage]);

  useEffect(() => {
    if (magicHubClient && chatId) {
      magicHubClient.joinChat(chatId as string);
      magicHubClient.on("message_delivered", handleMessageDelivered);
      magicHubClient.on("message_seen", handleMessageSeen);
    }

    return () => {
      if (magicHubClient && chatId) {
        magicHubClient.leaveChat(chatId as string);
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

  // Helper function to get message status
  const getMessageStatus = (messageId: string) =>
    messageStatuses.get(messageId);

  const onDelete = () => {
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
      { cancelable: true }
    );
  };

  const onChatClear = () => {
    Alert.alert(
      t("chatDetail.clear.title"),
      t("chatDetail.clear.message"),
      [
        {
          text: t("chatDetail.clear.confirm"),
          style: "destructive",
          onPress: handleClearChat,
        },
        {
          text: t("chatDetail.clear.cancel"),
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const onBlockContact = () => {
    Alert.alert(
      t("chatDetail.block.title"),
      t("chatDetail.block.message"),
      [
        {
          text: t("chatDetail.block.confirm"),
          style: "destructive",
          onPress: handleBlockContact,
        },
        {
          text: t("chatDetail.block.cancel"),
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const chatActionOptions = useMemo(
    () => [
      {
        label: t("chatDetail.menu.clearMessages"),
        icon: <Icon type="feather" name="delete" size={20} />,
        onPress: onChatClear,
      },
      {
        label: t("chatDetail.menu.deleteConversation"),
        icon: <Icon type="feather" name="trash" size={20} />,
        onPress: onDelete,
      },
      {
        label: t("chatDetail.menu.blockContact"),
        icon: <Icon type="feather" name="slash" size={20} />,
        onPress: onBlockContact,
      },
    ],
    [t, onDelete, onChatClear, onBlockContact]
  );

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

  const handleClearChat = useCallback(async () => {
    try {
      const response = await clearChatRequest({
        params: {
          chatId: chatId || (contactChatId as string),
        },
      });
      if (response?.success) {
        trackEvent("chat_cleared", { chatId });
        showToast({
          type: "success",
          text1: t("chatDetail.clear.success"),
        });
        router.back();
      }
    } catch (error) {
      trackEvent("error_clearing_chat", { chatId, error });
    }
  }, [chatId, deleteChat, showToast]);

  const handleBlockContact = useCallback(async () => {
    try {
      const response = await blockContactRequest({
        data: {
          blockedUsername: userName as string,
        },
      });
      if (response?.success) {
        trackEvent("user_blocked", { chatId });
        showToast({
          type: "success",
          text1: t("chatDetail.block.success"),
        });
        await handleDeleteChat();
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }, [userName, chatId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        chatId ? (
          <TouchableOpacity onPress={() => actionRef.current?.open()}>
            <Icon type="feather" name="more-vertical" />
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

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  return {
    t,
    router,
    listRef,
    loading,
    actionRef,
    chatId: chatId as string,
    messages,
    groupedMessages,
    chatActionOptions,
    userName,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleSendMessage,
    getMessageStatus,
  };
};
