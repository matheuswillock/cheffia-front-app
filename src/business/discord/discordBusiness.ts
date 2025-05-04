import { insertClientOnWaitlist, SendAskToCheffia } from "@/api/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";
import { InputJoinWaitlist } from "@/models/dtos/input/InputJoinWaitlist";
import { Output } from "@/models/Output";
import { AskAQuestionData, JoinWaitlistData } from "@/types/formTypes";

export const handleSendAsk = async (data: AskAQuestionData): Promise<Output> => {
  try {
    return await SendAskToCheffia(InputAskCheffia.fromFormData(data));
  } catch (error) {
    console.error('Error while sending ask to discord:', error);
    throw error;
  }
}

export const handleInsertClientOnWaitlist = async (data: JoinWaitlistData): Promise<Output> => {
  try {
    return await insertClientOnWaitlist(InputJoinWaitlist.fromFormData(data));
  } catch (error) {
    console.error('Error while inserting client on waitlist:', error);
    throw error;
  }
}