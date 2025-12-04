import React from "react";

import { ThemedText } from "@/components";

import { ReplyMessageItem } from "../ReplyMessageItem";
import { MessageFooter } from "./MessageFooter";
import { MessageContentProps } from "./types";

export function TextMessage({
  decryptedContent,
  decryptedReplyMessage,
  isSentByCurrentUser,
  createdAt,
  messageStatus,
  replyMessageType,
  isReply = false,
}: MessageContentProps) {
  return (
    <>
      {!isReply && (
        <ReplyMessageItem
          message={decryptedReplyMessage}
          replyMessageType={replyMessageType}
        />
      )}
      <ThemedText>{decryptedContent}</ThemedText>
      {!isReply && (
        <MessageFooter
          createdAt={createdAt as string}
          isSentByCurrentUser={isSentByCurrentUser as boolean}
          messageStatus={messageStatus}
        />
      )}
    </>
  );
}
