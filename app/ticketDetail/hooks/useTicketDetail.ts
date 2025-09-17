import { FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getApiTicketsGet,
  usePostApiTicketsAddMessage,
} from "@/api/endpoints/magicMessenger";
import { TicketDetailDto, TicketMessageDto } from "@/api/models";
import { useSignalRStore, useUserStore } from "@/store";

export const useTicketDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlashListRef<TicketMessageDto>>(null);
  const { userName: currentUserName } = useUserStore();
  const { ticketId } = useLocalSearchParams();

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const [ticketDetail, setTicketDetail] = useState<TicketDetailDto | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<TicketMessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const { mutateAsync: sendApiMessage } = usePostApiTicketsAddMessage();

  const loadMessages = async () => {
    if (loading) return;
    setLoading(true);
    const { data } = await getApiTicketsGet({
      ticketId: ticketId as string,
    });

    if (data?.ticketMessages?.length) {
      setLoading(false);
      setTicketDetail(data);
      setMessages([
        {
          content: data.content,
          createdAt: data.createdAt,
          username: data.username,
          isMyMessage: data.username === currentUserName,
        },
        ...data?.ticketMessages,
      ]);
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }
    setLoading(false);
  };

  const handleSendMessage = async (message: string) => {
    await sendApiMessage({
      data: {
        ticketId: ticketId as string,
        content: message,
      },
    });
  };

  const handleChatControl = async (message: string) => {
    if (ticketId) await handleSendMessage(message);
  };

  useEffect(() => {
    if (ticketId) {
      loadMessages();
    }
  }, [ticketId, listRef]);

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.joinTicket(ticketId as string);
      magicHubClient.on("user_online", (data) => {
        setOnlineUsers((prev) => [...prev, data.username]);
      });
      magicHubClient.on("user_offline", (data) => {
        setOnlineUsers(onlineUsers.filter((x) => x !== data.username));
      });

      magicHubClient.on(
        "typing",
        (data) =>
          currentUserName !== data.username && setTypingUsername(data.username),
      );
      magicHubClient.on(
        "stop_typing",
        (data) => currentUserName !== data.username && setTypingUsername(""),
      );
      magicHubClient.on("get_ticket_message", (message) => {
        setMessages((prev) => [...prev, { ...message }]);
        if (listRef.current) {
          listRef.current.scrollToEnd({ animated: true });
        }
      });
    }
    return () => {
      if (magicHubClient) {
        magicHubClient.leaveTicket(ticketId as string);
        magicHubClient.off("typing");
        magicHubClient.off("stop_typing");
        magicHubClient.off("get_ticket_message");
        magicHubClient.off("user_online");
        magicHubClient.off("user_offline");
      }
    };
  }, [magicHubClient]);

  return {
    t,
    router,
    listRef,
    loading,
    ticketDetail,
    messages,
    onlineUsers,
    typingUsername,
    currentUserName,
    handleChatControl,
  };
};
