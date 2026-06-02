import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import StatsOverview from './StatsOverview';
import UpcomingSampleCard from './UpcomingSampleCard';

const SampleListHeader = ({
  stats,
  upcomingSample,
  upcomingStatus,
  selectedFilter,
  onFilterChange,
}) => (
  <View style={styles.container}>
   

    <StatsOverview
      stats={stats}
      selectedKey={selectedFilter}
      onSelectFilter={onFilterChange}
    />

    {upcomingSample ? (
      <UpcomingSampleCard sample={upcomingSample} status={upcomingStatus} />
    ) : null}

    <Text style={styles.sectionTitle}>Numune Listesi</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  hero: {
    backgroundColor: '#EEF2FA',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '700',
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
});

export default SampleListHeader;
