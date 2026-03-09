import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

interface SignUpFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  type: string;
  errorMessage?: string;
  blurEvent?: () => void;
  disabled?: boolean;
  changeEventType?: "document";
}

export default function SignUpFormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type,
  errorMessage,
  blurEvent,
  disabled,
  changeEventType,
}: SignUpFormFieldProps<T>) {
  const changeEvent = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: { onChange: (value: string) => void }
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let maskedValue = value;

    if (changeEventType === "document") {
      maskedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    field.onChange(maskedValue);
    e.target.value = maskedValue;
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={`text-sm font-medium ${
              control._formState.errors[name] && "text-red-500"
            }`}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              className={`w-full font-medium transition-all duration-800 rounded-xl ${
                control._formState.errors[name] && "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
              }`}
              placeholder={placeholder}
              disabled={disabled}
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
          <FormMessage className=" text-red-500">
            {errorMessage}
          </FormMessage>
        </FormItem>
      )}
    />
  );
}
