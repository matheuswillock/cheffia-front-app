export type Pedido = {
  id: string;
  numero: number;
  mesa: string;
  itens: string[];
  status: "recebido" | "preparo" | "pronto";
  horario: string;
};