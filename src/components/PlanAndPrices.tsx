import Image from "next/image";

interface PropsPlanAndprices {
  planTitle: string;
  price: string;
  description: string[];
  icon: string;
  isSelected: boolean;
}

export function PlanAndPrices({
  planTitle,
  price,
  description,
  isSelected,
  icon,
}: PropsPlanAndprices) {
    const titleColor = isSelected ? "" : "foreground";

    const priceColor = isSelected
      ? "text-5xl font-bold"
      : "text-3xl font-semibold font-semibold text-buttonPrimary";

    const cardClasses = `
      flex flex-col items-center justify-center gap-2 
      rounded-xl p-4 text-center border-4
      transition-all duration-300 ease-in-out 
      hover:scale-110 hover:shadow-lg 
    ${
      isSelected
        ? "bg-card-selected text-background border-card-border "
        : "bg-card border-muted text-card-foreground"
    }
  `;

  return (
    <button
      className={cardClasses}
      type="button"
      role="radio"
      aria-checked={isSelected}
    >
      <h3 className={`text-xl font-semibold ${titleColor}`}>{planTitle}</h3>

      <p className={` m-4 ${priceColor}`}>{price}</p>

      <div className="m-2" role="list">
        {description.map((item, index) => (
          <div key={index} className="flex items-center gap-2 mb-3">
            <Image
              src={icon}
              width={10}
              height={10}
              alt={item}
            />
            <div className="text-xl font-semibold">{item}</div>
          </div>
        ))}
      </div>
    </button>
  );
  
}
