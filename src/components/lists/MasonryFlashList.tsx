import { FlashList, type FlashListProps } from '@shopify/flash-list';

/** FlashList v2 removed MasonryFlashList; this keeps marketplace grids building. */
export function MasonryFlashList<T>(props: FlashListProps<T>) {
  return <FlashList {...props} />;
}
