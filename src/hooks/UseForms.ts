import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddMenuItemSchema, RegisterRestaurantFormSchema, signUpFormSchema } from "@/utils/validation";
import { AddMenuItemData, RegisterRestaurantFormData, SignUpFormData } from "@/types/formTypes";

interface UseRegisterRestaurantFormProps {
  ownerFullName?: string;
  email?: string;
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
      email: email || "",
      supabaseId: id || "",
      ownerFullName: ownerFullName ||"",
      emailVerified: emailVerified,
      providerAvatarUrl: avatarUrl || "",
      document: "",
    },
  });

  console.log(form.getValues());
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