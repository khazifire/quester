interface CategoryDotProps {
  color: string;
  size?: number;
}

export function CategoryDot({ color, size = 7 }: CategoryDotProps) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}
