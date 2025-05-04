import { Output } from "@/models/Output";
import { cheffiaDiscordConfig } from "./config/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";
import axios from "axios";
import { InputJoinWaitlist } from "@/models/dtos/input/InputJoinWaitlist";

const sendAskUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_ASK as string;
const waitlistUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_WAITLIST as string;

export const SendAskToCheffia = async (input: InputAskCheffia): Promise<Output> => {
  try {
    const response = await cheffiaDiscordConfig.post(
      sendAskUrl,
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
      waitlistUrl, 
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