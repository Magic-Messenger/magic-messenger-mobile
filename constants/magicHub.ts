import * as signalR from "@microsoft/signalr";

import {
  AddMessageToTicketCommandRequest,
  AnswerCallCommandRequest,
  CallingType,
  CallUserCommandRequest,
  ChangeTicketStatusCommandRequest,
  ChatDto,
  IceCandidateCommandRequest,
  MessageDto,
  SendMessageCommandRequest,
  TicketDto,
  TicketMessageDto,
} from "@/api/models";

export interface EndCallCommandRequest {
  targetUsername: string;
  callId: string;
}

export interface RejectCallCommandRequest {
  callerUsername: string; // Changed from targetUsername to callerUsername per spec
  callId: string;
}

export interface CallEndedEvent {
  endedUsername: string; // Changed from username
}

export interface CallRejectedEvent {
  rejectedUsername: string; // Changed from CallDeclinedEvent/username
}

export interface ToggleCameraCommandRequest {
  targetUsername: string;
  isEnabled: boolean; // Changed to isEnabled
}

export interface CameraToggleEvent {
  toggledUsername: string; // Changed from username
  isEnabled: boolean;
}

export interface ToggleMicrophoneCommandRequest {
  targetUsername: string;
  isEnabled: boolean;
}

export interface MicrophoneToggleEvent {
  toggledUsername: string;
  isEnabled: boolean;
}

export const createMagicHubClient = (
  connection: signalR.HubConnection,
): MagicHubClient => ({
  on: (eventName, callback) => connection.on(eventName, callback),
  off: (eventName) => connection.off(eventName),
  joinApp: () => connection.invoke("JoinApp"),
  joinChat: (chatId) => connection.invoke("JoinChat", chatId),
  leaveChat: (chatId) => connection.invoke("LeaveChat", chatId),
  leaveTicket: (ticketId) => connection.invoke("LeaveTicket", ticketId),
  joinTicket: (ticketId) => connection.invoke("JoinTicket", ticketId),
  typing: (chatId) => connection.invoke("Typing", chatId),
  stopTyping: (chatId) => connection.invoke("StopTyping", chatId),
  sendMessage: (request: SendMessageCommandRequest) =>
    connection.invoke("SendMessage", request),
  deliveredMessage: (chatId, messageId) =>
    connection.invoke("DeliveredMessage", chatId, messageId),
  viewedMessage: (chatId, messageId) =>
    connection.invoke("ViewedMessage", chatId, messageId),
  blockUser: (blockedUsername) =>
    connection.invoke("BlockUser", blockedUsername),
  unblockUser: (unblockUsername) =>
    connection.invoke("UnblockUser", unblockUsername),
  addMessageToTicket: (request: AddMessageToTicketCommandRequest) =>
    connection.invoke("AddMessageToTicket", request),
  changeTicketStatus: (request: ChangeTicketStatusCommandRequest) =>
    connection.invoke("ChangeTicketStatus", request),
  onlineUsers: () => connection.invoke("OnlineUsers"),
  callUser: (request) => connection.invoke("CallUser", request),
  answerCall: (request) => connection.invoke("AnswerCall", request),
  sendIceCandidate: (request) => connection.invoke("SendIceCandidate", request),
  endCall: (request) => connection.invoke("EndCall", request),
  rejectCall: (request) => connection.invoke("RejectCall", request), // Changed from decreaseCall
  toggleCamera: (request) => connection.invoke("ToggleCamera", request),
  toggleMicrophone: (request) => connection.invoke("ToggleMicrophone", request),
});

/* Types */

export interface TypingEvent {
  chatId: string;
  username: string;
}

export interface StopTypingEvent {
  chatId: string;
  username: string;
}

export interface YouBlockedEvent {
  blockedBy: string;
  message: string;
}

export interface UserOnlineEvent {
  username: string;
}

export interface UserOfflineEvent {
  username: string;
}

export interface UnreadCountEvent {
  chatId: string;
  unreadCount: number;
}

export interface AddedInGroupEvent {
  chatId: string;
  name: string;
}

export interface BlockedEvent {
  blockedBy: string;
}

export interface UnblockedEvent {
  unblockedBy: string;
}

export interface MessageDeliveredEvent {
  message: MessageDto;
  deliveredTo: string;
}

export interface MessageSeenEvent {
  message: MessageDto;
  readBy: string;
}

export interface MessageReceivedEvent {
  message: MessageDto;
  chat: ChatDto;
}

export interface IncomingCallEvent {
  callId: string;
  callerUsername: string;
  callerNickname: string;
  callingType: CallingType;
  offer: string;
}

export interface CallAnsweredEvent {
  answerUsername: string;
  answerType: CallingType;
  answer: string;
}

export interface IceCandidateEvent {
  callerUsername: string;
  candidate: string;
}

export interface MagicHubEvents {
  typing: TypingEvent;
  stop_typing: StopTypingEvent;
  you_blocked: YouBlockedEvent;
  message_received: MessageReceivedEvent;
  group_message_received: MessageReceivedEvent;
  message_delivered: MessageDeliveredEvent;
  message_seen: MessageSeenEvent;
  user_online: UserOnlineEvent;
  user_offline: UserOfflineEvent;
  unread_count: UnreadCountEvent;
  added_in_group: AddedInGroupEvent;
  blocked: BlockedEvent;
  unblocked: UnblockedEvent;
  get_ticket_message: TicketMessageDto;
  change_ticket_status: TicketDto;
  incoming_call: IncomingCallEvent;
  call_answered: CallAnsweredEvent;
  ice_candidate: IceCandidateEvent;
  call_ended: CallEndedEvent;
  call_rejected: CallRejectedEvent; // Changed from call_declined
  camera_toggle: CameraToggleEvent; // Changed from camera_toggled
  microphone_toggle: MicrophoneToggleEvent; // Added
}

export interface MagicHubClient {
  on<T extends keyof MagicHubEvents>(
    methodName: T,
    callback: (data: MagicHubEvents[T]) => void,
  ): void;

  off<T extends keyof MagicHubEvents>(methodName: T): void;

  joinApp(): Promise<void>;

  joinChat(chatId: string): Promise<void>;

  joinTicket(ticketId: string): Promise<void>;

  leaveChat(chatId: string): Promise<void>;

  leaveTicket(ticketId: string): Promise<void>;

  typing(chatId: string): Promise<void>;

  stopTyping(chatId: string): Promise<void>;

  sendMessage(request: SendMessageCommandRequest): Promise<void>;

  deliveredMessage(chatId: string, messageId?: string): Promise<void>;

  viewedMessage(chatId: string, messageId?: string): Promise<void>;

  blockUser(blockedUsername: string): Promise<void>;

  unblockUser(unblockUsername: string): Promise<void>;

  addMessageToTicket(request: AddMessageToTicketCommandRequest): Promise<void>;

  changeTicketStatus(request: ChangeTicketStatusCommandRequest): Promise<void>;

  onlineUsers(): Promise<number>;

  callUser(request: CallUserCommandRequest): Promise<string>;

  answerCall(request: AnswerCallCommandRequest): Promise<void>;

  sendIceCandidate(request: IceCandidateCommandRequest): Promise<void>;

  endCall(request: EndCallCommandRequest): Promise<void>;

  rejectCall(request: RejectCallCommandRequest): Promise<void>; // Changed from declineCall

  toggleCamera(request: ToggleCameraCommandRequest): Promise<void>;

  toggleMicrophone(request: ToggleMicrophoneCommandRequest): Promise<void>;
}
