import { Output } from "@/models/Output";

export class OutputCreateIntent {
  clientSecret: string;

  constructor(clientSecret: string) {
    this.clientSecret = clientSecret;
  }

  static fromOutputResult(output: Output): OutputCreateIntent {
    return new OutputCreateIntent(output.result.clientSecret);
  }
}