import { ContactItem } from "@/components";

interface Props {
  title: string;
  updatedAt: string;
  onPress?: () => void;
}

export function NoteItem({ title, updatedAt, onPress }: Props) {
  return (
    <ContactItem
      nickname={title}
      contactUsername={updatedAt}
      onAction={{
        onPress,
      }}
    />
  );
}
