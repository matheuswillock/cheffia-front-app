import { Output } from "@/models/Output";

export class OutputGetRestaurantById {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  supabaseId: string;
  ownerFullName: string;
  document: string;
  providerAvatarUrl: string;
  restaurantMenuId: string;

  constructor(
    id: string,
    name: string,
    address: string,
    phoneNumber: string,
    email: string,
    supabaseId: string,
    ownerFullName: string,
    document: string,
    providerAvatarUrl: string,
    restaurantMenuId: string
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.supabaseId = supabaseId;
    this.ownerFullName = ownerFullName;
    this.document = document;
    this.providerAvatarUrl = providerAvatarUrl;
    this.restaurantMenuId = restaurantMenuId;
  }

  static fromOutputResult(output: Output): OutputGetRestaurantById {
    return new OutputGetRestaurantById(
      output.result.id,
      output.result.name,
      output.result.address,
      output.result.phoneNumber,
      output.result.email,
      output.result.supabaseId,
      output.result.ownerFullName,
      output.result.document,
      output.result.providerAvatarUrl,
      output.result.restaurantMenuId
    );
  }

}