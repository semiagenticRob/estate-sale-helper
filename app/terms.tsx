import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../lib/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Terms of Service</Text>
      <Text style={styles.updated}>Last updated: March 25, 2026</Text>

      <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
      <Text style={styles.body}>
        By using Estate Helper ("the App"), you agree to these Terms of Service.
        If you do not agree, please do not use the App.
      </Text>

      <Text style={styles.sectionTitle}>Description of Service</Text>
      <Text style={styles.body}>
        Estate Helper is a free mobile application that helps users discover
        estate sales by location and date. The App aggregates publicly available
        estate sale listings and presents them in a convenient format.
      </Text>

      <Text style={styles.sectionTitle}>Accuracy of Information</Text>
      <Text style={styles.body}>
        Estate sale listings are sourced from third-party websites and may not
        always be accurate or up to date. Sale dates, times, locations, and
        descriptions are provided as-is. We recommend confirming details with the
        sale organizer before visiting.
      </Text>

      <Text style={styles.sectionTitle}>User Conduct</Text>
      <Text style={styles.body}>
        You agree to use the App for lawful purposes only. You may not attempt
        to reverse-engineer, modify, or interfere with the App's functionality.
      </Text>

      <Text style={styles.sectionTitle}>Limitation of Liability</Text>
      <Text style={styles.body}>
        The App is provided "as is" without warranties of any kind. We are not
        liable for any damages arising from your use of the App, including but
        not limited to inaccurate listing information, missed sales, or travel
        decisions made based on App data.
      </Text>

      <Text style={styles.sectionTitle}>Changes to Terms</Text>
      <Text style={styles.body}>
        We may update these terms from time to time. Continued use of the App
        after changes constitutes acceptance of the updated terms.
      </Text>

      <Text style={styles.sectionTitle}>Contact</Text>
      <Text style={styles.body}>
        If you have questions about these terms, contact us at
        support@estatesalehelper.com.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  heading: {
    fontSize: fontSize.displayMedium,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  updated: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.bodySerif,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
