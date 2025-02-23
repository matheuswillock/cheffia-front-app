import Image from "next/image";

interface PropsApresentationItem {
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
      <h3 className="text-3xl font-semibold text-foreground mb-4">
        {ItemTitle}
      </h3>
      <Image 
        src={imagePath} 
        width={60} 
        height={60} 
        alt={ItemTitle} 
      />
      <p className="text-muted-foreground text-xl">
        {ItemDescription}
      </p>
    </div>
  );
}