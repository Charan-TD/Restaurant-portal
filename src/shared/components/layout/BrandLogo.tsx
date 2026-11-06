import Image from "next/image";

/** The TrainDhaba logo (the orange tile with the train), at a square size. */
export function BrandLogo({
  size,
  radius = Math.round(size * 0.22),
}: {
  size: number;
  radius?: number;
}) {
  return (
    <Image
      src="/logo.jpg"
      alt="TrainDhaba"
      width={size}
      height={size}
      priority
      style={{ display: "block", borderRadius: radius }}
    />
  );
}
