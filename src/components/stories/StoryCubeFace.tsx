import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    type SharedValue,
} from 'react-native-reanimated';

interface StoryUserCardProps {
    index: number;
    currentUserIndex: number;
    scrollX: SharedValue<number>;
    width: number;
    height: number;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
    children: React.ReactNode;
}

/**
 * StoryUserCard (Cas A : positionnement absolu top: 0, left: 0)
 * Gère la transition 3D Cube en continu pour la carte courante,
 * la carte suivante et la carte précédente.
 */
export const StoryUserCard: React.FC<StoryUserCardProps> = ({
    index,
    currentUserIndex,
    scrollX,
    width: W,
    height: H,
    pointerEvents,
    children,
}) => {
    const PERSPECTIVE = W * 2;

    const cardAnimatedStyle = useAnimatedStyle(() => {
        const diff = index - currentUserIndex;
        // translationX : translation horizontale relative par rapport à la page courante
        // quand on swipe vers la gauche, scrollX augmente, donc translateX va de 0 à -W
        const translateX = -(scrollX.value - currentUserIndex * W);

        // Si la page n'est pas un voisin immédiat, masquer pour économiser le GPU
        if (Math.abs(diff) > 1) {
            return {
                opacity: 0,
                zIndex: 0,
                transform: [{ perspective: PERSPECTIVE }] as any,
            };
        }

        // --- CAS 1 : PAGE COURANTE (diff === 0) ---
        if (diff === 0) {
            // Swipe vers la gauche (sortie vers la gauche, translateX de 0 à -W)
            if (translateX <= 0) {
                const rotateY = interpolate(
                    translateX,
                    [-W, 0],
                    [-90, 0],
                    Extrapolation.CLAMP
                );
                return {
                    opacity: 1,
                    zIndex: translateX > -W / 2 ? 2 : 1,
                    transform: [
                        { perspective: PERSPECTIVE },
                        // 1. Décaler le pivot sur le bord droit (-W/2)
                        { translateX: -W / 2 },
                        // 2. Appliquer la rotation (de 0deg à -90deg)
                        { rotateY: `${rotateY}deg` },
                        // 3. Ramener la vue à sa place (+W/2)
                        { translateX: W / 2 },
                        // 4. Déplacement avec le geste de swipe
                        { translateX },
                    ] as any,
                };
            }
            // Swipe vers la droite (sortie vers la droite, translateX de 0 à +W)
            else {
                const rotateY = interpolate(
                    translateX,
                    [0, W],
                    [0, 90],
                    Extrapolation.CLAMP
                );
                return {
                    opacity: 1,
                    zIndex: translateX < W / 2 ? 2 : 1,
                    transform: [
                        { perspective: PERSPECTIVE },
                        // 1. Décaler le pivot sur le bord gauche (+W/2)
                        { translateX: W / 2 },
                        // 2. Appliquer la rotation (de 0deg à 90deg)
                        { rotateY: `${rotateY}deg` },
                        // 3. Ramener la vue à sa place (-W/2)
                        { translateX: -W / 2 },
                        // 4. Déplacement avec le geste de swipe
                        { translateX },
                    ] as any,
                };
            }
        }

        // --- CAS 2 : PAGE SUIVANTE (diff === 1) ---
        if (diff === 1) {
            // Visible pendant le swipe vers la gauche (entrée depuis la droite)
            if (translateX <= 0) {
                const rotateY = interpolate(
                    translateX,
                    [-W, 0],
                    [0, 90],
                    Extrapolation.CLAMP
                );
                return {
                    opacity: 1,
                    zIndex: translateX <= -W / 2 ? 2 : 1,
                    transform: [
                        { perspective: PERSPECTIVE },
                        // 1. Décaler le pivot sur le bord gauche (+W/2)
                        { translateX: W / 2 },
                        // 2. Appliquer la rotation (de 90deg à 0deg)
                        { rotateY: `${rotateY}deg` },
                        // 3. Ramener la vue à sa place (-W/2)
                        { translateX: -W / 2 },
                        // 4. Déplacement avec le geste de swipe (position initiale à +W)
                        { translateX: translateX + W },
                    ] as any,
                };
            } else {
                return {
                    opacity: 0,
                    zIndex: 0,
                    transform: [{ perspective: PERSPECTIVE }] as any,
                };
            }
        }

        // --- CAS 3 : PAGE PRÉCÉDENTE (diff === -1) ---
        if (diff === -1) {
            // Visible pendant le swipe vers la droite (entrée depuis la gauche)
            if (translateX >= 0) {
                const rotateY = interpolate(
                    translateX,
                    [0, W],
                    [-90, 0],
                    Extrapolation.CLAMP
                );
                return {
                    opacity: 1,
                    zIndex: translateX >= W / 2 ? 2 : 1,
                    transform: [
                        { perspective: PERSPECTIVE },
                        // 1. Décaler le pivot sur le bord droit (-W/2)
                        { translateX: -W / 2 },
                        // 2. Appliquer la rotation (de -90deg à 0deg)
                        { rotateY: `${rotateY}deg` },
                        // 3. Ramener la vue à sa place (+W/2)
                        { translateX: W / 2 },
                        // 4. Déplacement avec le geste de swipe (position initiale à -W)
                        { translateX: translateX - W },
                    ] as any,
                };
            } else {
                return {
                    opacity: 0,
                    zIndex: 0,
                    transform: [{ perspective: PERSPECTIVE }] as any,
                };
            }
        }

        return {
            opacity: 0,
            zIndex: 0,
            transform: [{ perspective: PERSPECTIVE }] as any,
        };
    }, [index, currentUserIndex, W, PERSPECTIVE]);

    const shadowAnimatedStyle = useAnimatedStyle(() => {
        const diff = index - currentUserIndex;
        const translateX = -(scrollX.value - currentUserIndex * W);

        let rotateDeg = 0;
        if (diff === 0) {
            rotateDeg = translateX <= 0
                ? interpolate(translateX, [-W, 0], [-90, 0], Extrapolation.CLAMP)
                : interpolate(translateX, [0, W], [0, 90], Extrapolation.CLAMP);
        } else if (diff === 1 && translateX <= 0) {
            rotateDeg = interpolate(translateX, [-W, 0], [0, 90], Extrapolation.CLAMP);
        } else if (diff === -1 && translateX >= 0) {
            rotateDeg = interpolate(translateX, [0, W], [-90, 0], Extrapolation.CLAMP);
        }

        const shadowOpacity = interpolate(
            Math.abs(rotateDeg),
            [0, 90],
            [0, 0.6],
            Extrapolation.CLAMP
        );

        return {
            opacity: shadowOpacity,
        };
    }, [index, currentUserIndex, W]);

    return (
        <Animated.View
            pointerEvents={pointerEvents ?? 'auto'}
            style={[
                StyleSheet.absoluteFillObject,
                { width: W, height: H, backfaceVisibility: 'hidden' },
                cardAnimatedStyle,
            ]}
        >
            {children}
            {/* 3D Shading Overlay */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: '#000000' },
                    shadowAnimatedStyle,
                ]}
            />
        </Animated.View>
    );
};

// Aliases pour compatibilité
export const StoryUserPage = StoryUserCard;
export const StoryCubeFace = StoryUserCard;

export default StoryUserCard;
