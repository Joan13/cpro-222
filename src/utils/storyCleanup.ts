import Realm from 'realm';

export const isStoryExpired = (story: any): boolean => {
    if (!story) return true;
    if (story.story_active === 0) return true;

    const nowMs = Date.now();

    if (story.expiresAt) {
        const expMs = new Date(story.expiresAt).getTime();
        if (!isNaN(expMs) && expMs <= nowMs) {
            return true;
        }
    }

    if (story.createdAt) {
        const createdMs = new Date(story.createdAt).getTime();
        if (!isNaN(createdMs) && (nowMs - createdMs >= 24 * 60 * 60 * 1000)) {
            return true;
        }
    }

    return false;
};

export const cleanExpiredLocalStories = (realmInstance: Realm) => {
    try {
        if (!realmInstance || realmInstance.isClosed) return;

        const allStories = realmInstance.objects('Stories');
        const toDelete: any[] = [];

        for (let i = 0; i < allStories.length; i++) {
            const story = allStories[i];
            if (isStoryExpired(story)) {
                toDelete.push(story);
            }
        }

        if (toDelete.length > 0) {
            realmInstance.write(() => {
                realmInstance.delete(toDelete);
            });
            console.log(`[REALM CLEANUP] Automatically deleted ${toDelete.length} expired story records from local database.`);
        }
    } catch (e) {
        console.error('[REALM CLEANUP] Error during local story cleanup:', e);
    }
};
