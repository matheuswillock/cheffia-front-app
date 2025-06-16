import { Output } from "@/models/Output";
import { cheffiaDiscordConfig } from "./config/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";
import axios from "axios";
import { InputJoinWaitlist } from "@/models/dtos/input/InputJoinWaitlist";
import { CheffiaDiscordRoutes } from "./routes/routesConfig";

export const SendAskToCheffia = async (input: InputAskCheffia): Promise<Output> => {
  try {
    const response = await cheffiaDiscordConfig.post(
      CheffiaDiscordRoutes.sendAsk,
      input.toDiscordAskChannelPayload()
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

export const insertClientOnWaitlist = async (input: InputJoinWaitlist): Promise<Output> => {
  try {

        console.log('Data to insert on waitlist:', input);
    console.log('Data to insert on waitlist:', JSON.stringify(input.toDiscordWaitlistChannelPayload(), null, 2));

    const response = await cheffiaDiscordConfig.post(
      CheffiaDiscordRoutes.insertClientOnWaitlist,
      input.toDiscordWaitlistChannelPayload()
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}