import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ImageGallery } from '../../components/ImageGallery';
import { WorthTheDriveModal } from '../../components/WorthTheDriveBanner';
import { ReviewAggregateCard } from '../../components/ReviewAggregateCard';
import { useSavedSales } from '../../hooks/useSavedSales';
import { useGeofence } from '../../hooks/useGeofence';
import { useSignal } from '../../hooks/useSignal';
import { getSaleById } from '../../lib/salesApi';
import { getSaleScore, getReviewAggregate, submitReview } from '../../lib/communityApi';
import { saveVisit, markReviewed, hasReviewed as checkHasReviewed } from '../../lib/geofenceTracker';
import { getLastSearch } from '../../lib/searchState';
import { Sale, SaleScore, ReviewAggregate } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { detectPaymentTypes } from '../../lib/paymentTypes';
import { colors, fonts, fontSize, spacing, radii, shadows } from '../../lib/theme';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleSave, isSaved } = useSavedSales();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Community state
  const [score, setScore] = useState<SaleScore | null>(null);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [aggLoading, setAggLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(true); // start hidden until check completes
  const [reviewCheckDone, setReviewCheckDone] = useState(false);

  const geofence = useGeofence(sale?.latitude, sale?.longitude);
  const signal = useSignal(sale?.id);

  const fetchSale = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    getSaleById(id)
      .then(setSale)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  // Fetch community data after sale loads
  const refreshCommunityData = useCallback(() => {
    if (!sale?.id) return;
    setAggLoading(true);
    Promise.all([
      getSaleScore(sale.id).then(setScore).catch(() => {}),
      getReviewAggregate(sale.id).then(setAggregate).catch(() => {}),
    ]).finally(() => setAggLoading(false));
  }, [sale?.id]);

  useEffect(() => {
    refreshCommunityData();
  }, [refreshCommunityData]);

  // Track geofence visit + check if already reviewed
  useEffect(() => {
    if (!sale || geofence.loading) return;
    if (geofence.withinRange) {
      saveVisit(sale.id, sale.title, sale.latitude, sale.longitude);
      checkHasReviewed(sale.id).then((reviewed) => {
        setAlreadyReviewed(reviewed);
        setReviewCheckDone(true);
      });
    } else {
      setAlreadyReviewed(true); // not in range, keep hidden
      setReviewCheckDone(true);
    }
  }, [sale?.id, geofence.withinRange, geofence.loading]);


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>Could not load this sale</Text>
        <Text style={[styles.errorText, { fontSize: 14, marginTop: 4 }]}>Check your connection and try again</Text>
        <Pressable style={styles.retryButton} onPress={fetchSale}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Sale not found</Text>
      </View>
    );
  }

  const handleGetDirections = () => {
    const address = encodeURIComponent(
      `${sale.address}, ${sale.city}, ${sale.state} ${sale.zipCode}`
    );
    Linking.openURL(`https://maps.google.com/?q=${address}`);
  };

  const handleViewOriginal = () => {
    if (sale.url) Linking.openURL(sale.url);
  };

  const saved = isSaved(sale.id);

  const handleSignal = async (type: 'worth_it' | 'skip_it') => {
    await signal.submit(type, geofence.userLat, geofence.userLng);
    // Refresh score after signal
    getSaleScore(sale.id).then(setScore).catch(() => {});
  };

  const handleReview = async (pricing: boolean, quality: boolean, accuracy: boolean, availability: boolean) => {
    await submitReview(sale.id, geofence.userLat, geofence.userLng, pricing, quality, accuracy, availability);
    refreshCommunityData();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <ImageGallery images={sale.images.slice(0, 8)} />

        <View style={styles.content}>
          {/* Title and Save */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{sale.title}</Text>
            <Pressable
              style={[styles.saveBtn, saved && styles.saveBtnActive]}
              onPress={() => toggleSave(sale.id)}
            >
              <Text style={styles.saveBtnText}>
                {saved ? '★ Saved' : '☆ Save'}
              </Text>
            </Pressable>
          </View>

          {sale.companyName && (
            <Text style={styles.company}>by {sale.companyName}</Text>
          )}

          {/* Date, Time, and Location */}
          <View style={styles.infoSection}>
            {sale.saleHours ? (
              <View style={styles.hoursBlock}>
                <Text style={styles.infoLabel}>Hours:</Text>
                <View style={styles.hoursLines}>
                  {sale.saleHours.split('\n').map((line, i) => (
                    <Text key={i} style={styles.hoursLine}>{line}</Text>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoText}>
                {sale.address ? `${sale.address}, ${sale.city}, ${sale.state} ${sale.zipCode}` : `${sale.city}, ${sale.state} ${sale.zipCode}`}
              </Text>
            </View>
            {(() => {
              const payments = detectPaymentTypes(sale.terms, sale.description);
              if (payments.length === 0) return null;
              return (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment:</Text>
                  <View style={styles.paymentTags}>
                    {payments.map((p) => (
                      <View key={p.type} style={[styles.paymentBadge, { backgroundColor: p.bgColor }]}>
                        <Text style={[styles.paymentText, { color: p.textColor }]}>{p.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Community Reviews */}
          <ReviewAggregateCard
            aggregate={aggregate}
            loading={aggLoading}
            canReview={geofence.withinRange && !geofence.loading && !alreadyReviewed}
            onLeaveReview={() => setShowRatingModal(true)}
          />

          {/* Get Directions */}
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={handleGetDirections}>
              <Text style={styles.actionBtnText}>Get Directions</Text>
            </Pressable>
          </View>

          {/* Description */}
          {sale.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About This Sale</Text>
              <Text style={styles.description}>{sale.description}</Text>
            </View>
          ) : null}

          {/* Images Grid */}
          {sale.images.length > 0 && (
            <View style={styles.imagesSection}>
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imageGrid}>
                {sale.images.map((img) => (
                  <View key={img.id} style={styles.imageGridItem}>
                    <Image
                      source={{ uri: img.imageUrl }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* View on EstateSales.net */}
          {sale.url && (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnSecondary, { marginBottom: spacing.xxl }]}
              onPress={handleViewOriginal}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                View on EstateSales.net
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Prominent banner when at the sale */}
      {geofence.withinRange && !geofence.loading && reviewCheckDone && !alreadyReviewed && !showRatingModal && (
        <Pressable style={styles.passiveBanner} onPress={() => setShowRatingModal(true)}>
          <View style={styles.passiveBannerContent}>
            <Text style={styles.passiveBannerTitle}>You're here</Text>
            <Text style={styles.passiveBannerText}>
              Rate this sale when you're ready
            </Text>
          </View>
          <View style={styles.passiveBannerBtn}>
            <Text style={styles.passiveBannerBtnText}>Rate Now</Text>
          </View>
        </Pressable>
      )}

      {/* Worth the Drive + Review modal */}
      <WorthTheDriveModal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          refreshCommunityData();
        }}
        onSignal={async (type) => {
          await handleSignal(type);
          if (sale) {
            markReviewed(sale.id);
            setAlreadyReviewed(true);
          }
        }}
        onReview={async (p, q, a, av) => {
          await handleReview(p, q, a, av);
          if (sale) {
            markReviewed(sale.id);
            setAlreadyReviewed(true);
          }
        }}
        currentSignal={signal.currentSignal}
        submitting={signal.state === 'submitting'}
        score={score}
      />

      {/* Footer Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 10 }]}>
        <Pressable style={styles.tabItem} onPress={() => router.navigate('/')}>
          <Ionicons name="search" size={22} color={colors.textSecondary} />
          <Text style={styles.tabLabel}>Search</Text>
        </Pressable>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            const last = getLastSearch();
            if (last) {
              router.navigate({ pathname: '/results', params: { ...last, viewMode: 'map' } });
            } else {
              router.navigate('/mapview');
            }
          }}
        >
          <Ionicons name="map-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.tabLabel}>Map</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.navigate('/saved')}>
          <Text style={styles.tabIcon}>★</Text>
          <Text style={styles.tabLabel}>Saved</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
  },
  errorText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.accentPrimary,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    fontSize: fontSize.uiButton,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  saveBtn: {
    paddingHorizontal: spacing.listItemVertical,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
  },
  saveBtnActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  saveBtnText: {
    fontSize: fontSize.uiButton,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  company: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    marginBottom: spacing.base,
  },
  infoSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.card,
    padding: spacing.listItemVertical,
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hoursBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  hoursLines: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  hoursLine: {
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.uiSans,
    textAlign: 'right',
  },
  infoLabel: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.uiSans,
    flex: 1,
    textAlign: 'right',
  },
  paymentTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.small,
  },
  paymentText: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentSecondary,
  },
  actionBtnText: {
    color: colors.white,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    fontSize: fontSize.uiButton,
  },
  actionBtnTextSecondary: {
    color: colors.accentSecondary,
  },
  descriptionSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.body,
    fontFamily: fonts.bodySerif,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  imagesSection: {
    marginBottom: spacing.xxl,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageGridItem: {
    width: (Dimensions.get('window').width - 40 - 8) / 2,
    aspectRatio: 1,
    borderRadius: radii.button,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  passiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C4982A',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  passiveBannerContent: {
    flex: 1,
  },
  passiveBannerTitle: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  passiveBannerText: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSans,
    color: 'rgba(255,255,255,0.9)',
  },
  passiveBannerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radii.button,
  },
  passiveBannerBtnText: {
    fontSize: fontSize.body,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '700',
    color: '#C4982A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
    paddingTop: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  tabIcon: {
    fontSize: 22,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: fontSize.tabLabel,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
  },
});
