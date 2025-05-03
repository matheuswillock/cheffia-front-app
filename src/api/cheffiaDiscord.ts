import { Output } from "@/models/Output";
import { cheffiaDiscordConfig } from "./config/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";

// const url = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL as string;
const url = "https://discord.com/api/webhooks/1368280027128528947/bJZcruH765sDxs4qo7pm4BNgsd1p9_DaF8gBRGm44Tsz0bTyYPaKSPoynrHJawDUGhPB";

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