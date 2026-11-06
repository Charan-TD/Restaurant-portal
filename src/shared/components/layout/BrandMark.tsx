/** The TrainDhaba pin with a train in it, white on the brand orange. */
export function BrandMark({ width = 24 }: { width?: number }) {
  return (
    <svg
      aria-hidden
      width={width}
      height={Math.round((width * 44) / 40)}
      viewBox="0 0 40 44"
    >
      <path
        d="M20 2C10.6 2 3 9.4 3 18.6c0 7.2 4.6 13.4 11.1 15.7L20 42l5.9-7.7C32.4 32 37 25.8 37 18.6 37 9.4 29.4 2 20 2Z"
        fill="#fff"
      />
      <rect x="12" y="9" width="16" height="17" rx="4" fill="#ee5b00" />
      <rect x="14.5" y="11.5" width="11" height="6" rx="1.5" fill="#fff" />
      <circle cx="16" cy="22" r="1.6" fill="#fff" />
      <circle cx="24" cy="22" r="1.6" fill="#fff" />
      <path d="M15 28.5h10" stroke="#ee5b00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
