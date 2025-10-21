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
  usePostApiChatsSendMessage,
} from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { Icon } from "@/components";
import { UploadFileResultDto } from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import {
  convertMessageStatus,
  convertMessageType,
  decryptGroupKeyForUser,
  encryptForGroup,
  showToast,
  trackEvent,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

const INITIAL_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 100;

export const useDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlashListRef<MessageDto>>(null);
  const navigation = useNavigation();

  const [replyMessage, setReplyMessage] = useState<MessageDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
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

  const { mutateAsync: deleteChat } = useDeleteApiChatsDelete();

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

          setMessages((prev) => {
            return isFirstLoad ? newMessages : [...newMessages, ...prev];
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
      const isFileMessage =
        typeof message === "object" && message?.fileUrl !== undefined;

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
          },
        });

        if (response?.success) {
          onClearReply();
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [chatId, decryptedGroupKey, replyMessage, sendApiMessage, onClearReply],
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
  const handleTyping = (data: { username: string }) => {
    if (currentUserName !== data.username) {
      setTypingUsername(data.username);
    }
  };

  const handleStopTyping = (data: { username: string }) => {
    if (currentUserName !== data.username) {
      setTypingUsername(null);
    }
  };

  const handleGroupMessageReceived = (message: MessageDto) => {
    trackEvent("group_message_received", { message });

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

  useEffect(() => {
    if (magicHubClient && chatId) {
      magicHubClient.joinChat(chatId as string);
      magicHubClient.on("typing", handleTyping);
      magicHubClient.on("stop_typing", handleStopTyping);
      magicHubClient.on("group_message_received", handleGroupMessageReceived);
    }

    return () => {
      if (magicHubClient && chatId) {
        magicHubClient.leaveChat(chatId as string);
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");
        magicHubClient.off("group_message_received");
      }
    };
  }, [magicHubClient, chatId]);
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
    groupAccountCount,
    typingUsername,
    currentUserName,
    usersPublicKey,
    replyMessage,
    handleReply,
    onClearReply,
    handleScroll,
    handleChatControl,
  };
};
