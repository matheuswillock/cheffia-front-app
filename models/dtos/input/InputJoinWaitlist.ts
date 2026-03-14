import { JoinWaitlistData } from "@/types/formTypes";

export class InputJoinWaitlist {
  username = "Join Waitlist bot"; 
  title: string = "📩 Nova inscrição na lista de espera!";
  color: string = "0x01fba1";
  name: string;
  email: string;
  postalCode: string;
  street: string;
  addressNumber: string;
  city: string;
  state: string;
  country: string;
  restaurantName: string;
  restaurantContact: string;
  restaurantSize: string;
  ticketAverage: string | undefined;
  platformName: string | undefined;

  constructor(
    name: string,
    email: string,
    countryCode: string,
    postalCode: string,
    street: string,
    addressNumber: string,
    city: string,
    state: string,
    country: string,
    restaurantName: string,
    restaurantContact: string,
    restaurantSize: string,
    ticketAverage?: string,
    platformName?: string
  ) {
    this.name = name;
    this.email = email;
    this.postalCode = postalCode;
    this.street = street;
    this.addressNumber = addressNumber;
    this.city = city;
    this.state = state;
    this.country = country;
    this.restaurantName = restaurantName;
    this.restaurantContact = `${countryCode} ${restaurantContact}`;
    this.restaurantSize = restaurantSize;
    this.ticketAverage = ticketAverage;
    this.platformName = platformName;
  }

  static fromFormData(data: JoinWaitlistData) {
    return new InputJoinWaitlist(
      data.name,
      data.email,
      data.countryCode,
      data.postalCode,
      data.street,
      data.addressNumber,
      data.city,
      data.state,
      data.country,
      data.restaurantName,
      data.restaurantContact,
      data.restaurantSize,
      data.ticketAverage,
      data.platformName
    );
  }

  toDiscordWaitlistChannelPayload() {
    return {
      username: this.username,
      content: "Nova inscrição na lista de espera!",
      embeds: [
        {
          title: this.title || "Default Title",
          color: parseInt(this.color.replace("0x", ""), 16), // Converte hexadecimal para decimal
          fields: [
            {
              name: "Name",
              value: this.name || "No Name Provided",
              inline: false,
            },
            {
              name: "Email",
              value: this.email || "No Email Provided",
              inline: false,
            },
            {
              name: "Contact",
              value: this.restaurantContact || "No Contact",
              inline: false,
            },
            {
              name: "Postal Code",
              value: this.postalCode || "No Postal Code Provided",
              inline: false,
            },
            {
              name: "Street",
              value: this.street || "No Street Provided",
              inline: false,
            },
            {
              name: "Address Number",
              value: this.addressNumber || "No Address Number Provided",
              inline: false,
            },
            {
              name: "City",
              value: this.city || "No City Provided",
              inline: false,
            },
            {
              name: "State",
              value: this.state || "No State Provided",
              inline: false,
            },
            {
              name: "Country",
              value: this.country || "No Country Provided",
              inline: false,
            },
            {
              name: "Restaurant Name",
              value: this.restaurantName || "No Restaurant Name Provided",
              inline: false,
            },
            {
              name: "Restaurant Size",
              value: this.restaurantSize || "No Restaurant Size Provided",
              inline: false,
            },
            {
              name: "Ticket Average",
              value: this.ticketAverage || "No Ticket Average Provided",
              inline: false,
            },
            {
              name: "Actual Platform Name",
              value: this.platformName || "No Platform Name Provided",
              inline: false,
            },
          ],
        },
      ],
    };
  }
}
