import { useIsFocused } from "@react-navigation/core";
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
  FlatList,
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
  UploadFileResultDto,
} from "@/constants";
import { useChatStore, useSignalRStore, useUserStore } from "@/store";
import {
  decryptGroupKeyForUser,
  encryptForGroup,
  MessageWithDate,
  showToast,
  trackEvent,
  userPrivateKey,
  userPublicKey,
  uuidv4,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlatList<MessageWithDate>>(null);
  const actionRef = useRef<ActionSheetRef | null>(null);
  const navigation = useNavigation();
  const chatStore = useChatStore();
  const messages = useChatStore((state) => state.messages);

  const isFocused = useIsFocused();

  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
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
    groupAdminUsername,
  } = useLocalSearchParams();

  const isCreatedByCurrentUser = useMemo(() => {
    return groupAdminUsername === currentUserName;
  }, [groupAdminUsername, currentUserName]);

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

          if (newMessages.length === 0) {
            return;
          }

          const messagesData = isFirstLoad
            ? newMessages
            : [...newMessages, ...messages];

          chatStore.setMessages(messagesData);

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
    [chatId, pagination.pageSize, pagination.hasMore, messages],
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

  const loadMoreMessages = useCallback(() => {
    if (isLoadingRef.current || !pagination.hasMore || !chatId) {
      return;
    }
    isLoadingRef.current = true;
    setPagination((prev) => ({
      ...prev,
      currentPage: prev.currentPage + 1,
    }));
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 500);
  }, [chatId, pagination.hasMore]);

  const handleEndReached = useCallback(() => {
    if (pagination.hasMore && !isLoadingRef.current && !loading) {
      loadMoreMessages();
    }
  }, [pagination.hasMore, loadMoreMessages, loading]);

  const handleScroll = useMemo(
    () =>
      throttle(
        (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
          // Scroll handling kept for future use if needed
        },
        1000,
        { leading: true, trailing: false },
      ),
    [],
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
      const tempId = uuidv4();

      const isFileMessage =
        typeof message === "object" && message?.fileUrl !== undefined;

      const messageInfo = {
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
        repliedToMessage: replyMessage?.messageId || null,
      };

      trackEvent("sendMessage: ", messageInfo);
      chatStore.sendMessage(messageInfo as MessageDto);

      const response = await sendApiMessage({
        data: {
          ...messageInfo,
        },
      });

      if (response?.success) {
        chatStore.updateMessageId(tempId, response.data?.messageId as string);
        setMessageStatuses((prevStatuses) => {
          const newStatuses = new Map(prevStatuses);
          newStatuses.set(
            response.data?.messageId,
            response.data?.messageStatus,
          );
          return newStatuses;
        });

        trackEvent("message_sent", {
          chatId: chatId as string,
          messageId: response.data,
        });
      } else {
        trackEvent("messageInfo is undefined", { messageInfo });
        chatStore.deleteTempMessage(tempId);
      }

      return;
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

  //#region SignalR Effects
  // Batch processor that applies all queued status updates at once
  // İlk mesajdan (en eski) son mesaja (en yeni) doğru işler
  const processBatchUpdates = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;

    const updates = new Map(updateQueueRef.current);
    updateQueueRef.current.clear();

    setMessageStatuses((prevStatuses) => {
      const newStatuses = new Map(prevStatuses);

      // Güncellenecek mesajları createdAt'e göre sırala (eskiden yeniye - ascending)
      const sortedUpdates = Array.from(updates.entries())
        .map(([messageId, status]) => {
          const message = messages.find((m) => m.messageId === messageId);
          return {
            messageId,
            status,
            createdAt: message?.createdAt
              ? new Date(message.createdAt).getTime()
              : 0,
          };
        })
        .sort((a, b) => a.createdAt - b.createdAt); // Eskiden yeniye doğru sırala (ascending)

      // Sıralanmış güncellemeleri uygula (ilk mesajdan son mesaja doğru)
      sortedUpdates.forEach(({ messageId, status }) => {
        const currentStatus = prevStatuses.get(messageId);
        const currentPriority = MESSAGE_STATUS_PRIORITY[currentStatus] || 0;
        const newPriority = MESSAGE_STATUS_PRIORITY[status];

        // Sadece daha yüksek öncelikli durumları güncelle
        if (newPriority > currentPriority) {
          newStatuses.set(messageId, status);
        }
      });

      return newStatuses;
    });
  }, [messages]);

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
      const messageStatus = messageSeenEvent.message?.messageStatus;

      if (!messageId || !messageStatus) return;

      // Görülen mesajı bul
      const seenMessage = messages.find((m) => m.messageId === messageId);
      if (!seenMessage) return;

      const seenMessageTime = seenMessage.createdAt
        ? new Date(seenMessage.createdAt).getTime()
        : 0;

      // Bu mesaj ve öncesindeki tüm mesajları (currentUser tarafından gönderilenleri) "seen" olarak işaretle
      // Eskiden yeniye doğru sırala ve işle
      const messagesToUpdate = messages
        .filter((m) => {
          const msgTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          // Sadece bu mesaj ve önceki mesajları al
          // Ve sadece current user tarafından gönderilen mesajları güncelle
          return (
            msgTime <= seenMessageTime && m.senderUsername === currentUserName
          );
        })
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB; // Eskiden yeniye (ascending)
        });

      trackEvent("message_seen messagesToUpdate", {
        count: messagesToUpdate.length,
        messageIds: messagesToUpdate.map((m) => m.messageId),
      });

      // Tüm mesajları queue'ya ekle
      messagesToUpdate.forEach((msg) => {
        const existingUpdate = updateQueueRef.current.get(msg.messageId!);
        const newPriority = MESSAGE_STATUS_PRIORITY[messageStatus];

        if (existingUpdate) {
          const existingPriority = MESSAGE_STATUS_PRIORITY[existingUpdate];
          if (newPriority >= existingPriority) {
            updateQueueRef.current.set(msg.messageId!, messageStatus);
          }
        } else {
          updateQueueRef.current.set(msg.messageId!, messageStatus);
        }
      });

      scheduleBatchUpdate();
    },
    [scheduleBatchUpdate, messages, currentUserName],
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

      chatStore.sendMessage(newMessage);

      // Initialize status for the new message
      setMessageStatuses((prevStatuses) => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(newMessage.messageId, newMessage.messageStatus);
        return newStatuses;
      });

      setReceivedMessage(undefined);
    },
    [chatId],
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
    if (isCreatedByCurrentUser) {
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
    }
  }, [navigation, chatId, isCreatedByCurrentUser]);

  const invertedGroupedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  useEffect(() => {
    chatStore.clearStore();

    return () => {
      chatStore.clearStore();
    };
  }, []);

  return {
    t,
    router,
    listRef,
    loading,
    actionRef,
    chatId: chatId as string,
    messages,
    groupedMessages: invertedGroupedMessages,
    chatActionOptions,
    userName,
    groupAccountCount,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleEndReached,
    handleSendMessage,
    getMessageStatus,
  };
};
