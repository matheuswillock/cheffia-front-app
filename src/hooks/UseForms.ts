import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  AddMenuItemSchema, 
  AskAQuestionSchema, 
  JoinWaitlistSchema, 
  RegisterRestaurantFormSchema, 
  signUpFormSchema,
  userProfileFormSchema,
} from "@/utils/validation";
import { 
  AddMenuItemData, 
  RegisterRestaurantFormData, 
  SignUpFormData, 
  UserProfileFormData,
  AskAQuestionData, 
  JoinWaitlistData
} from "@/types/formTypes";

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
  return useForm<RegisterRestaurantFormData>({
    resolver: zodResolver(RegisterRestaurantFormSchema),
    defaultValues: {
      name: "",
      address: "",
      addressNumber: "",
      complement: "",
      province: "",
      postalCode: "",
      phoneNumber: "",
      email: email || "",
      supabaseId: id || "",
      ownerFullName: ownerFullName ||"",
      emailVerified: emailVerified,
      providerAvatarUrl: avatarUrl || "",
      document: "",
      birthDate: "",
      companyType: "",
    },
  });
}

export function UseSignUpForm() {
  return useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      document: "",
      role: "",
      jobTitle: "",
      department: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });
}

export function UseUserProfileForm(initialValues?: Partial<UserProfileFormData>) {
  return useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      fullName: initialValues?.fullName ?? "",
      birthDate: initialValues?.birthDate ?? "",
      document: initialValues?.document ?? "",
      role: initialValues?.role ?? "",
      jobTitle: initialValues?.jobTitle ?? "",
      department: initialValues?.department ?? "",
    },
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

export function UseAskAQuestionForm() {
  return useForm<AskAQuestionData>({
    resolver: zodResolver(AskAQuestionSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      countryCode: "",
      contact: "",
      message: ""
    }
  });
}

export function UseJoinWaitlistForm() {
  return useForm<JoinWaitlistData>({
    resolver: zodResolver(JoinWaitlistSchema),
    mode: "onChange",
    defaultValues: {
      restaurantName: "",
      name: "",
      email: "",
      countryCode: "",
      restaurantContact: "",
      city: "",
      state: "",
      restaurantSize: "",
      ticketAverage: "",
      platformName: "",
    }
  });
}
