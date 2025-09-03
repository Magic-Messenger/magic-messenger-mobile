export type SettingsItemType = {
  title: string;
  description: string;
  value: boolean | number;
  options?: SettingsItemOption[];
  onSettingsChanged?: (value: boolean | number) => Promise<void> | void;
};

export type SettingsItemOption = {
  label: string;
  value: number;
};
