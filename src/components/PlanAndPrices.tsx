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
    const titleColor = isSelected ? "" : "defaultForeground";

    const priceColor = isSelected
      ? ""
      : "text-3xl font-bold mb-6 text-buttonPrimary";

    const cardClasses = `
    flex flex-col items-center justify-center gap-2 
    border-2 rounded-xl p-6 text-center
    transition-all duration-300 ease-in-out 
    hover:scale-110 hover:shadow-lg
    ${
      isSelected
        ? "bg-defaultForeground text-defaultButtonColor border-defaultDarkForeground border-4"
        : "bg-cardBackground border-cardBorder text-defaultForeground"
    }
  `;

    return (
      <button
        className={cardClasses}
        type="button"
        role="radio"
        aria-checked={isSelected}
      >
        <h3 className={`text-2xl font-semibold ${titleColor}`}>{planTitle}</h3>

        <p className={`text-6xl font-bold m-8 ${priceColor}`}>{price}</p>

        <div className="m-4" role="list">
          {description.map((item) => (
            <div className="flex items-center gap-2 mb-3">
              <Image
                src={icon}
                width={10}
                height={10}
                alt={item}
              />
              <div className="text-2xl font-semibold">{item}</div>
            </div>
          ))}
        </div>
      </button>
    );
}
