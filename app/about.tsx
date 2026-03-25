import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, radii } from '../lib/theme';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Estate Helper</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.tagline}>Find estate sales near you</Text>
      </View>

      <View style={styles.links}>
        <Pressable style={styles.linkRow} onPress={() => router.push('/privacy')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.linkRow} onPress={() => router.push('/terms')}>
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.copyright}>
        {'\u00A9'} 2026 Estate Sale Helper. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  appName: {
    fontSize: fontSize.displayMedium,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.bodySerif,
    color: colors.textSecondary,
  },
  links: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: fonts.uiSans,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.base,
  },
  copyright: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
