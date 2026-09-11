import Realm from 'realm';

/**
 * Realm Sweeper: Automatically purges local Realm database objects (businesses, points of sale,
 * articles/items, sales, payments, expenses, reservations, inventory trackings) for any business
 * where the user is no longer an active member (user_active !== 1 or membership missing).
 */
export const sweepInactiveBusinessData = (realm: Realm, userPhoneNumber: string) => {
    try {
        if (!realm || realm.isClosed || !userPhoneNumber) return;

        const cleanPhone = userPhoneNumber.trim();
        if (!cleanPhone) return;

        const allBusinessUsers = realm.objects<any>('BusinessUsers');

        // 1. Identify active business IDs for this user (where user_active === 1)
        const activeBusinessIds = new Set<string>();
        const inactiveBusinessUsersToDelete: any[] = [];

        for (let i = 0; i < allBusinessUsers.length; i++) {
            const bu = allBusinessUsers[i];
            const matchUser =
                (bu.user && bu.user.trim() === cleanPhone) ||
                (bu.phone_number && bu.phone_number.trim() === cleanPhone);

            if (matchUser) {
                if (bu.user_active === 1) {
                    activeBusinessIds.add(bu.business_id);
                } else {
                    inactiveBusinessUsersToDelete.push(bu);
                }
            }
        }

        // 2. Identify businesses stored locally in 'Businesses' table
        const allBusinesses = realm.objects<any>('Businesses');
        const businessesToDelete: any[] = [];
        const inactiveBusinessIdsToDelete = new Set<string>();

        for (let i = 0; i < allBusinesses.length; i++) {
            const biz = allBusinesses[i];
            const bizId = biz._id;

            if (!activeBusinessIds.has(bizId)) {
                businessesToDelete.push(biz);
                inactiveBusinessIdsToDelete.add(bizId);
            }
        }

        for (const bu of inactiveBusinessUsersToDelete) {
            if (!activeBusinessIds.has(bu.business_id)) {
                inactiveBusinessIdsToDelete.add(bu.business_id);
            }
        }

        if (inactiveBusinessIdsToDelete.size === 0 && inactiveBusinessUsersToDelete.length === 0) {
            return;
        }

        // 3. Collect all related cascading child objects for inactive business IDs
        const sellsPointsToDelete: any[] = [];
        const articlesToDelete: any[] = [];
        const salesToDelete: any[] = [];
        const expensesToDelete: any[] = [];
        const reservationsToDelete: any[] = [];
        const trackingToDelete: any[] = [];

        if (inactiveBusinessIdsToDelete.size > 0) {
            // SellsPoints
            try {
                const allSP = realm.objects<any>('SellsPoints');
                for (let i = 0; i < allSP.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allSP[i].business_id)) {
                        sellsPointsToDelete.push(allSP[i]);
                    }
                }
            } catch (e) { }

            // UserBusinessArticles
            try {
                const allArticles = realm.objects<any>('UserBusinessArticles');
                for (let i = 0; i < allArticles.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allArticles[i].business_id)) {
                        articlesToDelete.push(allArticles[i]);
                    }
                }
            } catch (e) { }

            // BusinessItemsSale
            try {
                const allSales = realm.objects<any>('BusinessItemsSale');
                for (let i = 0; i < allSales.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allSales[i].business_id)) {
                        salesToDelete.push(allSales[i]);
                    }
                }
            } catch (e) { }

            // Expenses
            try {
                const allExpenses = realm.objects<any>('Expenses');
                for (let i = 0; i < allExpenses.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allExpenses[i].business_id)) {
                        expensesToDelete.push(allExpenses[i]);
                    }
                }
            } catch (e) { }

            // Reservations
            try {
                const allReservations = realm.objects<any>('Reservations');
                for (let i = 0; i < allReservations.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allReservations[i].business_id)) {
                        reservationsToDelete.push(allReservations[i]);
                    }
                }
            } catch (e) { }

            // InventoryMovementTracking
            try {
                const allTracking = realm.objects<any>('InventoryMovementTracking');
                for (let i = 0; i < allTracking.length; i++) {
                    if (inactiveBusinessIdsToDelete.has(allTracking[i].business_id)) {
                        trackingToDelete.push(allTracking[i]);
                    }
                }
            } catch (e) { }
        }

        // 4. Perform atomic deletion in Realm write transaction
        realm.write(() => {
            if (inactiveBusinessUsersToDelete.length > 0) {
                realm.delete(inactiveBusinessUsersToDelete);
            }
            if (businessesToDelete.length > 0) {
                realm.delete(businessesToDelete);
            }
            if (sellsPointsToDelete.length > 0) {
                realm.delete(sellsPointsToDelete);
            }
            if (articlesToDelete.length > 0) {
                realm.delete(articlesToDelete);
            }
            if (salesToDelete.length > 0) {
                realm.delete(salesToDelete);
            }
            if (expensesToDelete.length > 0) {
                realm.delete(expensesToDelete);
            }
            if (reservationsToDelete.length > 0) {
                realm.delete(reservationsToDelete);
            }
            if (trackingToDelete.length > 0) {
                realm.delete(trackingToDelete);
            }
        });

        console.log(`[REALM SWEEPER] Purged ${inactiveBusinessIdsToDelete.size} inactive business(es) and cascading child data from local database.`);
    } catch (error) {
        console.error('[REALM SWEEPER] Error during business data sweeping:', error);
    }
};
