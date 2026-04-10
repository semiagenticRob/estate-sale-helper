import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing, radii, shadows } from '../lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pricing: boolean, quality: boolean, accuracy: boolean, availability: boolean) => Promise<void>;
}

const DIMENSIONS = [
  { key: 'pricing', label: 'Fair Pricing', desc: 'Were items reasonably priced?' },
  { key: 'quality', label: 'Good Quality', desc: 'Were items in good condition?' },
  { key: 'accuracy', label: 'Accurate Listing', desc: 'Did the sale match its description?' },
  { key: 'availability', label: 'Items Available', desc: 'Were listed items still there?' },
] as const;

type Answers = { [K in typeof DIMENSIONS[number]['key']]: boolean | null };

export function ReviewBottomSheet({ visible, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Answers>({
    pricing: null, quality: null, accuracy: null, availability: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = DIMENSIONS.every((d) => answers[d.key] !== null);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      await onSubmit(
        answers.pricing!,
        answers.quality!,
        answers.accuracy!,
        answers.availability!,
      );
      setAnswers({ pricing: null, quality: null, accuracy: null, availability: null });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (key: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom || spacing.lg }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Quick Review</Text>
        <Text style={styles.subtitle}>Tap to rate each aspect</Text>

        {DIMENSIONS.map((dim) => (
          <View key={dim.key} style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.dimLabel}>{dim.label}</Text>
              <Text style={styles.dimDesc}>{dim.desc}</Text>
            </View>
            <View style={styles.toggles}>
              <Pressable
                style={[
                  styles.toggle,
                  answers[dim.key] === true && styles.togglePositive,
                ]}
                onPress={() => setAnswer(dim.key, true)}
              >
                <Text style={[
                  styles.toggleText,
                  answers[dim.key] === true && styles.togglePositiveText,
                ]}>👍</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.toggle,
                  answers[dim.key] === false && styles.toggleNegative,
                ]}
                onPress={() => setAnswer(dim.key, false)}
              >
                <Text style={[
                  styles.toggleText,
                  answers[dim.key] === false && styles.toggleNegativeText,
                ]}>👎</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.submitBtn, !allAnswered && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!allAnswered || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Submit Review</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: radii.modal,
    borderTopRightRadius: radii.modal,
    padding: spacing.lg,
    ...shadows.modal,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  rowLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  dimLabel: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dimDesc: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePositive: {
    backgroundColor: colors.statusActiveBg,
    borderColor: colors.statusActive,
  },
  toggleNegative: {
    backgroundColor: '#F0E0E0',
    borderColor: colors.destructive,
  },
  toggleText: {
    fontSize: 20,
  },
  togglePositiveText: {},
  toggleNegativeText: {},
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    fontSize: fontSize.uiButton,
  },
});
