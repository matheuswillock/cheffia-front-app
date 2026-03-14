import { z } from "zod";
import {
  RegisterRestaurantFormSchema,
  AddMenuItemSchema,
  signUpFormSchema,
  userProfileFormSchema,
  AskAQuestionSchema,
  JoinWaitlistSchema
} from "@/utils/validation";

export type SignUpFormData = z.infer<typeof signUpFormSchema>;
export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;
export type RegisterRestaurantFormData = z.infer<typeof RegisterRestaurantFormSchema>;
export type AddMenuItemData = z.infer<typeof AddMenuItemSchema>;
export type AskAQuestionData = z.infer<typeof AskAQuestionSchema>;
export type JoinWaitlistData = z.infer<typeof JoinWaitlistSchema>;
