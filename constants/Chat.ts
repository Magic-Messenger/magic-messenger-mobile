import {
  MessageType,
  UploadFileCommandResultIDataResultData,
} from "@/api/models";

export type UploadFileResultDto = UploadFileCommandResultIDataResultData & {
  messageType?: MessageType;
};
