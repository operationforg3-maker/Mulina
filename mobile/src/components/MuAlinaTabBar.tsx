import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import {
  HoopIcon,
  PatternFolderIcon,
  CameraCraftIcon,
  FlossSkeinIcon,
  CraftShopIcon,
} from './RusticIcons';

export default function MuAlinaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const renderTabIcon = (tabName: string, isFocused: boolean) => {
    const iconColor = isFocused ? theme.primary : theme.textMuted;
    const secColor = isFocused ? theme.sage : theme.surfaceBorder;
    switch (tabName) {
      case 'WorkshopTab':
        return <HoopIcon size={22} color={iconColor} secondaryColor={secColor} />;
      case 'LibraryTab':
        return <PatternFolderIcon size={22} color={iconColor} />;
      case 'CreateTab':
        return <CameraCraftIcon size={24} color="#FFFFFF" />;
      case 'StashTab':
        return <FlossSkeinIcon size={22} color={iconColor} secondaryColor={secColor} />;
      case 'MarketplaceTab':
        return <CraftShopIcon size={22} color={iconColor} />;
      default:
        return <HoopIcon size={22} color={iconColor} />;
    }
  };

  const tabsConfig = [
    { name: 'WorkshopTab', label: 'Pracownia' },
    { name: 'LibraryTab', label: 'Wzory' },
    { name: 'CreateTab', label: 'Nowy', isCenter: true },
    { name: 'StashTab', label: 'Zapas' },
    { name: 'MarketplaceTab', label: 'Sklep' },
  ];

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.surface, borderTopColor: theme.surfaceBorder }]}>
      <View style={[styles.innerBar, isWide && styles.wideInnerBar]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const rawLabel = options.tabBarLabel !== undefined
            ? (typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name)
            : (options.title || route.name);
          const conf = tabsConfig.find((t) => t.name === route.name) || {
            label: rawLabel,
            isCenter: false,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (conf.isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.centerTabWrapper}
                accessibilityLabel="Nowy wzór haftu"
              >
                <View
                  style={[
                    styles.centerFab,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.surface,
                    },
                  ]}
                >
                  <CameraCraftIcon size={24} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.centerLabel,
                    { color: isFocused ? theme.primary : theme.textSecondary },
                  ]}
                >
                  Nowy Wzór
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={[
                styles.tabItem,
                isFocused && { backgroundColor: theme.backgroundAlt, borderRadius: 16 },
              ]}
              accessibilityLabel={conf.label}
            >
              {renderTabIcon(route.name, isFocused)}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? theme.primary : theme.textMuted,
                    fontWeight: isFocused ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {conf.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
  },
  innerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  wideInnerBar: {
    maxWidth: 640,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  centerTabWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
