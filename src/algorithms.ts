export function binarySearchLeast<T>(
  array: T[],
  predicate: (t: T) => Boolean,
  start: number = 0
): number {
  if (array.length === 0) {
    return -1;
  }
  let end = array.length - 1;
  while (end - start > 0) {
    const i = Math.floor((start + end) / 2);
    const elem = array[i];
    if (predicate(elem)) {
      end = i;
    } else {
      start = i + 1;
    }
  }
  if (predicate(array[start])) {
    return start;
  } else {
    return -1;
  }
}
