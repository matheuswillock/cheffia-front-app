import { Output } from "@/models/Output";

export class OutputDeleteMenu {
  success: boolean;

  constructor(success: boolean) {
    this.success = success;
  }

  static fromJson(output: Output): OutputDeleteMenu {
    return new OutputDeleteMenu(output.isValid);
  }
}