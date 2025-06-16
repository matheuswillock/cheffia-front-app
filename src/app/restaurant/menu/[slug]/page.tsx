import MenuCategories from "@/components/MenuContent/MenuCategories"
import OrderCart from "@/components/MenuContent/OrderCart"
import OrderStatus from "@/components/MenuContent/OrderStatus"
import { Suspense } from "react"
import MenuHeader from "./container/MenuHeader"
import { MenuSkeleton } from "./container/MenuSkeleton"

// TODO: Implementar o validate Slug para que se o slug for inválido, redirecione para a página de erro 404
export default function MenuPage() {
  return (
    <div className="min-h-screen ">
      <MenuHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section - Takes 2/3 of the screen on large devices */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold">Restaurant Menu</h1>
            <Suspense fallback={<MenuSkeleton />}>
              {/* <MenuCategories /> */}
            </Suspense>
          </div>

          {/* Order Section - Takes 1/3 of the screen on large devices */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-4">
              {/* <OrderCart />
              <OrderStatus /> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

