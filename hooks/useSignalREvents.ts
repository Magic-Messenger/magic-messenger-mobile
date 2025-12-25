import { useQueryClient } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  getGetApiChatsListQueryKey,
  getGetApiChatsMessagesQueryKey,
} from "@/api/endpoints/magicMessenger";
import { ChatDto } from "@/api/models";
import {
  MessageDeliveredEvent,
  MessageReceivedEvent,
  MessageSeenEvent,
} from "@/constants";
import { StatusUpdate, useChatStore, useUserStore } from "@/store";
import { useSignalRStore } from "@/store/signalRStore";
import { showToast, trackEvent } from "@/utils";

const chatsScreens = ["/chatDetail/screens", "/groupChatDetail/screens"];

const isInChatScreen = (pathname?: string) => {
  return chatsScreens.some((screen) => pathname?.includes(screen));
};

export const useSignalREvents = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const addOnlineUser = useSignalRStore((s) => s.addOnlineUser);
  const removeOnlineUser = useSignalRStore((s) => s.removeOnlineUser);
  const startTyping = useSignalRStore((s) => s.startTyping);
  const stopTyping = useSignalRStore((s) => s.stopTyping);
  const setCurrentRoute = useSignalRStore((s) => s.setCurrentRoute);
  const setLastReceivedMessage = useSignalRStore(
    (s) => s.setLastReceivedMessage,
  );
  const currentUserName = useUserStore((state) => state.userName);

  // Use ref to always have the latest pathname without re-creating callbacks
  const pathnameRef = useRef(pathname);

  const sendMessage = useChatStore((state) => state.sendMessage);
  const getMessages = useChatStore((state) => state.getMessages);
  const updateStatus = useChatStore((state) => state.updateStatus);

  const handleUserOnline = (data: { username: string }) => {
    trackEvent("user_online: ", data);
    addOnlineUser(data.username);
  };

  const handleUserOffline = (data: { username: string }) => {
    trackEvent("user_offline: ", data);
    removeOnlineUser(data.username);
  };

  const handleTyping = (data: { username: string; chatId: string }) => {
    trackEvent("typing: ", data);
    if (currentUserName !== data.username) {
      startTyping(data.chatId, data.username);
    }
  };

  const handleStopTyping = (data: { username: string; chatId: string }) => {
    trackEvent("stop_typing: ", data);
    if (currentUserName !== data.username) {
      stopTyping(data.chatId, data.username);
    }
  };

  const navigateToChat = (chat: ChatDto) => {
    const currentUserName = useUserStore.getState().userName;
    if (chat?.isGroupChat) {
      const { groupKey, nonce: groupNonce } = chat?.encryptedGroupKeys?.find(
        (egk) => egk.username === currentUserName,
      ) as never;

      router.push({
        pathname: "/groupChatDetail/screens",
        params: {
          chatId: chat?.chatId,
          groupKey,
          groupNonce,
          userName: currentUserName,
          title: chat?.groupName,
          groupAccountCount: chat?.groupAccountCount,
          groupAdminAccount: chat?.groupAdminAccount,
          isGroupChat: (chat?.isGroupChat as never) ?? false,
          groupAdminUsername: "test-i17",
        },
      });
    } else {
      router.navigate({
        pathname: "/chatDetail/screens",
        params: {
          chatId: chat?.chatId,
          publicKey: chat?.contact?.publicKey,
          userName: chat?.contact?.nickname,
          isGroupChat: (chat?.isGroupChat as never) ?? false,
        },
      });
    }
  };

  const handleMessageDelivered = useCallback(
    (messageDeliveredEvent: MessageDeliveredEvent) => {
      trackEvent("message_delivered", { messageDeliveredEvent });

      const messageId = messageDeliveredEvent.message?.messageId;
      const messageStatus = messageDeliveredEvent.message?.messageStatus;

      if (!messageId || !messageStatus) return;

      const messages = getMessages(messageDeliveredEvent.message?.chat!);

      const deliveredMessage = messages.find((m) => m.messageId === messageId);
      if (!deliveredMessage) return;

      const deliveredMessageTime = deliveredMessage.createdAt
        ? new Date(deliveredMessage.createdAt).getTime()
        : 0;

      const messagesToUpdate = messages
        .filter((m) => {
          const msgTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          return (
            msgTime <= deliveredMessageTime &&
            m.senderUsername === currentUserName &&
            m.chat
          );
        })
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

      const updateMessages = messagesToUpdate.map((m) => ({
        chatId: m.chat,
        messageId: m.messageId,
        messageStatus: m.messageStatus,
      })) as StatusUpdate[];

      updateMessages.push({
        chatId: messageDeliveredEvent.message?.chat!,
        messageId,
        messageStatus,
      });

      updateStatus(updateMessages);
    },
    [currentUserName, getMessages, updateStatus],
  );

  const handleMessageSeen = useCallback(
    (messageSeenEvent: MessageSeenEvent) => {
      trackEvent("message_seen", { messageSeenEvent });

      const messageId = messageSeenEvent.message?.messageId;
      const messageStatus = messageSeenEvent.message?.messageStatus;

      if (!messageId || !messageStatus) return;

      const messages = getMessages(messageSeenEvent.message?.chat!);

      const seenMessage = messages.find((m) => m.messageId === messageId);
      if (!seenMessage) return;

      const seenMessageTime = seenMessage.createdAt
        ? new Date(seenMessage.createdAt).getTime()
        : 0;

      const messagesToUpdate = messages
        .filter((m) => {
          const msgTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          return (
            msgTime <= seenMessageTime &&
            m.senderUsername === currentUserName &&
            m.chat
          );
        })
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

      const updateMessages = messagesToUpdate.map((m) => ({
        chatId: m.chat,
        messageId: m.messageId,
        messageStatus: m.messageStatus,
      })) as StatusUpdate[];

      updateMessages.push({
        chatId: messageSeenEvent.message?.chat!,
        messageId,
        messageStatus,
      });

      updateStatus(updateMessages);
    },
    [currentUserName, getMessages, updateStatus],
  );

  const handleMessageReceived = useCallback(
    async (messageReceivedEvent: MessageReceivedEvent) => {
      trackEvent("message_received", { messageReceivedEvent });

      const newMessage = messageReceivedEvent?.message;
      const chatId = messageReceivedEvent?.chat?.chatId;
      if (!newMessage || !chatId) return;

      setLastReceivedMessage(newMessage);
      sendMessage(chatId, newMessage);

      // Invalidate messages cache for this chat
      if (chatId) {
        queryClient.invalidateQueries?.({
          queryKey: getGetApiChatsMessagesQueryKey({ chatId }),
        });
      }

      // Invalidate chat list cache to update last message preview
      queryClient.invalidateQueries?.({
        queryKey: getGetApiChatsListQueryKey(),
      });

      // Use ref to get the latest pathname (avoids stale closure)
      if (isInChatScreen(pathnameRef.current)) return;

      showToast({
        type: "notification",
        text1: t("common.newMessageReceived"),
        text2: t("common.newMessageReceivedDesc", {
          title: messageReceivedEvent.chat?.isGroupChat
            ? messageReceivedEvent.chat?.groupName
            : messageReceivedEvent.chat?.contact?.nickname,
        }),
        onPress: () => navigateToChat(messageReceivedEvent.chat),
      });
    },
    [queryClient, sendMessage, navigateToChat, setLastReceivedMessage, t],
  );

  // Keep ref in sync with pathname
  useEffect(() => {
    pathnameRef.current = pathname;
    setCurrentRoute(pathname);
  }, [pathname, setCurrentRoute]);

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.on("user_online", handleUserOnline);
      magicHubClient.on("user_offline", handleUserOffline);
      magicHubClient.on("typing", handleTyping);
      magicHubClient.on("stop_typing", handleStopTyping);

      magicHubClient.on("message_received", handleMessageReceived);
      magicHubClient.on("group_message_received", handleMessageReceived);

      magicHubClient.on("message_delivered", handleMessageDelivered);
      magicHubClient.on("message_seen", handleMessageSeen);
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("user_online");
        magicHubClient.off("user_offline");
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");

        magicHubClient.off("message_received");
        magicHubClient.off("group_message_received");

        magicHubClient.off("message_delivered");
        magicHubClient.off("message_seen");
      }
    };
  }, [magicHubClient]);
};
