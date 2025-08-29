import {Control} from "react-hook-form/dist/types/form";
import type {FieldErrors} from "react-hook-form/dist/types/errors";

export type PasswordInputType = {
    name?: string;
    label?: string;
    placeholder?: string;
    control?: Control<TFieldValues, TContext, TTransformedValues>;
    errors?: FieldErrors<TFieldValues>;
} & InputPro
