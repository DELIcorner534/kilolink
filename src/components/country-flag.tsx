import Image from "next/image";

type CountryFlagProps = {
  code: string;
  name: string;
  size?: number;
};

export function CountryFlag({ code, name, size = 18 }: CountryFlagProps) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={`Drapeau ${name}`}
      width={size}
      height={size}
      className="inline-block rounded-sm object-cover"
    />
  );
}
