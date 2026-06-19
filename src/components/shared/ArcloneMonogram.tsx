export default function ArcloneMonogram({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 28 L16 4" stroke="#E8572A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 28 L16 4" stroke="#F2EDE4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 20 Q16 14.5 23.5 20" stroke="#E8572A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
