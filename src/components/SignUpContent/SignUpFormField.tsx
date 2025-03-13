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
}

export default function SignUpFormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type,
  errorMessage,
  blurEvent,
}: SignUpFormFieldProps<T>) {
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
              onBlur={blurEvent}
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