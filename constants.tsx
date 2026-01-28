
import React from 'react';
import { PricingPackage } from './types';

export const COLORS = {
  primary: '#243b8c', // Deep Blue
  secondary: '#f7941d', // CoTrac Orange
  accent: '#1e2d6b',
  bg: '#f8fafc',
};

export const PACKAGES: PricingPackage[] = [
  {
    id: 'basic',
    name: 'COTRAC BASIC +',
    price: '₦90,650',
    color: 'bg-blue-50',
    features: [
      'Real-time Tracking', 
      'Mobile App Access', 
      'Engine Kill', 
      '6 Months History', 
      'Standard Recovery Support',
      'Power Disconnect Alert'
    ],
  },
  {
    id: 'gold',
    name: 'COTRAC GOLD',
    price: '₦120,200',
    color: 'bg-orange-100',
    features: [
      'All Basic features', 
      'Voice Monitoring', 
      '1 Year History', 
      'Priority VIP Recovery', 
      'Advanced Geofencing',
      'Door/ACC Status Alert',
      'Fuel Monitoring Support'
    ],
  }
];

export const PRE_CHECK_ITEMS = [
  'A/C', 'Wiper', 'Winder FL', 'Winder FR', 'Winder BL', 'Winder BR', 
  'Head Lamps', 'Dash Board Lights', 'Trafficators', 'Upholstery', 
  'Car Radio', 'Central Lock', 'Brakes / ABS', 'Airbag', 'Horn', 
  'Transmission System', 'Seat Belt (Left)', 'Seat Belt (Right)',
  'Triangle Sign', 'Fire Extinguisher', 'Spare Tyre', 'Broken Glass'
];
