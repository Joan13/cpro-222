import { Platform } from 'react-native';
import RNFS from 'react-native-fs';


const voiceNotes = 'YambiVoiceNotes';
const downloadedVoiceNotes = 'YambiDownloadedVoiceNotes';

export const createPersistedFolders = async () => {
    try {
        const filesDir = Platform.OS === 'android' ? RNFS.DocumentDirectoryPath : RNFS.DocumentDirectoryPath;
        const folderPath = `${filesDir}/${voiceNotes}`;

        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            RNFS.mkdir(folderPath)
                .then(() => {
                    // console.log('Folder created successfully');
                })
                .catch(error => {
                    // console.error('Error creating folder:', error);
                });
            // console.log('Persisted folder created:', folderPath);
        } else {
            // console.log('Persisted folder already exists:', folderPath);
        }
    } catch (error) {
        // console.error('Error creating persisted folder:', error);
    }

    try {
        const filesDir = Platform.OS === 'android' ? RNFS.DocumentDirectoryPath : RNFS.DocumentDirectoryPath;
        const folderPath = `${filesDir}/${downloadedVoiceNotes}`;

        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            RNFS.mkdir(folderPath)
                .then(() => {
                    // console.log('Folder created successfully');
                })
                .catch(error => {
                    // console.error('Error creating folder:', error);
                });
            // console.log('Persisted folder created:', folderPath);
        } else {
            // console.log('Persisted folder already exists:', folderPath);
        }
    } catch (error) {
        // console.error('Error creating persisted folder:', error);
    }
}


