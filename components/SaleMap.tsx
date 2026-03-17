import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../lib/theme';

// Zoom 12 gives a nice "part of town" overview — roughly 10-15 km across
const ZOOM = 12;
const GRID = 3; // 3x3 tile grid for a wider view
const TILE_SIZE = 256;

function getTileInfo(lat: number, lng: number) {
  const n = 2 ** ZOOM;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const worldX = ((lng + 180) / 360) * n;
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * n;
  const centerTileX = Math.floor(worldX);
  const centerTileY = Math.floor(worldY);
  // Fractional position within the center tile (0–1)
  const fx = worldX - centerTileX;
  const fy = worldY - centerTileY;
  return { centerTileX, centerTileY, fx, fy };
}

interface Props {
  latitude: number;
  longitude: number;
}

export function SaleMap({ latitude, longitude }: Props) {
  const { centerTileX, centerTileY, fx, fy } = getTileInfo(latitude, longitude);
  const offset = Math.floor(GRID / 2); // 1 for a 3x3 grid

  // Build tile grid starting from top-left
  const tiles: { x: number; y: number; col: number; row: number }[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      tiles.push({
        x: centerTileX - offset + col,
        y: centerTileY - offset + row,
        col,
        row,
      });
    }
  }

  // Star position: pixel offset within the full grid
  const starPixelX = (offset + fx) * TILE_SIZE;
  const starPixelY = (offset + fy) * TILE_SIZE;
  // Convert to percentage of total grid size
  const totalSize = GRID * TILE_SIZE;
  const starPctX = (starPixelX / totalSize) * 100;
  const starPctY = (starPixelY / totalSize) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.tileGrid}>
        {tiles.map((tile) => (
          <Image
            key={`${tile.x}-${tile.y}`}
            source={{
              uri: `https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png`,
              headers: {
                'User-Agent': 'EstateHelper/1.0',
              },
            }}
            style={[
              styles.tile,
              {
                left: `${(tile.col / GRID) * 100}%`,
                top: `${(tile.row / GRID) * 100}%`,
                width: `${(1 / GRID) * 100}%`,
                height: `${(1 / GRID) * 100}%`,
              },
            ]}
            resizeMode="cover"
          />
        ))}
        {/* Star marker */}
        <View
          style={[
            styles.starContainer,
            { left: `${starPctX}%`, top: `${starPctY}%` },
          ]}
        >
          <Text style={styles.starShadow}>★</Text>
          <Text style={styles.star}>★</Text>
        </View>
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  tileGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  tile: {
    position: 'absolute',
  },
  starContainer: {
    position: 'absolute',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starShadow: {
    position: 'absolute',
    fontSize: 30,
    color: 'rgba(0,0,0,0.3)',
    top: 2,
    left: 1,
  },
  star: {
    fontSize: 28,
    color: colors.accentPrimary,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
