import { NewOrder } from "./NewOrder";

interface OrderListProps {
  messages: string[];
}

export default function OrderList({messages} : OrderListProps) {
  return (        
    <div className="overflow-y-auto max-h-[72vh] mx-3">
      <div className="flex flex-col gap-3 px-2 py-6">
        {messages !== null && messages.length >= 1 && (
          messages.map((message: string, index: number) => (
            index >= 1 && message !== "[]" && (
              <NewOrder key={index} message={`${message} + ${index}`} />
            )
          ))
        )}
      </div>
    </div>
  );
}