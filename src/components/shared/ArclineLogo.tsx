export default function ArclineLogo({
  size = "md",
  showRule = false,
}: {
  size?: "sm" | "md" | "lg";
  showRule?: boolean;
}) {
  const sizeMap = {
    sm: "text-[1.05rem]",
    md: "text-[1.4rem]",
    lg: "text-[2.4rem]",
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`font-logo italic font-bold tracking-tight ${sizeMap[size]}`}>
        <span className="text-accent">ARC</span>
        <span className="text-text1">LINE</span>
      </div>
      {showRule && <div className="w-[60%] h-[1px] bg-accent mt-1" />}
    </div>
  );
}
