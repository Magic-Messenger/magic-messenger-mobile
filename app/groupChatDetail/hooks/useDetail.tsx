import { useIsFocused } from "@react-navigation/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { throttle } from "lodash";
import {
  startTransition,
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
  AppState,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from "react-native";

import {
  getGetApiChatsGroupMessagesQueryKey,
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
  useGetApiChatsGroupMessages,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { ActionSheetRef, Icon } from "@/components";
import { INITIAL_PAGE_SIZE, UploadFileResultDto } from "@/constants";
import {
  useChatMessages,
  useChatStore,
  useSignalRStore,
  useUserStore,
} from "@/store";
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
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  const listRef = useRef<FlatList<MessageWithDate>>(null);
  const actionRef = useRef<ActionSheetRef | null>(null);
  const appState = useRef(AppState.currentState);

  const {
    chatId,
    title,
    userName,
    publicKey,
    groupKey,
    groupNonce,
    groupAccountCount,
    groupAdminAccount,
    groupAdminUsername,
  } = useLocalSearchParams();

  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: INITIAL_PAGE_SIZE,
    totalPages: 1,
    hasMore: true,
  });

  const isLoadingRef = useRef(false);

  const chatStore = useChatStore();
  const currentUserName = useUserStore((s) => s.userName);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const setOnlineUsers = useSignalRStore((s) => s.setOnlineUsers);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
  } = useGetApiChatsGroupMessages(
    {
      chatId: chatId as string,
      pageNumber: pagination.currentPage || 1,
      pageSize: pagination.pageSize,
    },
    {
      query: {
        enabled: !!chatId && isFocused,
      },
    },
  );

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

  // Get messages for the current chat from store
  const messages = useChatMessages(chatId as string);

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

  // Process messages from React Query
  useEffect(() => {
    if (!messagesData?.success || !messagesData?.data?.messages?.data) return;

    const data = messagesData.data;

    const isFirstLoad = pagination.currentPage <= 1;

    const newMessages = data.messages?.data as MessageDto[];
    if (!newMessages.length) return;

    // Merge API messages with existing store messages
    // Keep only pending messages that don't exist in API yet
    const existingMessages = chatStore.getMessages(chatId as string);
    const apiMessageIds = new Set(newMessages.map((m) => m.messageId));

    // Helper to check if a store message already exists in API response
    const isDuplicate = (storeMsg: MessageDto) => {
      // Direct messageId match
      if (apiMessageIds.has(storeMsg.messageId)) return true;

      // Check by tempId field
      if ((storeMsg as any).tempId) {
        const matchByTempId = newMessages.some(
          (apiMsg) => apiMsg.messageId === (storeMsg as any).tempId,
        );
        if (matchByTempId) return true;
      }

      // Check by content (encrypted), sender, similar timestamp (within 5 seconds)
      return newMessages.some?.((apiMsg) => {
        if (apiMsg.senderUsername !== storeMsg.senderUsername) return false;
        if (apiMsg.content?.cipherText !== storeMsg.content?.cipherText)
          return false;
        if (!apiMsg.createdAt || !storeMsg.createdAt) return false;
        const timeDiff = Math.abs(
          new Date(apiMsg.createdAt).getTime() -
            new Date(storeMsg.createdAt).getTime(),
        );
        return timeDiff < 5000;
      });
    };

    const pendingMessages = existingMessages.filter((m) => !isDuplicate(m));

    const messagesResult = isFirstLoad
      ? [...newMessages, ...pendingMessages]
      : [...newMessages, ...messages.filter((m) => !isDuplicate(m))];

    // Sort by createdAt to maintain order
    messagesResult.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    startTransition(() => {
      chatStore.setMessages(chatId as string, messagesResult);
    });

    setPagination((prev) => ({
      ...prev,
      currentPage: data.messages?.pageNumber as number,
      totalPages: data.messages?.totalPages as number,
      hasMore:
        (data.messages?.pageNumber as number) <
        (data.messages?.totalPages as number),
    }));
  }, [messagesData]);

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
    if (pagination.hasMore && !isLoadingRef.current && !isMessagesFetching) {
      loadMoreMessages();
    }
  }, [pagination.hasMore, loadMoreMessages, isMessagesFetching]);

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
        repliedToMessage: replyMessage
          ? {
              messageId: replyMessage.messageId,
              senderUsername: replyMessage.senderUsername,
              content: replyMessage.content,
              file: replyMessage.file,
              messageType: replyMessage.messageType,
            }
          : null,
      };

      trackEvent("sendMessage: ", messageInfo);
      chatStore.sendMessage(chatId as string, messageInfo as MessageDto);

      const response = await sendApiMessage({
        data: {
          ...messageInfo,
          // API expects only messageId string
          repliedToMessage: replyMessage?.messageId || null,
        },
      });

      if (response?.success) {
        chatStore.updateMessageId(
          chatId as string,
          tempId,
          response.data?.messageId as string,
          response.data?.messageStatus,
        );

        trackEvent("message_sent", {
          chatId: chatId as string,
          messageId: response.data,
        });
      } else {
        trackEvent("messageInfo is undefined", { messageInfo });
        chatStore.deleteTempMessage(chatId as string, tempId);
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

  useEffect(() => {
    if (magicHubClient && chatId) {
      magicHubClient.joinChat?.(chatId as string);
    }

    return () => {
      if (magicHubClient && chatId) {
        magicHubClient.leaveChat?.(chatId as string);
      }
    };
  }, [magicHubClient, chatId]);

  //#endregion

  useFocusEffect(
    useCallback(() => {
      if (chatId) {
        queryClient.invalidateQueries?.({
          queryKey: getGetApiChatsGroupMessagesQueryKey({
            chatId: chatId as string,
          }),
        });
      }
    }, [chatId]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        if (chatId) {
          queryClient.invalidateQueries?.({
            queryKey: getGetApiChatsGroupMessagesQueryKey({
              chatId: chatId as string,
            }),
          });
        }
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, [chatId]);

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

  return {
    t,
    title,
    router,
    listRef,
    loading: isMessagesLoading && messages.length === 0,
    isFetching: isMessagesFetching,
    actionRef,
    chatId: chatId as string,
    messages,
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
  };
};
