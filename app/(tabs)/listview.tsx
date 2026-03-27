import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize } from '../../lib/theme';

export default function ListViewTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.title}>No search yet</Text>
      <Text style={styles.hint}>Run a search from the Search tab to see the list view here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.uiBody,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
