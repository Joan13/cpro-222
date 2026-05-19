/** Ensures FlashList v1-style `estimatedItemSize` is accepted by TypeScript for @shopify/flash-list v2. */
import '@shopify/flash-list';

declare module '@shopify/flash-list' {
  export interface FlashListProps<TItem> {
    estimatedItemSize?: number;
    inverted?: boolean;
  }
}

export {};
