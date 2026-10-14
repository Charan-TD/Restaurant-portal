// Indian food mark: a dot inside a square — green veg, amber egg, red non-veg.
export function FoodTypeMark({ type }: { type: string }) {
  return (
    <span
      className={`food-mark ${type.toLowerCase()}`}
      aria-label={type}
      title={type}
    />
  );
}
