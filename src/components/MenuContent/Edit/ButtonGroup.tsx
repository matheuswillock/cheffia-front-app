import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ButtonGroupProps {
  menuItemId: string;
  handleDeleteButton: (menuItemId: string) => void;
}

export default function ButtonGroup({ menuItemId, handleDeleteButton } : ButtonGroupProps) {
  return (
    <div className="flex flex-row-reverse gap-2 sm:flex-col-reverse self-start sm:self-end">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="rounded-full px-4 h-9 w-20 md:w-24 bg-systemColor-red hover:bg-systemColor-red/60 text-foreground-default font-semibold text-base">
            Deletar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-background-cardFeature border-background-gray xl:max-w-[620px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl xl:text-2xl text-foreground-default font-semibold font-inter">
              Deseja realmente deletar este item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base xl:text-lg text-foreground-card font-inter font-normal">
              Você tem certeza que deseja deletar este item do seu cardápio?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-red-500 hover:bg-red-500/60 text-foreground-pureWhite font-medium font-inter text-base xl:text-lg"
              onClick={() => handleDeleteButton(menuItemId)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-transparent hover:bg-background-gray border border-background-gray text-foreground-pureWhite text-base xl:text-lg font-medium font-inter">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button className="rounded-full px-4 h-9 w-20 md:w-24 bg-systemColor-default hover:bg-systemColor-default/60 text-foreground-black font-semibold text-base">
        Editar
      </Button>
    </div>
  );
}