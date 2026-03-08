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
    backgroundColor: '#EDE8E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#A8A09A',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD8CE',
  },
  dotActive: {
    backgroundColor: '#3A3830',
    width: 20,
  },
  caption: {
    textAlign: 'center',
    fontSize: 13,
    color: '#7A7269',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
