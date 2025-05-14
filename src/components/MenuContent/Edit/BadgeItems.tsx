import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeItemsProps {
  item: string;
  index: number;
  handleDelete: (index: number) => void;
}

export default function BadgeItems({item, index, handleDelete} : BadgeItemsProps) {
  return (
    <TooltipProvider>
      <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          key={index}
          variant="secondary"
          className="rounded-xl mb-2 text-base xl:text-lg font-medium font-inter text-foreground-default"
          onClick={() => handleDelete(index)}
        >
        {item}
        </Badge>
      </TooltipTrigger>
      <TooltipContent
        className="bg-red-500 font-inter text-sm md:text-base text-foreground-default font-normal md:font-medium rounded-xl p-2 "
      >
        Clique para deletar
      </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}