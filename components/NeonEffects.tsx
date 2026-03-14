export default function NeonEffects() {
  return (
    <>
      <div className="pointer-events-none overflow-hidden h-60 sm:h-72 xl:h-[330px] w-72 sm:w-80 xl:w-[602px] absolute top-24 sm:top-28 left-0 right-0 mx-auto z-0">
        <div className="h-[50%] w-full rounded-full bg-neon-radial opacity-45 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute top-24 sm:top-28 h-[211px] sm:h-[240px] xl:h-[337px] w-screen z-10">
        <div className="flex items-center justify-between w-full h-full px-4">
          <div className="h-full w-[30%] sm:w-[32%] md:w-[35%] xl:w-[38%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
          <div className="h-full w-[30%] sm:w-[32%] md:w-[35%] xl:w-[38%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
        </div>
      </div>
    </>
  );
};
