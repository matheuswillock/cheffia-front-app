export interface RegisterRestaurantInput {
  name: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city?: string;
  state?: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  emailVerified: boolean;
  supabaseId: string;
  ownerFullName: string;
  document: string;
  personType: string;
  birthDate?: string | null;
  companyType?: string | null;
  providerAvatarUrl: string;
}

export interface RestaurantOutput {
  id: string;
  name: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  document: string;
  personType: string;
  birthDate: string | null;
  companyType: string | null;
  providerAvatarUrl: string;
  ownerFullName: string;
  email: string;
  emailVerified: boolean;
  supabaseId: string;
  customerOrders: unknown[];
  registerDate: string;
  restaurantKitchen: string;
  restaurantMenu: string;
  verificationCode: string;
}
