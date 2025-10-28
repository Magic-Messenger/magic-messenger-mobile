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
}: MessageContentProps) {
  return (
    <>
      <ReplyMessageItem message={decryptedReplyMessage} />
      <ThemedText>{decryptedContent}</ThemedText>
      <MessageFooter
        createdAt={createdAt}
        isSentByCurrentUser={isSentByCurrentUser}
        messageStatus={messageStatus}
      />
    </>
  );
}
