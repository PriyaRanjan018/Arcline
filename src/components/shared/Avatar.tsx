import { cn } from "@/lib/utils";

interface AvatarProps {
  initials?: string;
  src?: string;
  bgColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ initials, src, bgColor = "bg-accent", size = "md", className }: AvatarProps) {
  const sizeMap = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-16 h-16 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={cn(
          "rounded-[50%] object-cover",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-[50%] flex items-center justify-center font-mono font-medium text-white",
        bgColor,
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
