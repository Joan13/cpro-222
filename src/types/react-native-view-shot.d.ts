declare module 'react-native-view-shot' {
    import type { RefObject } from 'react';
    import type { View } from 'react-native';

    export interface CaptureOptions {
        format?: 'png' | 'jpg' | 'webm';
        quality?: number;
        result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
        width?: number;
        height?: number;
        /** iOS only — alternate snapshot strategy if the default capture fails */
        useRenderInContext?: boolean;
    }

    export function captureRef(
        ref: RefObject<View | null>,
        options?: CaptureOptions,
    ): Promise<string>;
}
