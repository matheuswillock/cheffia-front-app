import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddMenuItemSchema, RegisterRestaurantFormSchema, signUpFormSchema } from "@/utils/validation";
import { AddMenuItemData, RegisterRestaurantFormData, SignUpFormData } from "@/types/formTypes";
import { UUID } from "crypto";

interface UseRegisterRestaurantFormProps {
  ownerFullName?: string;
  email: string;
  avatarUrl?: string;
  emailVerified: boolean;
  id: string;
}

interface UseAddMenuItemFormProps {
  restaurantId: string;
}

export function UseRegisterRestaurantForm({ 
  ownerFullName, email, id, avatarUrl, emailVerified
}: UseRegisterRestaurantFormProps) {
  const form = useForm<RegisterRestaurantFormData>({
    resolver: zodResolver(RegisterRestaurantFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      email: "",
      supabaseId: "",
      ownerFullName: "",
      emailVerified: false,
      providerAvatarUrl: "",
      document: "",
    },
  });

  form.setValue("ownerFullName", ownerFullName || "");
  form.setValue("email", email);
  form.setValue("supabaseId", id);
  form.setValue("providerAvatarUrl", avatarUrl || "");
  form.setValue("emailVerified", emailVerified);

  return form;
}

export function UseSignUpForm() {
  return useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    }
  });
}

export function UseAddMenuItemForm({ restaurantId }: UseAddMenuItemFormProps) {
  return useForm<AddMenuItemData>({
    resolver: zodResolver(AddMenuItemSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      ingredients: [],
      itemMedia: undefined,
      restaurantId: restaurantId
    }
  });
}