import { Output } from "@/models/Output";
import { cheffiaDiscordConfig } from "./config/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";

const url = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL as string;

export const SendAskToCheffia = async (input: InputAskCheffia): Promise<Output> => {
  try {
    const data = {
      username: input.username,
      embeds: [
        {
          title: input.title,
          color: input.color,
          fields: [
            {
              name: "Name",
              value: input.name,
              inline: true,
            },
            {
              name: "Email",
              value: input.email,
              inline: true,
            },
            {
              name: "Country Code",
              value: input.countryCode,
              inline: true,
            },
            {
              name: "Contact",
              value: input.contact,
              inline: true,
            },
            {
              name: "Message",
              value: input.message,
            },
          ],
        },
      ],
    };

    console.log("Sending data to Cheffia:", data);
    console.log("Webhook URL:", url);

    const response = await cheffiaDiscordConfig.post(url, data);

    return response.data;
  } catch (error) {
    console.error('Error sending ask to Cheffia:', error);
    throw error;
  }
}