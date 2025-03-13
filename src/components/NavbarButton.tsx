import Link from "next/link";
import { Button } from "./ui/button";
interface NavbarButtonprops {
  text: string;
  href: string;
}

export default function NavbarButton({ text, href }: NavbarButtonprops) {
  return (
    <Link href={href}>
      <Button
        variant="link"
        className="mr-4 text-muted-foreground hover:text-primary text-xl font-semibold"
      >
        {text}
      </Button>
    </Link>
  );
}