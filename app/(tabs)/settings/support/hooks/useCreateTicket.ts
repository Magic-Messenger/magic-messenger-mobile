import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { usePostApiTicketsCreate } from "@/api/endpoints/magicMessenger";
import { CreateTicketCommandRequest } from "@/api/models";
import { useThemedStyles } from "@/theme";
import { showToast } from "@/utils";

export const useCreateTicket = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isLoading },
  } = useForm<CreateTicketCommandRequest>();

  const { mutateAsync: createTicket, isPending } = usePostApiTicketsCreate();

  const handleGoToTickets = () =>
    router.navigate("/(tabs)/settings/support/screens/tickets");

  const onSubmit = async (formValues: CreateTicketCommandRequest) => {
    const { success } = await createTicket({
      data: {
        ...formValues,
      },
    });
    if (success) {
      showToast({
        text1: t("tickets.successAddedTicket"),
      });
      handleGoToTickets();
    }
  };

  return {
    t,
    styles,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    isLoading,
    onSubmit,
    isPending,
  };
};
