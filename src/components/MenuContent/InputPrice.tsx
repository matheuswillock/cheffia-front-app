import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { AddMenuItemData } from "@/types/formTypes";

interface InputPriceProps {
  onChange: (value: string) => void;
  handleBlur: () => void;
  controlProps: ControllerRenderProps<AddMenuItemData, "price">
}

export default function InputPrice({onChange, controlProps, handleBlur} : InputPriceProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(controlProps.value ? `R$ ${controlProps.value.toString().replace('.', ',')}` : "");
  }, [controlProps.value]);

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
    onChange(inputValue);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Input
        {...controlProps}
        type="text"
        placeholder="R$ 10,00"
        className="rounded-xl col-span-2 h-12"
        value={value}
        onChange={handleChange}
        onBlur={() => {
          // setValue(`R$ ${value.replace("R$ ", "")}`);
          handleBlur();
        }}
      />
    </div>

  );
}