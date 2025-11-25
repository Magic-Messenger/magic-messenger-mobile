import { MessageStatus, MessageType } from "@/api/models";

export interface MessageContentProps {
  decryptedContent: string | null;
  decryptedReplyMessage?: string | null;
  isSentByCurrentUser?: boolean;
  createdAt?: string;
  messageStatus?: MessageStatus;
  isLoading?: boolean;
  replyMessageType?: MessageType;
  isReply?: boolean;
}
