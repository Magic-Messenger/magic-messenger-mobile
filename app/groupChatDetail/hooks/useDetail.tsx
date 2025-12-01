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
  getApiChatsGroupMessages,
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
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
  decryptGroupKeyForUser,
  encryptForGroup,
  groupMessagesByDate,
  MessageWithDate,
  showToast,
  trackEvent,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlashListRef<MessageWithDate>>(null);
  const actionRef = useRef<ActionSheetRef | null>(null);
  const navigation = useNavigation();

  const isFocused = useIsFocused();

  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messageStatuses, setMessageStatuses] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: INITIAL_PAGE_SIZE,
    totalPages: 1,
    hasMore: true,
  });

  // Add these refs at the top of your component
  const updateQueueRef = useRef<Map<string, MessageStatus>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const currentUserName = useUserStore((s) => s.userName);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const setOnlineUsers = useSignalRStore((s) => s.setOnlineUsers);
  const receivedMessage = useSignalRStore((s) => s.receivedMessage);
  const setReceivedMessage = useSignalRStore((s) => s.setReceivedMessage);

  const { mutateAsync: deleteChat } = useDeleteApiChatsDelete();

  const { data: onlineUsersData } = useGetApiAccountGetOnlineUsers({
    query: {
      enabled: isFocused,
      refetchInterval: isFocused ? 10000 : false,
      staleTime: 10000,
    },
  });

  useEffect(() => {
    if (onlineUsersData?.data)
      setOnlineUsers(onlineUsersData?.data as string[]);
  }, [onlineUsersData]);

  const {
    chatId,
    userName,
    publicKey,
    groupKey,
    groupNonce,
    groupAccountCount,
    groupAdminAccount,
  } = useLocalSearchParams();

  const decryptedGroupKey = useMemo(
    () =>
      decryptGroupKeyForUser(
        groupKey as string,
        groupNonce as string,
        userPrivateKey() as string,
        groupAdminAccount as string,
      ),
    [groupKey, groupNonce, groupAdminAccount],
  );

  const usersPublicKey = useMemo(
    () => ({
      receiverPublicKey: publicKey as string,
      senderPrivateKey: userPublicKey() as string,
    }),
    [publicKey],
  );

  const loadMessages = useCallback(
    async (pageNumber: number) => {
      if (isLoadingRef.current || !pagination.hasMore) {
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);

      try {
        const { data, success } = await getApiChatsGroupMessages({
          chatId: chatId as string,
          pageNumber,
          pageSize: pagination.pageSize,
        });

        if (!isMountedRef.current) return;

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
            currentPage:
              (data.messages?.pageNumber as number) ?? prev.currentPage,
            totalPages:
              (data.messages?.totalPages as number) ?? prev.totalPages,
            hasMore:
              ((data.messages?.pageNumber as number) ?? prev.currentPage) <
              ((data.messages?.totalPages as number) ?? prev.totalPages),
          }));

          if (isFirstLoad && listRef.current) {
            setTimeout(() => {
              listRef.current?.scrollToEnd({ animated: false });
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
    if (chatId) loadMessages(1);
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

  const { mutateAsync: sendApiMessage } = usePostApiChatsSendMessage();

  const handleSendMessage = useCallback(
    async (message: string | UploadFileResultDto) => {
      onClearReply?.();
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
        chatId: chatId as string,
        senderUsername: currentUserName,
        messageType: isFileMessage ? message.messageType : MessageType.Text,
        createdAt: new Date().toISOString(),
        content: !isFileMessage
          ? encryptForGroup(message as string, decryptedGroupKey as string)
          : null,
        file: isFileMessage
          ? {
              size: message.contentLength,
              contentType: message.contentType,
              filePath: encryptForGroup(
                message.fileUrl as string,
                decryptedGroupKey as string,
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
            chatId: chatId as string,
            messageType: isFileMessage
              ? message?.messageType
              : MessageType.Text,
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
            ...(replyMessage && {
              repliedToMessage: replyMessage?.messageId,
            }),
            createdAt: optimisticMessage?.createdAt,
          },
        });

        if (response?.success) {
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
      currentUserName,
      decryptedGroupKey,
      replyMessage,
      sendApiMessage,
      onClearReply,
    ],
  );

  const handleChatControl = useCallback(
    async (message: string | UploadFileResultDto) => {
      if (chatId) {
        await handleSendMessage(message);
      }
    },
    [chatId, handleSendMessage],
  );

  //#region SignalR Effects
  // Batch processor that applies all queued status updates at once
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
        const newPriority = MESSAGE_STATUS_PRIORITY[update];

        // Only update if new status has higher priority
        if (newPriority > currentPriority) {
          newStatuses.set(messageId, update);
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
      const newStatus =
        MESSAGE_STATUS_PRIORITY[messageDeliveredEvent.message?.messageStatus!];

      if (!messageId || !newStatus) return;

      // Check if this update should override the queued one
      const existingUpdate = updateQueueRef.current.get(messageId);
      trackEvent("message_delivered existingUpdate", existingUpdate);

      if (existingUpdate) {
        const existingPriority = MESSAGE_STATUS_PRIORITY[existingUpdate];

        // Only update queue if new status has higher or equal priority
        if (newStatus >= existingPriority) {
          updateQueueRef.current.set(
            messageId,
            messageDeliveredEvent.message?.messageStatus!,
          );
        }
      } else {
        // No existing update, add to queue
        trackEvent("message_delivered no existing update", {
          messageId,
          messageStatus: newStatus,
        });
        updateQueueRef.current.set(
          messageId,
          messageDeliveredEvent.message?.messageStatus!,
        );
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate],
  );

  const handleMessageSeen = useCallback(
    (messageSeenEvent: MessageSeenEvent) => {
      trackEvent("message_seen", { messageSeenEvent });

      const messageId = messageSeenEvent.message?.messageId;
      const newStatus =
        MESSAGE_STATUS_PRIORITY[messageSeenEvent.message?.messageStatus!];

      if (!messageId || !newStatus) return;

      // Check if this update should override the queued one
      const existingUpdate = updateQueueRef.current.get(messageId);
      trackEvent("message_seen existingUpdate", existingUpdate);

      if (existingUpdate) {
        const existingPriority = MESSAGE_STATUS_PRIORITY[existingUpdate];

        // Only update queue if new status has higher or equal priority
        if (newStatus >= existingPriority) {
          updateQueueRef.current.set(
            messageId,
            messageSeenEvent.message?.messageStatus!,
          );
        }
      } else {
        // No existing update, add to queue
        trackEvent("message_seen no existing update", {
          messageId,
          messageStatus: newStatus,
        });
        updateQueueRef.current.set(
          messageId,
          messageSeenEvent.message?.messageStatus!,
        );
      }

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate],
  );

  const handleGroupMessageReceived = useCallback(
    (messageReceivedEvent: MessageReceivedEvent) => {
      trackEvent("group_message_received", { messageReceivedEvent });

      const newMessage = messageReceivedEvent.message;
      if (
        !newMessage ||
        (chatId as string) !== messageReceivedEvent?.chat?.chatId
      )
        return;

      setMessages((prev) => [...prev, newMessage]);

      // Initialize status for the new message
      setMessageStatuses((prevStatuses) => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(newMessage.messageId, newMessage.messageStatus);
        return newStatuses;
      });

      setReceivedMessage(undefined);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [listRef, chatId],
  );

  useEffect(() => {
    if (receivedMessage) handleGroupMessageReceived(receivedMessage);
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
    handleGroupMessageReceived,
    handleMessageDelivered,
    handleMessageSeen,
  ]);

  // Helper function to get message status
  const getMessageStatus = useCallback(
    (messageId: string) => {
      return messageStatuses.get(messageId);
    },
    [messageStatuses],
  );

  //#endregion

  const handleDeleteChat = useCallback(async () => {
    try {
      const response = await deleteChat({
        params: {
          chatId: chatId as string,
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
  }, [chatId, showToast, router]);

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
      { cancelable: true },
    );
  };

  const chatActionOptions = useMemo(
    () => [
      {
        label: t("chatDetail.menu.deleteConversation"),
        icon: <Icon type="feather" name="trash" size={20} />,
        onPress: onDelete,
      },
    ],
    [t, onDelete],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        chatId ? (
          <TouchableOpacity
            onPress={() =>
              setTimeout(() => {
                actionRef.current?.open();
              }, 10)
            }
            style={{ padding: 5 }}
          >
            <Icon type="feather" name="more-vertical" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, chatId]);

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
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
    groupAccountCount,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleChatControl,
    getMessageStatus,
  };
};
