interface TypedArray extends ArrayLike<number>, Iterable<number> {
  readonly BYTES_PER_ELEMENT: number;
  readonly buffer: ArrayBuffer;
  readonly byteLength: number;
  readonly byteOffset: number;
  copyWithin(target: number, start: number, end?: number): this;
  every(callbackfn: (value: number, index: number, array: this) => boolean, thisArg?: any): boolean;
  fill(value: number, start?: number, end?: number): this;
  filter(callbackfn: (value: number, index: number, array: this) => any, thisArg?: any): TypedArray;
  find(predicate: (value: number, index: number, obj: Array<number>) => boolean, thisArg?: any): number | undefined;
  findIndex(predicate: (value: number, index: number, obj: Array<number>) => boolean, thisArg?: any): number;
  forEach(callbackfn: (value: number, index: number, array: this) => void, thisArg?: any): void;
  indexOf(searchElement: number, fromIndex?: number): number;
  join(separator?: string): string;
  lastIndexOf(searchElement: number, fromIndex?: number): number;
  readonly length: number;
  map(callbackfn: (value: number, index: number, array: this) => number, thisArg?: any): TypedArray;
  reduce(callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: this) => number, initialValue?: number): number;
  reduce<U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: this) => U, initialValue: U): U;
  reduceRight(callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: this) => number, initialValue?: number): number;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: this) => U, initialValue: U): U;
  reverse(): TypedArray;
  set(array: ArrayLike<number>, offset?: number): void;
  slice(start?: number, end?: number): TypedArray;
  some(callbackfn: (value: number, index: number, array: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: number, b: number) => number): this;
  subarray(begin: number, end?: number): TypedArray;
  toLocaleString(): string;
  toString(): string;
  [index: number]: number
}
interface TypedArrayConstructor {
  readonly prototype: TypedArray;
  new (length: number): TypedArray;
  new (array: ArrayLike<number>): TypedArray;
  new (buffer: ArrayBuffer, byteOffset?: number, length?: number): TypedArray;
  readonly BYTES_PER_ELEMENT: number;
  of(...items: number[]): TypedArray;
  from(arrayLike: ArrayLike<number>, mapfn?: (v: number, k: number) => number, thisArg?: any): TypedArray;
}
