import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1180;
  const isDesktop = width >= 1180;
  const isTabletOrLarger = width >= 768;

  // Maximum content width for comfortable reading & tablet usability
  const containerMaxWidth = isDesktop ? 1160 : isTablet ? 980 : '100%';

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isTabletOrLarger,
    containerMaxWidth,
  };
}
