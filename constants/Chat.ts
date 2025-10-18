import {
  MessageType,
  UploadFileCommandResultIDataResultData,
} from "@/api/models";

export type UploadFileResultDto = UploadFileCommandResultIDataResultData & {
  messageType?: MessageType;
};

export type ChatListItem = {
  type: "header" | "item";
  title?: string;
  item?: any;
};
