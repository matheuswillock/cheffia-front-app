import Link from "next/link";
import { Button } from "./ui/button";
interface NavbarButtonprops {
  text: string;
  href: string;
}

export default function NavbarButton({ text, href }: NavbarButtonprops) {
  return (
    <Button
      variant="link"
      className="mr-4 text-muted-foreground hover:text-primary text-xl font-semibold"
    >
      <Link href={href}>{text}</Link>
    </Button>
  );
}