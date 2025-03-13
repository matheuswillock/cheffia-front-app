export default function MoreDetails() {
  return (
    <div className="border-2 bg-gray-700 border-muted-foreground/40 rounded-xl ml-4 min-h-[90%] max-h-[90%] max-w-[96%] overflow-y-auto flex flex-col gap-3 px-4 py-6 justify-between">
      
      <div className="flex flex-col gap-8">

        <div className="flex flex-row justify-between">
          <h2 className="text-5xl text-foreground">mesa 23</h2>
          <h1 className="text-4xl text-muted-foreground">Pedido n 1</h1>
        </div>

        {/* TODO: Externalizar este componente */}
        <div className="flex flex-row justify-between items-center border-b-2 border-muted-foreground/40 pb-4">
          <div className="flex flex-col gap-4 items-start">
            <p className="text-xl text-muted-foreground/80">1x Coca-cola</p>  
            <p className="text-2xl text-muted-foreground">SEM GELO</p>
          </div>

          <div className="flex flex-col gap-4 items-end">
            <p className="text-3xl text-muted-foreground">R$ 5,00</p>
            <button className="bg-primary-foreground text-foreground rounded-xl px-4 py-2">
              Imprimir
            </button>
            <button className="bg-red-500 text-foreground rounded-xl px-4 py-2">
              Cancelar item
            </button>
          </div>
          
        </div>

      </div>

      <div className="flex flex-row justify-between ">

        <p className="text-3xl text-muted-foreground/80">TOTAL: R$ 5,00</p>      

        <div className="flex gap-4">
          <button className="bg-primary-foreground text-foreground rounded-xl px-4 py-2">
            Fechar conta
          </button>
        </div>
        
      </div>

    </div>

    
  );
}