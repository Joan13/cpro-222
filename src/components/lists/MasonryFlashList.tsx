import { FlashList, type FlashListProps } from '@shopify/flash-list';

/** FlashList v2 masonry layout component */
export function MasonryFlashList<T>(props: FlashListProps<T>) {
  return <FlashList masonry={true} optimizeItemArrangement={true} {...props} />;
}
