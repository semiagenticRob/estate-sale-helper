import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing, radii } from '../lib/theme';
import { SignalType, SaleScore } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSignal: (type: SignalType) => Promise<void>;
  onReview: (pricing: boolean, quality: boolean, accuracy: boolean, availability: boolean) => Promise<void>;
  currentSignal: SignalType | null;
  submitting: boolean;
  score: SaleScore | null;
}

type Step = 'signal' | 'review' | 'done';

const DIMENSIONS = [
  { key: 'pricing', label: 'Fair Pricing', desc: 'Were items reasonably priced?' },
  { key: 'quality', label: 'Good Quality', desc: 'Were items in good condition?' },
  { key: 'accuracy', label: 'Accurate Listing', desc: 'Did the sale match its description?' },
  { key: 'availability', label: 'Still Plenty Left', desc: 'Are there many items left for sale?' },
] as const;

type AnswerValue = true | false | 'unsure' | null;
type Answers = { [K in typeof DIMENSIONS[number]['key']]: AnswerValue };

export function WorthTheDriveModal({
  visible, onClose, onSignal, onReview, currentSignal, submitting, score,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(currentSignal ? 'review' : 'signal');
  const [selectedSignal, setSelectedSignal] = useState<SignalType | null>(currentSignal);
  const [answers, setAnswers] = useState<Answers>({
    pricing: null, quality: null, accuracy: null, availability: null,
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const worthCount = score?.worthItCount ?? 0;
  const skipCount = score?.skipItCount ?? 0;

  const handleSignal = async (type: SignalType) => {
    setSelectedSignal(type);
    await onSignal(type);
    setStep('review');
  };

  const allAnswered = DIMENSIONS.every((d) => answers[d.key] !== null);
  const toBool = (v: AnswerValue): boolean => v === true; // 'unsure' and false both count as not positive

  const handleSubmitReview = async () => {
    if (!allAnswered) return;
    setSubmittingReview(true);
    try {
      await onReview(toBool(answers.pricing), toBool(answers.quality), toBool(answers.accuracy), toBool(answers.availability));
      setStep('done');
      setTimeout(onClose, 1500);
    } catch {
      // stay on review
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSkipReview = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>

        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>

        {step === 'signal' && (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Worth the drive?</Text>
            <Text style={styles.subheading}>
              Help other estate sale shoppers by sharing your experience
            </Text>

            <View style={styles.signalButtons}>
              <Pressable
                style={[styles.signalBtn, styles.worthBtn, selectedSignal === 'worth_it' && styles.worthBtnActive]}
                onPress={() => handleSignal('worth_it')}
                disabled={submitting}
              >
                {submitting && selectedSignal === 'worth_it' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.signalIcon}>+</Text>
                    <Text style={[styles.signalLabel, selectedSignal === 'worth_it' && styles.signalLabelActive]}>Worth It</Text>
                    {worthCount > 0 && <Text style={styles.signalCount}>{worthCount}</Text>}
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.signalBtn, styles.skipBtn, selectedSignal === 'skip_it' && styles.skipBtnActive]}
                onPress={() => handleSignal('skip_it')}
                disabled={submitting}
              >
                {submitting && selectedSignal === 'skip_it' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.signalIcon}>-</Text>
                    <Text style={[styles.signalLabel, selectedSignal === 'skip_it' && styles.signalLabelActive]}>Skip It</Text>
                    {skipCount > 0 && <Text style={styles.signalCount}>{skipCount}</Text>}
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {step === 'review' && (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Quick Review</Text>
            <Text style={styles.subheading}>
              Rate your experience to help others
            </Text>

            {DIMENSIONS.map((dim) => (
              <View key={dim.key} style={styles.dimRow}>
                <View style={styles.dimInfo}>
                  <Text style={styles.dimLabel}>{dim.label}</Text>
                  <Text style={styles.dimDesc}>{dim.desc}</Text>
                </View>
                <View style={styles.dimToggles}>
                  <Pressable
                    style={[styles.toggleBtn, answers[dim.key] === true && styles.togglePositive]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [dim.key]: true }))}
                  >
                    <Text style={[styles.toggleText, answers[dim.key] === true && styles.toggleTextActive]}>Yes</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleBtn, answers[dim.key] === false && styles.toggleNegative]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [dim.key]: false }))}
                  >
                    <Text style={[styles.toggleText, answers[dim.key] === false && styles.toggleTextActive]}>No</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleBtn, answers[dim.key] === 'unsure' && styles.toggleUnsure]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [dim.key]: 'unsure' }))}
                  >
                    <Text style={[styles.toggleTextSmall, answers[dim.key] === 'unsure' && styles.toggleTextActive]}>Not Sure</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.submitBtn, !allAnswered && styles.submitDisabled]}
              onPress={handleSubmitReview}
              disabled={!allAnswered || submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </Pressable>

            <Pressable style={styles.skipReviewLink} onPress={handleSkipReview}>
              <Text style={styles.skipReviewText}>Skip review</Text>
            </Pressable>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.doneContainer}>
            <Text style={styles.doneText}>Thanks for helping the community!</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: spacing.lg,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  closeBtnText: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    lineHeight: 22,
  },

  // Signal buttons
  signalButtons: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  signalBtn: {
    flex: 1,
    height: 80,
    borderRadius: radii.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  worthBtn: {
    borderColor: colors.statusActive,
  },
  worthBtnActive: {
    backgroundColor: colors.statusActiveBg,
    borderColor: colors.statusActive,
  },
  skipBtn: {
    borderColor: colors.textSecondary,
  },
  skipBtnActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  signalIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  signalLabel: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  signalLabelActive: {
    color: colors.textPrimary,
  },
  signalCount: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
  },

  // Review dimensions
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  dimInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  dimLabel: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dimDesc: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dimToggles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    width: 52,
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
  toggleUnsure: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.textSecondary,
  },
  toggleText: {
    fontSize: fontSize.uiButton,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextSmall: {
    fontSize: fontSize.uiMicro,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },

  // Submit
  submitBtn: {
    marginTop: spacing.xxl,
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
    fontWeight: '600',
    fontSize: fontSize.body,
  },
  skipReviewLink: {
    marginTop: spacing.base,
    alignItems: 'center',
    padding: spacing.sm,
  },
  skipReviewText: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
  },

  // Done
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
