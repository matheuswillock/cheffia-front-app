import { AskAQuestionData } from "@/types/formTypes";

export class InputAskCheffia {
  username = "Ask Cheffia bot"; 
  title: string = "📩 Nova dúvida recebida!";
  color: string = "0x01fba1";
  name: string;
  email: string;
  contact: string;
  message: string;

  constructor(name: string,  email: string, countryCode: string, contact: string, message: string) {
    this.name = name;
    this.email = email;
    this.message = message;
    this.contact = `${countryCode} ${contact}`;
  }

  static fromFormData(data: AskAQuestionData) {
    return new InputAskCheffia(
      data.name,
      data.email,
      data.countryCode,
      data.contact,
      data.message
    );
  }

  toDiscordAskChannelPayload() {
    return {
      username: this.username,
      content: "Nova pergunta recebida!",
      embeds: [
        {
          title: this.title || "Default Title",
          color: parseInt(this.color.replace("0x", ""), 16),
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
              value: this.contact || "No Contact",
              inline: false,
            },
            {
              name: "Message",
              value: this.message || "No Message",
              inline: false,
            },
          ],
        },
      ],
    };
  }


}