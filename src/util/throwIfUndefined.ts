export default function throwIfUndefined<T>(e: T | undefined): NonNullable<T> {
  if (typeof e === 'undefined') throw new Error('Value cannot be undefined');
  // @ts-ignore-error i really do not care
  return e;
}
