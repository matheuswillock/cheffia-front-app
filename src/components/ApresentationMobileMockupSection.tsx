import Image from 'next/image';
import IphoneMockup from '../../public/assets/Icons/iPhone-16-Pro.svg';

export default function ApresentationMobileMockup() {
  return (
    <section className="flex flex-col gap-9 w-full h-full mt-14 mb-16">
      <div className="flex flex-col gap-6 ml-10">
        <div className="w-32 h-7 font-inter font-medium text-xs leading-3 flex items-center justify-start border-[1px] border-border-white rounded-full p-4 bg-transparent shadow-md">
          <p>Experiência única</p>
        </div>
        <p className="font-medium text-lg leading-4 text-foreground-card">
          A revolução na palma da sua mão.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-center w-full h-full">
          <div className="h-96 w-full absolute left-0 right-0 mx-auto -z-10">
            <div
              className="
              h-full
              w-full
              rounded-full
              bg-neon-radial
              opacity-45
              blur-3xl
            "
            />
          </div>

          <Image
            src={IphoneMockup}
            alt="Mockup no Iphone 16 Pro"
            width={330}
            height={490}
            priority
            className="w-[250px] h-[250px]"
          />
        </div>
      </div>

      <div className="flex flex-col justify-between items-center h-full">
        <p className="font-inter text-end font-light text-sm leading-4 text-foreground-card w-44 h-14 self-end mr-10">
          Explore o futuro da tecnologia. Experimente inovação, praticidade e
          eficiência em um só lugar.
        </p>
      </div>
    </section>
  );
}