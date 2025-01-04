import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <aside className="p-6">
      <nav className="flex justify-between items-center mt-12">
        <h1 className="text-5xl font-bold text-foreground">Cheffia</h1>
        <div className="flex items-center">
          <Button
            variant="link"
            className="mr-4 text-defaultDarkForeground hover:text-foreground text-1xl font-semibold"
          >
            <Link href="#">Recursos</Link>
          </Button>

          <Button
            variant="link"
            className="mr-4 text-defaultDarkForeground hover:text-foreground text-1xl font-semibold"
          >
            <Link href="#">Preços</Link>
          </Button>

          <Button
            variant="link"
            className="bg-defaultButtonBackgroung text-defaultButtonColor hover:bg-defaultButtonDarkBakground h-16 w-14 rounded-xl px-20 text-3xl font-semibold"
          >
            <Link href="#">Login</Link>
          </Button>
        </div>
      </nav>
    </aside>
  );
}