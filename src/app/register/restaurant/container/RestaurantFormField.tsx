import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control, FieldValues, Path } from "react-hook-form";

interface RestaurantFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  type: string;
  errorMessage?: string;
  blurEvent?: () => void;
  changeEventType?: "phone" | "document";
}

export default function RestaurantFormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type,
  errorMessage,
  blurEvent,
  changeEventType,
}: RestaurantFormFieldProps<T>) {

  const changeEvent = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: { onChange: (value: string) => void }
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let maskedValue = value;

    if (changeEventType === "phone") {
      maskedValue =
        value.length <= 10
          ? value.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3")
          : value.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
    } else if (changeEventType === "document") {
      if (value.length <= 11) {
        maskedValue = value.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          "$1.$2.$3-$4"
        );
      } else {
        maskedValue = value.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5"
        );
      }
    }

    field.onChange(maskedValue);
    e.target.value = maskedValue;
  }
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col w-full items-start">
          <FormLabel
            className={`text-sm font-medium ml-2 ${
              control._formState.errors[name] && "text-red-500"
            }`}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              className={`border-[1.5px] ${
                control._formState.errors[name]
                  ? "border-red-500"
                  : "border-zinc-800"
              } h-14 w-full text-sm font-base transition-all duration-800 rounded-xl`}
              placeholder={placeholder}
              onBlur={blurEvent}
              onChange={(e) => {
                if (changeEventType) {
                  changeEvent(e, field);
                } else {
                  field.onChange(e.target.value);
                }
              }}
            />
          </FormControl>
          <FormMessage className="ml-2 text-sm text-red-500">
            {errorMessage}
          </FormMessage>
        </FormItem>
      )}
    />
  );
}