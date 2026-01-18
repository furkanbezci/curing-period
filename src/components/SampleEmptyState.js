import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const SampleEmptyState = () => (
  <View style={styles.container}>
    <Text style={styles.icon}>📋</Text>
    <Text style={styles.title}>Henüz numune eklenmedi</Text>
    <Text style={styles.subtitle}>
      Sağ alttaki butona dokunarak kür sürecini takip etmek istediğiniz ilk numuneyi oluşturun.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SampleEmptyState;
