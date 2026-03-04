export interface RegisterRestaurantInput {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  emailVerified: boolean;
  supabaseId: string;
  ownerFullName: string;
  document: string;
  providerAvatarUrl: string;
}

export interface RestaurantOutput {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  document: string;
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
