import * as signalR from "@microsoft/signalr";

import {
  AddMessageToTicketCommandRequest,
  AnswerCallCommandRequest,
  CallUserCommandRequest,
  ChangeTicketStatusCommandRequest,
  IceCandidateCommandRequest,
  MessageDto,
  SendMessageCommandRequest,
  TicketDto,
  TicketMessageDto,
} from "@/api/models";

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

export interface IncomingCallEvent {
  callerUsername: string;
  offer: string;
}

export interface CallAnsweredEvent {
  answerUsername: string;
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
  message_received: MessageDto;
  group_message_received: MessageDto;
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

  callUser(request: CallUserCommandRequest): Promise<void>;

  answerCall(request: AnswerCallCommandRequest): Promise<void>;

  sendIceCandidate(request: IceCandidateCommandRequest): Promise<void>;
}
