import { Output } from "../Output";

export class OutputGetRestaurantById {
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
  customerOrders: any[];
  registerDate: Date;
  restaurantKitchen : string;
  restaurantMenu : string;
  verificationCode : string;

  constructor(id: string, name: string, address: string, phoneNumber: string, document: string, providerAvatarUrl: string, ownerFullName: string, email: string, emailVerified: boolean, supabaseId: string, customerOrders: any[], registerDate: Date, restaurantKitchen: string, restaurantMenu: string, verificationCode: string) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phoneNumber = phoneNumber;
    this.document = document;
    this.providerAvatarUrl = providerAvatarUrl;
    this.ownerFullName = ownerFullName;
    this.email = email;
    this.emailVerified = emailVerified;
    this.supabaseId = supabaseId;
    this.customerOrders = customerOrders;
    this.registerDate = registerDate;
    this.restaurantKitchen = restaurantKitchen;
    this.restaurantMenu = restaurantMenu;
    this.verificationCode = verificationCode;
  }

  static fromOutputResult(output: Output): OutputGetRestaurantById {
    return new OutputGetRestaurantById(
      output.result.id,
      output.result.name,
      output.result.address,
      output.result.phoneNumber,
      output.result.document,
      output.result.providerAvatarUrl,
      output.result.ownerFullName,
      output.result.email,
      output.result.emailVerified,
      output.result.supabaseId,
      output.result.customerOrders,
      output.result.registerDate,
      output.result.restaurantKitchen,
      output.result.restaurantMenu,
      output.result.verificationCode
    );
  }

}