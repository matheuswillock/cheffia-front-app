import { RegisterRestaurantFormData } from "@/types/formTypes";

export class InputToRegisterRestaurant {
  address: string | null;
  document: string | null;
  email: string | null;
  name: string | null;
  ownerFullName: string | null;
  supabaseId: string | null;
  phoneNumber: string | null;
  emailVerified: boolean | null;
  providerAvatarUrl: string | null;

  constructor(
    address: string | null = null,
    document: string | null = null,
    email: string | null = null,
    name: string | null = null,
    ownerFullName: string | null = null,
    supabaseId: string | null = null,
    phoneNumber: string | null = null,
    emailVerified: boolean | null = null,
    providerAvatarUrl: string | null = null
  ) {
    this.address = address;
    this.document = document;
    this.email = email;
    this.name = name;
    this.ownerFullName = ownerFullName;
    this.supabaseId = supabaseId;
    this.phoneNumber = phoneNumber;
    this.emailVerified = emailVerified;
    this.providerAvatarUrl = providerAvatarUrl;
  }

  static fromFormData(data: RegisterRestaurantFormData): InputToRegisterRestaurant {
    return new InputToRegisterRestaurant(
      data.address,
      data.document,
      data.email,
      data.name,
      data.ownerFullName,
      data.supabaseId,
      data.phoneNumber,
      data.emailVerified,
      data.providerAvatarUrl
    );
  }
}