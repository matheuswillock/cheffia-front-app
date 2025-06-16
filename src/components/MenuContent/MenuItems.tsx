import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
// import { getMenuItemsByCategory } from "@/business/menu/menuBusiness"
import MenuItemModal from "./MenuItemModal"
// import { MenuItem } from "@/models/menuModels/mockedModels"
import PlaceHolder from "@/assets/placeholder.svg"
import { MenuItem } from "@/models/menuModels/MenuItem"

// export default async function MenuItems({ categoryId }: { categoryId: string }) {
//   const items = await getMenuItemsByCategory(categoryId)

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//       {items.map((item: MenuItem) => (
//         <MenuItemCard key={item.id} item={item} />
//       ))}
//     </div>
//   )
// }

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-48 sm:h-auto sm:w-1/3">
            <Image
              src={PlaceHolder}
              alt={item.name}
              // width={600}
              // height={400}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4 sm:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
            </div>
            <div className="mt-4 flex justify-between items-center">
              {/* <span className="text-xs text-gray-500">
                {item.dietary?.map((tag) => (
                  <span key={tag} className="mr-2 px-2 py-1 bg-gray-100 rounded-full">
                    {tag}
                  </span>
                ))}
              </span> */}
              <MenuItemModal item={item}>
                <Button size="sm" className="gap-1 rounded-xl">
                  <PlusCircle className="h-4 w-4" />
                  Add
                </Button>
              </MenuItemModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


