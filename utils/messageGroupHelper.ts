import { MessageDto } from "@/api/models";

export type MessageWithDate = MessageDto | { type: "date"; date: string };

/**
 * Formats date for display in the message list
 * Returns "Bugün", "Dün" or formatted date
 */
export const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  // Reset time for date comparison
  const resetTime = (d: Date) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const todayReset = resetTime(new Date(today));
  const yesterdayReset = resetTime(new Date(yesterday));
  const messageDateReset = resetTime(new Date(messageDate));

  if (messageDateReset.getTime() === todayReset.getTime()) {
    return "Today";
  } else if (messageDateReset.getTime() === yesterdayReset.getTime()) {
    return "Yesterday";
  } else {
    // Format: "15 Mart 2024"
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return messageDate.toLocaleDateString("tr-TR", options);
  }
};

/**
 * Groups messages by date and inserts date separator items
 */
export const groupMessagesByDate = (
  messages: MessageDto[]
): MessageWithDate[] => {
  if (!messages || messages.length === 0) return [];

  const groupedMessages: MessageWithDate[] = [];
  let lastDate: string | null = null;

  messages.forEach((message) => {
    if (!message.createdAt) {
      groupedMessages.push(message);
      return;
    }

    const messageDate = new Date(message.createdAt);
    const formattedDate = formatMessageDate(messageDate);

    // If this is a new date group, add a date separator
    if (formattedDate !== lastDate) {
      groupedMessages.push({
        type: "date",
        date: formattedDate,
      });
      lastDate = formattedDate;
    }

    groupedMessages.push(message);
  });

  return groupedMessages;
};

/**
 * Type guard to check if item is a date separator
 */
export const isDateSeparator = (
  item: MessageWithDate
): item is { type: "date"; date: string } => {
  return (item as any).type === "date";
};
