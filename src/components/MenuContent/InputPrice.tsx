import { Input } from "../ui/input";
import { useState } from "react";
import { Label } from "../ui/label";

export default function InputPrice() {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    inputValue = inputValue.replace(/[^0-9.,]/g, ""); // Remove caracteres não numéricos, exceto ponto e vírgula
    inputValue = inputValue.replace(/\./g, ","); // Troca ponto por vírgula

    const parts = inputValue.split(",");
    if (parts.length > 2) {
      inputValue = parts[0] + "," + parts[1].slice(0, 2); // Limita a dois números após a vírgula
    } else if (parts.length === 2) {
      parts[1] = parts[1].slice(0, 2); // Limita a dois números após a vírgula
      inputValue = parts.join(",");
    }

    setValue(`R$ ${inputValue}`);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label htmlFor="price" className="pl-2">Preço</Label>
      <Input
        type="text"
        placeholder="R$ 10,00"
        className="rounded-xl col-span-2 h-12"
        value={value}
        onChange={handleChange}
      />
    </div>

  );
}