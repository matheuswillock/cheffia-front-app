import { RegisterRestaurantFormData } from "@/types/formTypes";

export class InputToRegisterRestaurant {
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  document: string | null;
  email: string | null;
  name: string | null;
  ownerFullName: string | null;
  postalCode: string | null;
  province: string | null;
  supabaseId: string | null;
  phoneNumber: string | null;
  emailVerified: boolean | null;
  birthDate: string | null;
  companyType: string | null;
  providerAvatarUrl: string | null;

  constructor(
    address: string | null = null,
    addressNumber: string | null = null,
    complement: string | null = null,
    city: string | null = null,
    state: string | null = null,
    document: string | null = null,
    email: string | null = null,
    name: string | null = null,
    ownerFullName: string | null = null,
    postalCode: string | null = null,
    province: string | null = null,
    supabaseId: string | null = null,
    phoneNumber: string | null = null,
    emailVerified: boolean | null = null,
    birthDate: string | null = null,
    companyType: string | null = null,
    providerAvatarUrl: string | null = null
  ) {
    this.address = address;
    this.addressNumber = addressNumber;
    this.complement = complement;
    this.city = city;
    this.state = state;
    this.document = document;
    this.email = email;
    this.name = name;
    this.ownerFullName = ownerFullName;
    this.postalCode = postalCode;
    this.province = province;
    this.supabaseId = supabaseId;
    this.phoneNumber = phoneNumber;
    this.emailVerified = emailVerified;
    this.birthDate = birthDate;
    this.companyType = companyType;
    this.providerAvatarUrl = providerAvatarUrl;
  }

  static fromFormData(data: RegisterRestaurantFormData): InputToRegisterRestaurant {
    return new InputToRegisterRestaurant(
      data.address,
      data.addressNumber,
      data.complement ?? null,
      data.city ?? null,
      data.state ?? null,
      data.document,
      data.email,
      data.name,
      data.ownerFullName,
      data.postalCode,
      data.province,
      data.supabaseId,
      data.phoneNumber,
      data.emailVerified,
      data.birthDate ?? null,
      data.companyType ?? null,
      data.providerAvatarUrl
    );
  }
}
