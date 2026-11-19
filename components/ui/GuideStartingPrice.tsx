import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Public profile prices are the minimum experience price, never a day/hour rate. */
export function GuideStartingPrice({ amount, style }: { amount: string; style?: StyleProp<TextStyle> }) {
  const { t } = useTranslation();
  return <Text style={style}>{t('companionDetails.fromPrice', { price: amount })}</Text>;
}
