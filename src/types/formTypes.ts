import { z } from "zod";
import { formSchema, AddMenuItemSchema } from "@/utils/validation";

export type FormData = z.infer<typeof formSchema>;
export type AddMenuItemData = z.infer<typeof AddMenuItemSchema>;