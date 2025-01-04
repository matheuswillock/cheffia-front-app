import Image from "next/image";

interface PropsApresentationItem {
  id?: string | number;
  ItemTitle: string;
  ItemDescription: string;
  imagePath: string;
}

export function ApresentationItem({
  ItemDescription,
  ItemTitle,
  imagePath,
}: PropsApresentationItem) {
  return (
    <div className="feature-card text-center flex flex-col items-center justify-center gap-10">
      <h3 className="text-1xl font-semibold text-defaultForeground mb-4">
        {ItemTitle}
      </h3>
      <Image src={imagePath} width={80} height={80} alt={ItemTitle} />
      <p className="text-defaultDarkForeground">{ItemDescription}</p>
    </div>
  );
}
