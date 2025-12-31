import { useIsFocused } from "@react-navigation/core";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from "react-native";
import { CaptureProtection } from "react-native-capture-protection";

import {
  useDeleteApiChatsDelete,
  useGetApiAccountGetOnlineUsers,
  useGetApiChatsMessages,
  usePostApiAccountBlockAccount,
  usePostApiChatsClear,
  usePostApiChatsCreate,
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { CallingType, MessageDto, MessageType } from "@/api/models";
import { ActionSheetRef, Icon } from "@/components";
import { INITIAL_PAGE_SIZE, UploadFileResultDto } from "@/constants";
import {
  useChatMessages,
  useChatStore,
  useSignalRStore,
  useUserStore,
} from "@/store";
import {
  encrypt,
  MessageWithDate,
  showToast,
  trackEvent,
  userPublicKey,
  uuidv4,
} from "@/utils";

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const {
    chatId: contactChatId,
    userName,
    publicKey,
    title,
  } = useLocalSearchParams();

  const listRef = useRef<FlatList<MessageWithDate>>(null);
  const actionRef = useRef<ActionSheetRef | null>(null);

  const [isScreenshotEnabled, setIsScreenshotEnabled] =
    useState<boolean>(false);
  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);

  const [chatId, setChatId] = useState<string | null>(null);
  const [showEncryptionInfo, setShowEncryptionInfo] = useState<boolean>(false);

  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: INITIAL_PAGE_SIZE,
    totalPages: 1,
    hasMore: true,
  });

  const isLoadingRef = useRef(false);

  const currentUserName = useUserStore((s) => s.userName);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const setOnlineUsers = useSignalRStore((s) => s.setOnlineUsers);

  const chatStore = useChatStore();
  // Get messages for the current chat from the store
  const messages = useChatMessages(chatId);

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

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
  } = useGetApiChatsMessages(
    {
      chatId: chatId as string,
      pageNumber: pagination.currentPage || 1,
      pageSize: pagination.pageSize,
    },
    {
      query: {
        enabled: !!chatId && isFocused,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  );

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

  // Process messages from React Query
  useEffect(() => {
    if (!messagesData?.success || !messagesData?.data?.messages?.data) return;

    const data = messagesData.data;
    if (data?.isScreenShotEnable !== undefined) {
      setIsScreenshotEnabled(data.isScreenShotEnable);
    }

    const newMessages = data.messages?.data as MessageDto[];
    const isFirstLoad = pagination.currentPage <= 1;

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
    initializeScreenshot().then().catch();
  }, [isScreenshotEnabled]);

  // For inverted list, load more when scrolling towards the top (which appears as bottom due to inversion)
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
      const tempId = uuidv4();

      const isFileMessage =
        typeof message === "object" && message?.fileUrl !== undefined;

      const messageInfo = {
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
        // Full object for store (to render reply)
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

      startTransition(() => {
        chatStore.sendMessage(messageChatId, messageInfo as MessageDto);
      });

      const response = await sendApiMessage({
        data: {
          ...messageInfo,
          // API expects only messageId string
          repliedToMessage: replyMessage?.messageId || null,
        },
      }).catch(() => {
        startTransition(() => {
          chatStore.deleteTempMessage(messageChatId, tempId);
        });
      });
      if (response?.success) {
        startTransition(() => {
          chatStore.updateMessageId(
            messageChatId,
            tempId,
            response.data?.messageId as string,
            response.data?.messageStatus,
          );
        });

        trackEvent("message_sent", {
          chatId: messageChatId,
          messageId: response.data,
        });
      } else {
        startTransition(() => {
          chatStore.deleteTempMessage(messageChatId, tempId);
        });
      }

      return;
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
      { cancelable: true },
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
      { cancelable: true },
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
    [t, onDelete, onChatClear, onBlockContact],
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
      trackEvent("handleBlockContact error: ", error);
    }
  }, [userName, chatId]);

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

  useEffect(() => {
    chatStore.clearStore();

    return () => {
      chatStore.clearStore();
    };
  }, []);

  //#region Calling Handlers
  const onCallingPress = useCallback(
    (callingType: CallingType) => {
      Alert.alert(
        t("chatDetail.calling.title", {
          type: callingType === CallingType.Audio ? "audio" : "video",
        }),
        t("chatDetail.calling.areYouSure", {
          type: callingType === CallingType.Audio ? "audio" : "video",
          userName: userName,
        }),
        [
          {
            text: t("chatDetail.calling.cancel"),
            style: "cancel",
          },
          {
            text: t("chatDetail.calling.confirm"),
            style: "default",
            onPress: () => {
              trackEvent("calling_initiated", {
                chatId,
                callingType,
              });

              const pathname =
                callingType === CallingType.Audio
                  ? "/(calling)/audioCalling/screens"
                  : "/(calling)/videoCalling/screens";

              router.push({
                pathname,
                params: {
                  targetUsername: userName as string,
                  callingType,
                },
              });
            },
          },
        ],
        { cancelable: true },
      );
    },
    [chatId, userName, router],
  );
  //#endregion

  useEffect(() => {
    if (!isMessagesLoading && messages?.length === 0) {
      const t = setTimeout(() => {
        setShowEncryptionInfo(true);
      }, 250);

      return () => clearTimeout(t);
    }
    setShowEncryptionInfo(false);
  }, [isMessagesLoading, messages?.length]);

  return {
    t,
    title,
    router,
    listRef,
    loading: isMessagesLoading,
    isFetching: isMessagesFetching,
    showEncryptionInfo,
    actionRef,
    chatId: chatId as string,
    messages,
    chatActionOptions,
    userName,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleEndReached,
    handleSendMessage,
    onCallingPress,
  };
};
