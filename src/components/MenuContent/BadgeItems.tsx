import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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
          className="rounded-xl mb-2 text-base font-medium text-foreground"
          onClick={() => handleDelete(index)}  
        >
        {item}
        </Badge>
      </TooltipTrigger>
      <TooltipContent 
        className="bg-red-500 bg-opacity-80 text-foreground font-base text-xs rounded-xl p-2"        
      >
        Clique para deletar
      </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}