import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const ZOOM = 15;

function getTileInfo(lat: number, lng: number) {
  const n = 2 ** ZOOM;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const worldX = ((lng + 180) / 360) * n;
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * n;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);
  // Fractional position of the point within the tile (0–1)
  const fx = worldX - tileX;
  const fy = worldY - tileY;
  return { tileX, tileY, fx, fy };
}

interface Props {
  latitude: number;
  longitude: number;
}

export function SaleMap({ latitude, longitude }: Props) {
  const { tileX, tileY, fx, fy } = getTileInfo(latitude, longitude);
  const tileUrl = `https://tile.openstreetmap.org/${ZOOM}/${tileX}/${tileY}.png`;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: tileUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
      <View
        style={[
          styles.dot,
          { left: `${fx * 100}%`, top: `${fy * 100}%` },
        ]}
      />
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8E4DD',
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#fff',
    marginLeft: -8,
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 9,
    color: '#444',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
});
