import RestaurantForm from "@/components/RestaurantForm";


export default function RestaurantPage() {
  return (
    <div className="max-w-[810px] my-32 mx-auto">
      <h2 className="scroll-m-20 border-b border-defaultDarkForeground text-defaultForeground pb-2 text-5xl font-semibold tracking-tight first:mt-0">
        Cadastre seu restaurante
      </h2>
      <RestaurantForm />
    </div>
  );
}
