import * as ExpoImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickerOptions {
  width?: number;
  height?: number;
  cropping?: boolean;
  quality?: number;
  mediaType?: 'photo' | 'video' | 'any';
  multiple?: boolean;
  maxFiles?: number;
  noData?: boolean;
}

export interface ImageResult {
  path: string;
  width: number;
  height: number;
  mime?: string;
  size?: number;
}

export function openPicker(options: PickerOptions & { multiple: true }): Promise<ImageResult[]>;
export function openPicker(options?: PickerOptions & { multiple?: false }): Promise<ImageResult>;
export function openPicker(options?: PickerOptions): Promise<ImageResult | ImageResult[]>;
export async function openPicker(options: PickerOptions = {}): Promise<ImageResult | ImageResult[]> {
  // Request media library permission
  const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Requise',
      'Cette application a besoin de l\'autorisation d\'accéder à vos photos pour sélectionner des images.'
    );
    throw new Error('Permission denied');
  }

  // Determine mediaTypes
  let mediaTypes: ExpoImagePicker.MediaType[] = ['images'];
  if (options.mediaType === 'video') {
    mediaTypes = ['videos'];
  } else if (options.mediaType === 'any') {
    mediaTypes = ['images', 'videos'];
  }

  const quality = typeof options.quality === 'number' ? options.quality : 1.0;

  // allowsEditing is mutually exclusive with allowsMultipleSelection in expo-image-picker
  const allowsMultipleSelection = !!options.multiple;
  const allowsEditing = !allowsMultipleSelection && !!options.cropping;

  let aspect: [number, number] | undefined = undefined;
  if (allowsEditing && options.width && options.height) {
    aspect = [options.width, options.height];
  }

  const result = await ExpoImagePicker.launchImageLibraryAsync({
    mediaTypes,
    allowsEditing,
    aspect,
    quality,
    allowsMultipleSelection,
    selectionLimit: options.maxFiles,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    throw new Error('User cancelled image selection');
  }

  const mappedAssets = result.assets.map(asset => ({
    path: asset.uri,
    width: asset.width,
    height: asset.height,
    mime: asset.mimeType,
    size: asset.fileSize,
  }));

  if (allowsMultipleSelection) {
    return mappedAssets;
  } else {
    return mappedAssets[0];
  }
}

const ImagePicker = {
  openPicker,
};

export default ImagePicker;
