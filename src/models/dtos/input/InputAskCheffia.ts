import { AskAQuestionData } from "@/types/formTypes";

export class InputAskCheffia {
  username = "Ask Cheffia bot"; 
  title: string = "📩 Nova dúvida recebida!";
  color: string = "#58147830";
  name: string;
  email: string;
  countryCode: string;
  contact: string;
  message: string;

  constructor(name: string,  email: string, countryCode: string, contact: string, message: string) {
    this.name = name;
    this.email = email;
    this.message = message;
    this.contact = contact;
    this.countryCode = countryCode;
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

}