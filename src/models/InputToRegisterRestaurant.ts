import { FormData } from "@/types/formTypes";

export class InputToRegisterRestaurant {
  address: string | null;
  document: string | null;
  email: string | null;
  name: string | null;
  ownerFullName: string | null;
  password: string | null;
  phoneNumber: string | null;


  constructor(
    address: string | null = null,
    document: string | null = null,
    email: string | null = null,
    name: string | null = null,
    ownerFullName: string | null = null,
    password: string | null = null,
    phoneNumber: string | null = null
  ) {
    this.address = address;
    this.document = document;
    this.email = email;
    this.name = name;
    this.ownerFullName = ownerFullName;
    this.password = password;
    this.phoneNumber = phoneNumber;
  }

  static fromFormData(data: FormData): InputToRegisterRestaurant {
    return new InputToRegisterRestaurant(
      data.address,
      data.document,
      data.email,
      data.name,
      data.ownerFullName,
      data.password,
      data.phoneNumber
    );
  }
}