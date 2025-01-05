import { z } from "zod";
import { formSchema } from "@/utils/validation";

export type FormData = z.infer<typeof formSchema>;