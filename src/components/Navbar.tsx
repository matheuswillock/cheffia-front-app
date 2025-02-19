import Link from "next/link";
import { Button } from "@/components/ui/button";
import NavbarButton from "./NavbarButton";

export function Navbar() {
  return (
    <aside className="p-6">
      <nav className="flex justify-between items-center mt-12">
        <Link href={"/"}>
          <h1 className="text-3xl font-bold text-foreground">Cheffia</h1>
        </Link>

        <div className="flex items-center">
          <NavbarButton text={"Recursos"} href={"#"} />
          <NavbarButton text={"Preços"} href={"#"} />

          <Button 
            className="bg-button text-foreground hover:bg-button-solid hover:text-background h-12 w-2 rounded-xl px-20 text-xl font-bold"
          >
            <Link href="/sign-in">Login</Link>
          </Button>
        </div>
      </nav>
    </aside>
  );
}