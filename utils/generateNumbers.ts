// utils/generateNumbers.ts
export function generateNumberPairs(size: number) {
  const total = size * size;

  // Step 1: create [1..total] and shuffle it
  const initial = Array.from({ length: total }, (_, i) => i + 1);
  const shuffled = initial.sort(() => Math.random() - 0.5);

  // Step 2: generate [total+1 .. total*2]
  const next = Array.from({ length: total }, (_, i) => total + i + 1);

  return { initial: shuffled, next }; // both are ordered arrays
}
