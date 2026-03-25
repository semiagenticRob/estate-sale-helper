import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../lib/theme';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: March 25, 2026</Text>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.body}>
        Estate Helper ("the App") helps you discover estate sales near you. We
        are committed to protecting your privacy and being transparent about what
        data the App accesses.
      </Text>

      <Text style={styles.sectionTitle}>Location Data</Text>
      <Text style={styles.body}>
        The App requests your device location solely to show estate sales near
        you. Your location is sent to our search service to calculate distances
        and is not stored on our servers. You can deny location access at any
        time and manually enter a city or zip code instead.
      </Text>

      <Text style={styles.sectionTitle}>Data We Collect</Text>
      <Text style={styles.body}>
        The App does not require you to create an account. Saved sales are
        stored locally on your device using on-device storage and are not
        transmitted to any server.{'\n\n'}We do not collect personal
        information, analytics, advertising identifiers, or usage data.
      </Text>

      <Text style={styles.sectionTitle}>Third-Party Services</Text>
      <Text style={styles.body}>
        The App uses the following third-party services:{'\n\n'}
        {'\u2022'} Supabase — hosts the estate sale database. No personal data is
        sent.{'\n'}
        {'\u2022'} OpenStreetMap / Nominatim — provides location search and
        geocoding. Queries include the city or address you type but no device
        identifiers.{'\n'}
        {'\u2022'} EstateSales.net — original source of estate sale listing data.
        The App displays publicly available listing information.
      </Text>

      <Text style={styles.sectionTitle}>Children's Privacy</Text>
      <Text style={styles.body}>
        The App is not directed at children under 13 and does not knowingly
        collect information from children.
      </Text>

      <Text style={styles.sectionTitle}>Changes to This Policy</Text>
      <Text style={styles.body}>
        We may update this policy from time to time. Changes will be reflected
        in the "Last updated" date above.
      </Text>

      <Text style={styles.sectionTitle}>Contact</Text>
      <Text style={styles.body}>
        If you have questions about this policy, contact us at
        privacy@estatesalehelper.com.
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
