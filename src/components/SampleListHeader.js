import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import StatsOverview from './StatsOverview';
import UpcomingSampleCard from './UpcomingSampleCard';

const SampleListHeader = ({ stats, upcomingSample, upcomingStatus }) => (
  <View style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Beton Kür Kontrol Paneli</Text>
    </View>

    <StatsOverview stats={stats} />

    {upcomingSample ? (
      <UpcomingSampleCard sample={upcomingSample} status={upcomingStatus} />
    ) : null}

    <Text style={styles.sectionTitle}>Numune Listesi</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  hero: {
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
});

export default SampleListHeader;
