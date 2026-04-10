import React, { useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SearchResult, SaleScore } from '../types';
import { colors } from '../lib/theme';
import { formatDateRange } from '../lib/dates';

interface ResultsMapProps {
  results: SearchResult[];
  centerLat: number;
  centerLng: number;
  radius: number;
  onSalePress: (saleId: string) => void;
  isSaved: (saleId: string) => boolean;
  onToggleSave: (saleId: string) => void;
  scores?: Map<string, SaleScore>;
}

function getPinStyle(score: SaleScore | undefined): { color: string; size: number } {
  if (!score || (score.worthItCount + score.skipItCount) === 0) {
    return { color: colors.accentPrimary, size: 32 };
  }
  const h = score.heatScore;
  if (h < 0.35) return { color: colors.heatCold, size: 32 };
  if (h < 0.55) return { color: colors.heatCool, size: 32 };
  if (h < 0.75) return { color: colors.heatWarm, size: 32 };
  return { color: colors.heatHot, size: 36 };
}

function buildMapHtml(
  results: SearchResult[],
  centerLat: number,
  centerLng: number,
  scores?: Map<string, SaleScore>,
): string {
  const markers = JSON.stringify(
    results
      .filter((r) => r.latitude && r.longitude)
      .slice(0, 150)
      .map((r) => {
        const score = scores?.get(r.id);
        const pin = getPinStyle(score);
        return {
          id: r.id,
          lat: r.latitude,
          lng: r.longitude,
          title: r.title || 'Estate Sale',
          city: r.city || '',
          state: r.state || '',
          distance: r.distanceMiles,
          company: r.companyName || '',
          imageUrl: r.headerImageUrl || r.images?.[0]?.imageUrl || '',
          startDate: r.startDate,
          endDate: r.endDate,
          dateRange: formatDateRange(r.startDate, r.endDate),
          pinColor: pin.color,
          pinSize: pin.size,
        };
      })
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
  .sale-marker.active {
    background: ${colors.statusActive};
  }
  .sale-marker-inner {
    transform: rotate(45deg);
    color: #fff; font-size: 14px; font-weight: bold;
    font-family: -apple-system, sans-serif;
  }
  .sale-popup .leaflet-popup-content-wrapper {
    border-radius: 10px; padding: 0; overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }
  .sale-popup .leaflet-popup-content { margin: 0; min-width: 200px; }
  .sale-popup .leaflet-popup-tip { border-top-color: #fff; }
  .popup-wrapper { position: relative; }
  .popup-image {
    width: 100%; height: 130px; object-fit: cover; display: block;
  }
  .popup-save {
    position: absolute; top: 8px; left: 8px;
    width: 30px; height: 30px;
    background: rgba(255,255,255,0.92); border: none; border-radius: 50%;
    font-size: 17px; line-height: 30px; text-align: center;
    cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    z-index: 500; color: ${colors.textSecondary};
  }
  .popup-save.saved { color: ${colors.accentPrimary}; }
  .popup-body {
    padding: 12px 14px; font-family: -apple-system, sans-serif;
  }
  .popup-title {
    font-size: 15px; font-weight: 600; color: ${colors.textPrimary};
    margin-bottom: 2px; line-height: 1.3;
  }
  .popup-sub {
    font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 4px;
  }
  .popup-dates {
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
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      var total = cluster.getAllChildMarkers().length;
      var size = total < 10 ? 40 : total < 100 ? 50 : 60;
      var fontSize = size * 0.35;
      var html = '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:${colors.accentPrimary};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;font-weight:600;color:#fff;font-size:'+fontSize+'px">'+total+'</div>';
      return L.divIcon({ html: html, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] });
    }
  });

  var bounds = [];

  markers.forEach(function(m) {
    var s = m.pinSize || 32;
    var icon = L.divIcon({
      className: '',
      html: '<div class="sale-marker" style="background:' + m.pinColor + ';width:' + s + 'px;height:' + s + 'px"><span class="sale-marker-inner">★</span></div>',
      iconSize: [s, s],
      iconAnchor: [s/2, s],
      popupAnchor: [0, -s - 2]
    });

    var loc = (m.city || '') + ', ' + (m.state || '') + (m.distance > 0 ? ' · ' + m.distance + ' mi' : '');
    var sub = m.company ? m.company + ' · ' + loc : loc;

    var imgHtml = m.imageUrl ? '<img class="popup-image" src="' + m.imageUrl + '" />' : '';
    var popup = L.popup({ className: 'sale-popup', closeButton: true })
      .setContent(
        '<div class="popup-wrapper">' +
          imgHtml +
          '<button id="save-' + m.id + '" class="popup-save" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'save\\',id:\\'' + m.id + '\\'}));">☆</button>' +
          '<div class="popup-body">' +
            '<div class="popup-title">' + (m.title || 'Estate Sale').replace(/</g, '&lt;') + '</div>' +
            '<div class="popup-sub">' + (sub || '').replace(/</g, '&lt;') + '</div>' +
            '<div class="popup-dates">' + (m.dateRange || '') + '</div>' +
            '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'navigate\\',id:\\'' + m.id + '\\'}))">View Details</button>' +
          '</div>' +
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
  isSaved,
  onToggleSave,
  scores,
}: ResultsMapProps) {
  const webViewRef = useRef<WebView>(null);
  const isSavedRef = useRef(isSaved);
  isSavedRef.current = isSaved;

  const handleLoad = useCallback(() => {
    const savedIds = results.filter((r) => isSavedRef.current(r.id)).map((r) => r.id);
    if (savedIds.length === 0) return;
    const js = savedIds.map((id) =>
      `var b=document.getElementById('save-${id}');if(b){b.classList.add('saved');b.textContent='★';}`
    ).join('') + 'true;';
    webViewRef.current?.injectJavaScript(js);
  }, [results]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'navigate' && data.id) {
          onSalePress(data.id);
        } else if (data.type === 'save' && data.id) {
          onToggleSave(data.id);
          webViewRef.current?.injectJavaScript(`
            (function() {
              var btn = document.getElementById('save-${data.id}');
              if (btn) {
                var nowSaved = btn.classList.toggle('saved');
                btn.textContent = nowSaved ? '★' : '☆';
              }
            })();
            true;
          `);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onSalePress, onToggleSave]
  );

  const html = useMemo(
    () => buildMapHtml(results, centerLat, centerLng, scores),
    [results, centerLat, centerLng, scores]
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onLoad={handleLoad}
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
