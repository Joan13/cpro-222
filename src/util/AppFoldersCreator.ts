import RNFS from 'react-native-fs';

const voiceNotes = 'YambiVoiceNotes';
const downloadedVoiceNotes = 'YambiDownloadedVoiceNotes';
const downloadedDocuments = 'YambiDownloadedDocuments';

export const createPersistedFolders = async () => {
    try {
        const filesDir = RNFS.DocumentDirectoryPath;
        const folderPath = `${filesDir}/${voiceNotes}`;

        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            await RNFS.mkdir(folderPath).catch(() => { });
        }
    } catch (error) { }

    try {
        const filesDir = RNFS.DocumentDirectoryPath;
        const folderPath = `${filesDir}/${downloadedVoiceNotes}`;

        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            await RNFS.mkdir(folderPath).catch(() => { });
        }
    } catch (error) { }

    try {
        const filesDir = RNFS.DocumentDirectoryPath;
        const folderPath = `${filesDir}/${downloadedDocuments}`;

        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            await RNFS.mkdir(folderPath).catch(() => { });
        }
    } catch (error) { }
};
