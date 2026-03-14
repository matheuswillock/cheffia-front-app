import { insertClientOnWaitlist, SendAskToCheffia } from "@/api/cheffiaDiscord";
import { InputAskCheffia } from "@/models/dtos/input/InputAskCheffia";
import { InputJoinWaitlist } from "@/models/dtos/input/InputJoinWaitlist";
import type { Output } from "@/models/Output";
import type { AskAQuestionData, JoinWaitlistData } from "@/types/formTypes";

export const sendAskToCheffia = async (data: AskAQuestionData): Promise<Output> => {
  return SendAskToCheffia(InputAskCheffia.fromFormData(data));
};

export const joinCheffiaWaitlist = async (data: JoinWaitlistData): Promise<Output> => {
  return insertClientOnWaitlist(InputJoinWaitlist.fromFormData(data));
};
