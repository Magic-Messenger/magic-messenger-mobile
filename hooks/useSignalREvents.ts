import { router, usePathname } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ChatDto } from "@/api/models";
import { Colors, MessageReceivedEvent } from "@/constants";
import { useUserStore } from "@/store";
import { useSignalRStore } from "@/store/signalRStore";
import { showToast, trackEvent } from "@/utils";

const chatsScreens = ["/chatDetail/screens", "/groupChatDetail/screens"];

const isInChatScreen = (pathname?: string) => {
  return chatsScreens.some((screen) => pathname?.includes(screen));
};

export const useSignalREvents = () => {
  const { t } = useTranslation();
  const pathname = usePathname();

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const addOnlineUser = useSignalRStore((s) => s.addOnlineUser);
  const removeOnlineUser = useSignalRStore((s) => s.removeOnlineUser);
  const startTyping = useSignalRStore((s) => s.startTyping);
  const stopTyping = useSignalRStore((s) => s.stopTyping);
  const setCurrentRoute = useSignalRStore((s) => s.setCurrentRoute);
  const currentRoute = useSignalRStore((s) => s.currentRoute);
  const receivedMessage = useSignalRStore((s) => s.receivedMessage);
  const setReceivedMessage = useSignalRStore((s) => s.setReceivedMessage);

  const currentUserName = useUserStore((state) => state.userName);

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

  const navigateToChat = useCallback(
    (chat: ChatDto) => {
      if (chat.isGroupChat) {
        router.navigate({
          pathname: "/groupChatDetail/screens",
          params: {
            chatId: chat?.chatId,
            groupKey: chat?.groupKey,
            groupNonce: chat?.groupNonce,
            userName: currentUserName,
            groupAccountCount: chat?.groupAccountCount,
            groupAdminAccount: chat?.groupAdminAccount,
            isGroupChat: (chat?.isGroupChat as never) ?? false,
          },
        });
      } else {
        router.navigate({
          pathname: "/chatDetail/screens",
          params: {
            chatId: chat?.chatId,
            publicKey: chat?.contact?.publicKey,
            userName: chat?.contact?.contactUsername,
            isGroupChat: (chat?.isGroupChat as never) ?? false,
          },
        });
      }
    },
    [router, currentUserName],
  );

  const handleMessageReceived = useCallback(
    ({ chat, message }: MessageReceivedEvent) => {
      trackEvent("chat_message_received", chat);

      setReceivedMessage({ chat, message });
    },
    [setReceivedMessage],
  );

  useEffect(() => {
    if (isInChatScreen(currentRoute) || !receivedMessage) return;

    const receivedMessageChat = receivedMessage.chat;

    setReceivedMessage(undefined);

    showToast({
      type: "success",
      text1: t("common.newMessageReceived"),
      text2: t("common.newMessageReceivedDesc", {
        title: receivedMessageChat?.isGroupChat
          ? receivedMessageChat?.groupName
          : receivedMessageChat?.contact?.nickname,
      }),
      text2Style: {
        color: Colors.text,
      },
      onPress: () => navigateToChat(receivedMessageChat),
    });
  }, [currentRoute, receivedMessage]);

  useEffect(() => {
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
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("user_online");
        magicHubClient.off("user_offline");
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");

        magicHubClient.off("message_received");
        magicHubClient.off("group_message_received");
      }
    };
  }, [magicHubClient]);
};
