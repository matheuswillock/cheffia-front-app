import { SendAskToCheffia } from "@/api/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";
import { Output } from "@/models/Output";
import { AskAQuestionData } from "@/types/formTypes";

export const handleSendAsk = async (data: AskAQuestionData): Promise<Output> => {
  try {
    return await SendAskToCheffia(InputAskCheffia.fromFormData(data));
  } catch (error) {
    console.error('Error while sending ask to discord:', error);
    throw error;
  }
}