import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import type { WeatherIllustrationKey } from '../services/weather';

const WEATHER_SVGS: Record<WeatherIllustrationKey, number> = {
  'cloudy-day-1': require('../../public/assets/weather/cloudy-day-1.svg'),
  'cloudy-day-2': require('../../public/assets/weather/cloudy-day-2.svg'),
  'cloudy-day-3': require('../../public/assets/weather/cloudy-day-3.svg'),
  'cloudy-night-1': require('../../public/assets/weather/cloudy-night-1.svg'),
  'cloudy-night-2': require('../../public/assets/weather/cloudy-night-2.svg'),
  'cloudy-night-3': require('../../public/assets/weather/cloudy-night-3.svg'),
  cloudy: require('../../public/assets/weather/cloudy.svg'),
  day: require('../../public/assets/weather/day.svg'),
  night: require('../../public/assets/weather/night.svg'),
  'rainy-1': require('../../public/assets/weather/rainy-1.svg'),
  'rainy-2': require('../../public/assets/weather/rainy-2.svg'),
  'rainy-3': require('../../public/assets/weather/rainy-3.svg'),
  'rainy-4': require('../../public/assets/weather/rainy-4.svg'),
  'rainy-5': require('../../public/assets/weather/rainy-5.svg'),
  'rainy-6': require('../../public/assets/weather/rainy-6.svg'),
  'rainy-7': require('../../public/assets/weather/rainy-7.svg'),
  'snowy-1': require('../../public/assets/weather/snowy-1.svg'),
  'snowy-2': require('../../public/assets/weather/snowy-2.svg'),
  'snowy-3': require('../../public/assets/weather/snowy-3.svg'),
  'snowy-4': require('../../public/assets/weather/snowy-4.svg'),
  'snowy-5': require('../../public/assets/weather/snowy-5.svg'),
  'snowy-6': require('../../public/assets/weather/snowy-6.svg'),
  thunder: require('../../public/assets/weather/thunder.svg'),
};

type Props = {
  iconKey: WeatherIllustrationKey;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function WeatherIcon({ iconKey, size = 56, style }: Props) {
  const moduleId = WEATHER_SVGS[iconKey];

  const asset = useMemo(() => Asset.fromModule(moduleId), [moduleId]);
  const [uri, setUri] = useState<string | null>(asset.localUri || asset.uri || null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!asset.localUri) {
          await asset.downloadAsync();
        }
        if (!cancelled) {
          setUri(asset.localUri || asset.uri || null);
        }
      } catch {
        if (!cancelled) {
          setUri(asset.uri || null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [asset]);

  if (!uri) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  // "Think out of the box": User requested to use "vertical center and in the top x and y both center"
  // and avoid manual offsets. The SVGs have some internal padding, so we scale them up 
  // uniformly to fill the container, but we rely on standard Flexbox alignment (justify/align center)
  // to position the SVG in the View.

  const scale = 1.5;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <SvgUri
        uri={uri}
        width={size * scale}
        height={size * scale}
      />
    </View>
  );
}
