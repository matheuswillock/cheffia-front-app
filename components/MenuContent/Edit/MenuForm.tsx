import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRef, useState } from "react";
import { AddMenuItemData } from "@/types/formTypes";
import { FaEdit, FaPlus } from "react-icons/fa";
import BadgeItems from "./BadgeItems";
import { addMenuItem } from "@/api/menuClient";
import { Output } from "@/models/Output";
import LoadingSpin from "@/assets/loading-spin.svg";
import Image from "next/image";
import { UseAddMenuItemForm } from "@/hooks/UseForms";
import { Input } from "@/components/ui/input";
import InputPrice from "./InputPrice";
import { Button } from "@/components/ui/button";

interface MenuFormProps {
  restaurantId: string;
  reloadMenuItemsList: (success: boolean) => void;
}

export default function MenuForm({ restaurantId, reloadMenuItemsList} : MenuFormProps) {
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>("");
  const [loadingButton, setLoadingButton] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = UseAddMenuItemForm({ restaurantId });

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
      setLoadingButton(true);
      const result: Output = await addMenuItem(data);

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}> 
        <div className="flex flex-col gap-4">

          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel htmlFor="name" className={`pl-2 ${
                    form.formState.errors.name && "text-red-500"
                  }`}>
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
                      onBlur={async() => {
                        await form.trigger("name")                                    
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
                  <FormLabel htmlFor="price" className={`pl-2 ${
                    form.formState.errors.price && "text-red-500"
                  }`}>
                    Preço
                  </FormLabel>
                  <FormControl>
                    <InputPrice 
                      onChange={(value) => {
                        const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
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
                    className={`pl-2  ${
                      form.formState.errors.itemMedia && "text-red-500"
                    }`}
                  >
                    Imagem
                  </FormLabel>
                  <FormControl>
                    <Input 
                      id="itemMedia" 
                      type="file" 
                      className="rounded-xl" 
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
                    className={`pl-2 ${
                      form.formState.errors.ingredients && "text-red-500"
                    }`}
                  >  
                    Ingredientes
                  </FormLabel>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2 flex-col gap-4">
                      <div className="grid grid-cols-3 gap-3 w-full">
                        <div className=" col-span-2 flex flex-col gap-2 w-full">
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
                          onBlur={async () => await form.trigger("ingredients")}
                          />
                        </div>
                
                        <div className="col-span-1 w-full flex items-end">
                          <Button 
                            className="rounded-xl bg-button text-foreground-default hover:text-background font-semibold text-base w-full h-12"
                            onClick={handleAddItem}
                          >
                            <FaPlus /> Add Item
                          </Button>
                        </div>                        
                      </div>
                      
                      <div className="flex flex-wrap gap-2 w-full overflow-auto">
                        {items.map((item, index) => (
                          <BadgeItems
                            key={index}
                            item={item}
                            index={index}
                            handleDelete={(index: number) => {
                              const newItems = items.filter((_, i) => i !== index);
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
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel 
                    htmlFor="description" 
                    className={`pl-2  ${
                      form.formState.errors.description && "text-red-500"
                    }`}
                  >
                    Descrição
                  </FormLabel>
                  <FormControl className="flex flex-col">
                    <Textarea 
                      {...field}
                      placeholder="Insira uma breve descrição." 
                      className="rounded-xl"
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={async () => {
                          await form.trigger("description")
                        }
                      }
                    />
                  </FormControl>
                  <FormMessage className="pl-2 text-base text-red-500">
                    {form.formState.errors.description?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
              
          </div>

          <div className="flex justify-end w-full">
            <Button 
              className="rounded-xl bg-button text-foreground-default hover:text-background font-semibold text-base w-full h-14"
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
                <>
                  <FaEdit /> Add Menu Item
                </>
              )}

            </Button>
          </div>

        </div>
      </form>
    </Form>
  );
}
