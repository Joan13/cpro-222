/**
 * Story Utilities for status type determination and user custom styling extraction.
 */

export interface IStoryStyles {
    backgroundColor?: string;
    foregroundColor?: string;
    fontWeight?: 'normal' | 'bold' | '900';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'center' | 'left' | 'right';
}

/**
 * Determines whether a story object represents a photo status (1) or a text status (0).
 *
 * Rules:
 * Text status: type_status = 0 (or type_story / status_type = 0)
 * Photo status: status_type = 1 (or type_story / type_status = 1)
 */
export const isPhotoStory = (story: any): boolean => {
    if (!story) return false;

    // 1. Check explicit numerical/string status type flags if present
    const typeVal = story.type_status !== undefined && story.type_status !== null ? Number(story.type_status)
                  : story.status_type !== undefined && story.status_type !== null ? Number(story.status_type)
                  : story.type_story !== undefined && story.type_story !== null ? Number(story.type_story)
                  : null;

    if (typeVal === 1) return true;
    if (typeVal === 0) return false;

    // 2. Fallback heuristic for legacy data missing type flags:
    if (story.main_text && typeof story.main_text === 'string') {
        const text = story.main_text.trim();
        if (/\.(jpg|jpeg|png|webp|gif)$/i.test(text) || text.startsWith('http://') || text.startsWith('https://') || text.startsWith('file:/')) {
            return true;
        }
    }

    return false;
};

/**
 * Safely parses the user's custom styles object for text statuses (backgroundColor, foregroundColor, etc.)
 */
export const parseStoryStyles = (story: any): IStoryStyles => {
    let stylesObj: IStoryStyles = {};

    if (!story || !story.styles) return stylesObj;

    if (typeof story.styles === 'string') {
        try {
            stylesObj = JSON.parse(story.styles);
        } catch (e) {
            stylesObj = {};
        }
    } else if (typeof story.styles === 'object') {
        stylesObj = story.styles;
    }

    return stylesObj;
};
