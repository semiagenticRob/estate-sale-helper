import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SaleImage } from '../types';
import { colors, fonts, fontSize, spacing } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageGalleryProps {
  images: SaleImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={[styles.image, styles.noImage]}>
        <Text style={styles.noImageText}>No images available</Text>
      </View>
    );
  }

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {images.map((img) => (
          <Image
            key={img.id}
            source={{ uri: img.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>

      {/* Page indicator */}
      <View style={styles.pagination}>
        {images.map((img, index) => (
          <View
            key={img.id}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Caption */}
      {images[activeIndex]?.caption && (
        <Text style={styles.caption}>{images[activeIndex].caption}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  noImage: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontFamily: fonts.uiSans,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  dotActive: {
    backgroundColor: colors.accentPrimary,
    width: 20,
  },
  caption: {
    textAlign: 'center',
    fontSize: fontSize.uiCaption,
    color: colors.textSecondary,
    fontFamily: fonts.bodySerif,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
});
