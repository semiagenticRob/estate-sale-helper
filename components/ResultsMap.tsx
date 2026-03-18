import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SearchResult } from '../types';
import { colors } from '../lib/theme';

interface ResultsMapProps {
  results: SearchResult[];
  centerLat: number;
  centerLng: number;
  radius: number;
  onSalePress: (saleId: string) => void;
}

function buildMapHtml(
  results: SearchResult[],
  centerLat: number,
  centerLng: number,
): string {
  const markers = JSON.stringify(
    results.map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      title: r.title,
      city: r.city,
      state: r.state,
      distance: r.distanceMiles,
      company: r.companyName || '',
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; }
  .sale-marker {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: ${colors.accentPrimary};
    border: 2.5px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .sale-marker-inner {
    transform: rotate(45deg);
    color: #fff; font-size: 14px; font-weight: bold;
    font-family: -apple-system, sans-serif;
  }
  .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
    background: rgba(184,137,106,0.35) !important;
  }
  .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
    background: ${colors.accentPrimary} !important;
    color: #fff !important;
    font-family: -apple-system, sans-serif;
    font-weight: 600;
  }
  .sale-popup .leaflet-popup-content-wrapper {
    border-radius: 10px; padding: 0; overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }
  .sale-popup .leaflet-popup-content { margin: 0; min-width: 200px; }
  .sale-popup .leaflet-popup-tip { border-top-color: #fff; }
  .popup-body {
    padding: 12px 14px; font-family: -apple-system, sans-serif;
  }
  .popup-title {
    font-size: 15px; font-weight: 600; color: ${colors.textPrimary};
    margin-bottom: 2px; line-height: 1.3;
  }
  .popup-sub {
    font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 8px;
  }
  .popup-btn {
    display: block; width: 100%; padding: 10px;
    background: ${colors.accentPrimary}; color: #fff;
    border: none; border-radius: 8px; font-size: 14px;
    font-weight: 600; font-family: -apple-system, sans-serif;
    cursor: pointer; text-align: center;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
(function() {
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: true
  }).setView([${centerLat}, ${centerLng}], 11);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var markers = ${markers};
  var cluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false
  });

  var bounds = [];

  markers.forEach(function(m) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="sale-marker"><span class="sale-marker-inner">★</span></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34]
    });

    var loc = m.city + ', ' + m.state + (m.distance > 0 ? ' · ' + m.distance + ' mi' : '');
    var sub = m.company ? m.company + ' · ' + loc : loc;

    var popup = L.popup({ className: 'sale-popup', closeButton: true })
      .setContent(
        '<div class="popup-body">' +
          '<div class="popup-title">' + m.title.replace(/</g, '&lt;') + '</div>' +
          '<div class="popup-sub">' + sub.replace(/</g, '&lt;') + '</div>' +
          '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'navigate\\',id:\\'' + m.id + '\\'}))">View Details</button>' +
        '</div>'
      );

    var marker = L.marker([m.lat, m.lng], { icon: icon }).bindPopup(popup);
    cluster.addLayer(marker);
    bounds.push([m.lat, m.lng]);
  });

  map.addLayer(cluster);

  if (bounds.length > 0) {
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }
})();
</script>
</body>
</html>`;
}

export function ResultsMap({
  results,
  centerLat,
  centerLng,
  radius,
  onSalePress,
}: ResultsMapProps) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'navigate' && data.id) {
          onSalePress(data.id);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onSalePress]
  );

  const html = buildMapHtml(results, centerLat, centerLng);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accentPrimary} />
          </View>
        )}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
  },
});
