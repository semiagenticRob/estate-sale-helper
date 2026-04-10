import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = '@estate_helper_device_id';
let cachedHash: string | null = null;

export async function getHashedDeviceId(): Promise<string> {
  if (cachedHash) return cachedHash;

  let rawId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!rawId) {
    rawId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, rawId);
  }

  cachedHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawId,
  );
  return cachedHash;
}
