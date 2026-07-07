import { cn } from "@/lib/utils";

interface SparklineChartProps {
  data: readonly number[];
  color?: string;
  className?: string;
  height?: number;
  filled?: boolean;
  strokeWidth?: number;
}

export function SparklineChart({
  data,
  color = "var(--chart-2)",
  className,
  height = 40,
  filled = false,
  strokeWidth = 2.5,
}: SparklineChartProps) {
  if (data.length < 2) {
    return null;
  }

  const width = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      {filled && (
        <polygon points={areaPoints} fill={color} fillOpacity={0.18} />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
