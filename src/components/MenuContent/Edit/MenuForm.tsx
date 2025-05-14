import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useRef, useState } from "react";
import { AddMenuItemData } from "@/types/formTypes";
import { FaPlus } from "react-icons/fa";
import BadgeItems from "./BadgeItems";
import { handleAddMenuItem } from "@/business/menu/menuBusiness";
import { Output } from "@/models/Output";
import LoadingSpin from "@/assets/loading-spin.svg";
import Image from "next/image";
import { UseAddMenuItemForm } from "@/hooks/UseForms";
import { Input } from "@/components/ui/input";
import InputPrice from "./InputPrice";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/models/menuModels/Category";

interface MenuFormProps {
  restaurantId: string;
  reloadMenuItemsList: (success: boolean) => void;
  menuCategories: Category[];
}

export default function MenuForm({ restaurantId, reloadMenuItemsList, menuCategories} : MenuFormProps) {
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>("");
  const [loadingButton, setLoadingButton] = useState<boolean>(false);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = UseAddMenuItemForm({ restaurantId });

  useEffect(() => {
    const categoryNames = menuCategories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {} as Record<string, string>);
    setCategories(categoryNames);
  }, []);

  const handleAddItem = () => {
    if (currentItem.trim() !== "") {
      setItems([...items, currentItem]);
      setCurrentItem("");
    }
  };

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      ingredients: [],
      itemMedia: undefined,
      restaurantId: restaurantId
    });
    setItems([]);
    setCurrentItem("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: AddMenuItemData) => {
    try {
      console.log("onSubmit - Form data:", data);
      setLoadingButton(true);
      const result: Output = await handleAddMenuItem(data);

      if (result.isValid) {
        resetForm();
        reloadMenuItemsList(true);
      } else {
        console.error('Error adding menu item', result.errorMessages);
        reloadMenuItemsList(false);
      }

      setLoadingButton(false);

    } catch (error) {
      console.error('Error adding menu item', error);
    }
  };

  return (
    <SheetContent className="flex flex-col py-10 gap-4 sm:min-w-[420px] lg:max-w-[500px] bg-background-cardFeature">
      <SheetHeader>
        <SheetTitle className="text-start text-base sm:text-xl lg:text-2xl font-semibold sm:font-medium ">
          Cadastrar novo item
        </SheetTitle>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor="name"
                      className={`pl-2 text-sm md:text-base lg:text-lg font-inter ${
                        form.formState.errors.name && "text-red-500"
                      }`}
                    >
                      Nome do item
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Pizza de marguerita"
                        className={`rounded-xl h-12 ${
                          form.formState.errors.name
                            ? "border-red-600"
                            : "border-zinc-800"
                        }`}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={async () => {
                          await form.trigger("name");
                        }}
                      />
                    </FormControl>
                    <FormMessage className="pl-2 text-base text-red-500">
                      {form.formState.errors.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor="price"
                      className={`pl-2 text-sm md:text-base lg:text-lg font-inter${
                        form.formState.errors.price && "text-red-500"
                      }`}
                    >
                      Preço
                    </FormLabel>
                    <FormControl>
                      <InputPrice
                        onChange={(value) => {
                          const numericValue = value
                            .replace(/[^\d,]/g, "")
                            .replace(",", ".");
                          field.onChange(parseFloat(numericValue));
                        }}
                        controlProps={field}
                        handleBlur={async () => await form.trigger("price")}
                      />
                    </FormControl>
                    <FormMessage className="pl-2 text-base text-red-500">
                      {form.formState.errors.price?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemMedia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor="itemMedia"
                      className={`pl-2 text-sm md:text-base lg:text-lg font-inter${
                        form.formState.errors.itemMedia && "text-red-500"
                      }`}
                    >
                      Imagem
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="itemMedia"
                        type="file"
                        className="
                          rounded-xl
                          h-12
                          flex
                          items-center
                          justify-center
                          text-center
                          file:py-2
                          file:text-sm
                          file:font-semibold
                          file:font-inter
                        "
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          field.onChange(file);
                        }}
                        onBlur={() => form.trigger("itemMedia")}
                        ref={fileInputRef}
                      />
                    </FormControl>
                    <FormMessage className="pl-2 text-base text-red-500">
                      {form.formState.errors.itemMedia?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor="ingredients"
                      className={`pl-2 text-sm md:text-base lg:text-lg font-inter ${
                        form.formState.errors.ingredients && "text-red-500"
                      }`}
                    >
                      Ingredientes
                    </FormLabel>

                    <FormControl>
                      <div className="flex w-full items-center flex-col">
                        <div className="flex flex-row gap-2 w-full">
                          <div className="col-span-2 flex flex-col gap-2 w-full">
                            <Input
                              {...field}
                              type="text"
                              placeholder="Insira os Ingredientes"
                              className="rounded-xl h-12"
                              value={currentItem}
                              onChange={(e) => {
                                field.onChange([...items, e.target.value]);
                                setCurrentItem(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddItem();
                                }
                              }}
                              onBlur={async () =>
                                await form.trigger("ingredients")
                              }
                            />
                          </div>

                          <Button
                            className="rounded-xl bg-button text-foreground-black hover:text-background md:font-semibold text-xs md:text-base w-11 h-12 sm:h-10 sm:w-10 md:w-11 md:h-11 lg:w-12 lg:h-12"
                            type="button"
                            onClick={handleAddItem}
                          >
                            <FaPlus />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 w-full overflow-auto">
                          {items.map((item, index) => (
                            <BadgeItems
                              key={index}
                              item={item}
                              index={index}
                              handleDelete={(index: number) => {
                                const newItems = items.filter(
                                  (_, i) => i !== index
                                );
                                setItems(newItems);
                                field.onChange(newItems);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="pl-2 text-base text-red-500">
                      {form.formState.errors.ingredients?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categories).map(([id, name]: [string, string]) => (
                            <SelectItem key={id} value={id}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.category?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor="description"
                      className={`pl-2 text-sm md:text-base lg:text-lg font-inter ${
                        form.formState.errors.description && "text-red-500"
                      }`}
                    >
                      Descrição
                    </FormLabel>
                    <FormControl className="flex flex-col">
                      <Textarea
                        {...field}
                        placeholder="Insira uma breve descrição."
                        className="rounded-xl font-inter md:text-base lg:text-lg"
                        rows={4}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={async () => {
                          await form.trigger("description");
                        }}
                      />
                    </FormControl>
                    <FormMessage className="pl-2 text-base text-red-500">
                      {form.formState.errors.description?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <SheetClose asChild className="flex justify-end w-full">
                <Button
                  className="rounded-xl bg-button w-full h-10 md:h-12"
                  type="submit"
                  disabled={
                    !form.formState.isDirty ||
                    !form.formState.isValid ||
                    Object.keys(form.formState.errors).length > 0
                  }
                >
                  {loadingButton ? (
                    <Image
                      src={LoadingSpin}
                      alt="Loading"
                      className="h-12 w-12 animate-spin"
                    />
                  ) : (
                    <div className="flex text-foreground-black font-semibold text-base md:text-lg lg:text-xl items-center justify-center gap-2 text-center w-full">
                      Salvar item
                    </div>
                  )}
                </Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}