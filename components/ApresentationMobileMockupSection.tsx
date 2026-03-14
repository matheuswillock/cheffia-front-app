import Image from 'next/image';
import IphoneMockup from '../public/assets/Icons/iPhone-16-Pro.svg';

export default function ApresentationMobileMockup() {
  return (
    <section className="flex flex-col gap-9 sm:gap-6 md:gap-2 xl:gap-0 w-full h-full my-24 mx-auto sm:max-w-[620px] md:max-w-3xl lg:max-w-4xl">
      <div className="flex flex-col gap-6 ml-10">
        <div
          className="
            max-w-32
            md:max-w-40
            h-7
            md:h-10
            font-inter
            font-medium
            text-xs
            md:text-base
            leading-3
            flex
            items-center
            justify-start
            border-[1px]
            border-border-white
            rounded-full
            p-4
            bg-transparent
            shadow-md
          "
        >
          <p>Experiência única</p>
        </div>
        <p className="font-medium text-lg leading-4 text-foreground-card sm:w-44 ">
          A revolução na palma da sua mão.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-center w-full h-full">
          <div className="h-96 w-full md:w-[90%] absolute left-0 right-0 mx-auto -z-10">
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
            className="w-[250px] md:w-[280px] lg:w-[330px] h-[250px] sm:h-[280px] md:h-[320px] lg:h-[490px] sm:w-[250px] object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col justify-between items-center h-full">
        <p className="font-inter text-end font-light text-sm md:text-base leading-4 md:leading-4 text-foreground-card max-w-44 md:max-w-52 self-end mr-10">
          Explore o futuro da tecnologia. Experimente inovação, praticidade e
          eficiência em um só lugar.
        </p>
      </div>
    </section>
  );
}
