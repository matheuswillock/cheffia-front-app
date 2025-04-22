export default function NeonEffects() {
  return (
    <>
      <div className="h-60 w-72 absolute left-0 right-0 mx-auto -z-10">
        <div className="h-[50%] w-full rounded-full bg-neon-radial opacity-45 blur-3xl" />
      </div>

      <div className="absolute h-[170px] w-full z-10">
        <div className="flex items-center justify-between w-full h-full px-4">
          <div className="h-[170px] w-[30%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
          <div className="h-[170px] w-[30%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
        </div>
      </div>
    </>
  );
};