import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MenuHeader() {
  return (
    <header className="shadow-sm sticky top-0 z-10 bg-background">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">FoodOrderPro</h1>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input type="search" placeholder="Search menu items..." className="pl-10 w-full rounded-xl border-muted-foreground transition-all duration-800" />
        </div>
      </div>
    </header>
  )
}

