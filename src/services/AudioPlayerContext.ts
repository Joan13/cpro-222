// import React, { createContext, useState, useContext } from 'react';
// import { Audio } from 'expo-av';

// type AudioPlayerContextType = {
//     currentSound: Audio.Sound | null;
//     playAudio: (uri: string) => Promise<void>;
// };

// const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

//     const playAudio = async (uri: string) => {
//         try {
//             // Arrêter et libérer le son en cours s'il y en a un
//             if (currentSound) {
//                 await currentSound.stopAsync();
//                 await currentSound.unloadAsync();
//             }

//             // Charger et jouer le nouvel audio
//             const { sound } = await Audio.Sound.createAsync({ uri });
//             setCurrentSound(sound);
//             await sound.playAsync();

//             // Réinitialiser currentSound lorsque la lecture est terminée
//             sound.setOnPlaybackStatusUpdate((status) => {
//                 if (status.didJustFinish) {
//                     setCurrentSound(null);
//                 }
//             });
//         } catch (error) {
//             console.error('Erreur lors de la lecture de l’audio:', error);
//         }
//     };

//     return (
//         <AudioPlayerContext.Provider value= {{ currentSound, playAudio }
// }>
//     { children }
//     </AudioPlayerContext.Provider>
//   );
// };

// export const useAudioPlayer = () => {
//     const context = useContext(AudioPlayerContext);
//     if (!context) {
//         throw new Error('useAudioPlayer doit être utilisé à l’intérieur d’un AudioPlayerProvider');
//     }
//     return context;
// };
