import { useEffect } from "react";

import { useUserStore } from "@/store";
import { useSignalRStore } from "@/store/signalRStore";
import { trackEvent } from "@/utils";

export const useSignalREvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const addOnlineUser = useSignalRStore((s) => s.addOnlineUser);
  const removeOnlineUser = useSignalRStore((s) => s.removeOnlineUser);
  const startTyping = useSignalRStore((s) => s.startTyping);
  const stopTyping = useSignalRStore((s) => s.stopTyping);

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

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.on("user_online", handleUserOnline);
      magicHubClient.on("user_offline", handleUserOffline);
      magicHubClient.on("typing", handleTyping);
      magicHubClient.on("stop_typing", handleStopTyping);
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("user_online");
        magicHubClient.off("user_offline");
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");
      }
    };
  }, [magicHubClient]);
};
