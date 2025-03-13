import { getMenuCategories } from "@/services/restaurant/menu/menuBusiness"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs"
import MenuItems from "./MenuItems"

export default async function MenuCategories() {
  //  TODO: Fetch categories from the API
  const categories = await getMenuCategories()
  const defaultCategory = categories[0]?.id || "appetizers"

  return (
    <Tabs defaultValue={defaultCategory} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto mb-6 bg-transparent">
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id} className="px-4 font-bold py-2 border-0 data-[state=active]:border data-[state=active]:bg-button-solid data-[state=active]:text-background data-[state=active]:shadow data-[state=active]:rounded-xl">
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="mt-0">
          <MenuItems categoryId={category.id} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

