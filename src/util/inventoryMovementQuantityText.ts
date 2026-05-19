import { strings } from "../lang/lang";

/**
 * Expresses movement quantity in retail units using wholesale lots when
 * `wholesale_content_number` (items per wholesale unit) is at least 2.
 */
export function formatInventoryMovementQuantityText(
    quantityRetail: number | null | undefined,
    wholesaleContentNumber: number | null | undefined
): string {
    if (quantityRetail == null || Number.isNaN(Number(quantityRetail))) {
        return "—";
    }

    const q = Math.max(0, Math.floor(Number(quantityRetail)));
    if (q <= 0) {
        return "—";
    }

    const wRaw = wholesaleContentNumber != null ? Number(wholesaleContentNumber) : 1;
    const w = Number.isFinite(wRaw) && wRaw >= 2 ? Math.floor(wRaw) : 0;

    if (w < 2) {
        return strings.inventory_movement_qty_retail_units.replace("{count}", String(q));
    }

    const lots = Math.floor(q / w);
    const rem = q % w;

    if (lots === 0) {
        return strings.inventory_movement_qty_individual_only.replace("{count}", String(rem));
    }

    if (rem === 0) {
        if (lots === 1) {
            return strings.inventory_movement_qty_one_wholesale_lot.replace("{lot_items}", String(w));
        }
        return strings.inventory_movement_qty_wholesale_lots_only
            .replace("{lot_count}", String(lots))
            .replace("{total_items}", String(q));
    }

    const bulkItems = lots * w;
    if (lots === 1) {
        return strings.inventory_movement_qty_mixed_single_lot
            .replace("{lot_items}", String(w))
            .replace("{remainder}", String(rem));
    }
    return strings.inventory_movement_qty_mixed_multi_lot
        .replace("{lot_count}", String(lots))
        .replace("{bulk_items}", String(bulkItems))
        .replace("{remainder}", String(rem));
}
