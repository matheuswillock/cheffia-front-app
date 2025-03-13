interface NewOrderProps {
  message: string;
}

export function NewOrder ({message}: NewOrderProps) {
  return (
    <div className="border-2 bg-gray-700 border-muted-foreground/40 p-2 rounded-xl min-h-full max-h-full overflow-y-auto cursor-pointer">
      <p className="text-lg text-muted-foreground/80">Pedido n 1</p>
      <p className="text-lg text-muted-foreground/80">mesa 23</p>
      <p>{ message }</p>
      <p className="text-lg text-muted-foreground/80">R$ 23,00</p>
    </div>
  );
}