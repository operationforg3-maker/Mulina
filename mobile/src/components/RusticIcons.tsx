import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  strokeWidth?: number;
  style?: any;
}

/**
 * Drewniany tamborek hafciarski ze śrubą regulacyjną
 */
export function HoopIcon({ size = 24, color = '#D9777F', secondaryColor = '#8D6E63', strokeWidth = 2, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Zewnętrzna obręcz tamborka */}
      <Circle cx="12" cy="13" r="8.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Wewnętrzna obręcz */}
      <Circle cx="12" cy="13" r="6.5" stroke={secondaryColor} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
      {/* Górna śruba montażowa */}
      <Rect x="10.5" y="1.5" width="3" height="3" rx="0.8" fill={secondaryColor} />
      <Line x1="12" y1="4.5" x2="12" y2="2" stroke={secondaryColor} strokeWidth={1.5} />
      <Line x1="9.5" y1="3" x2="14.5" y2="3" stroke={secondaryColor} strokeWidth={1.2} />
      {/* Mały krzyżyk w centrum */}
      <Line x1="10.5" y1="11.5" x2="13.5" y2="14.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="13.5" y1="11.5" x2="10.5" y2="14.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Igła z przewleczoną niteczką
 */
export function NeedleIcon({ size = 24, color = '#D9777F', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Oczko igły i korpus igły po skosie */}
      <Path
        d="M19.5 4.5C20.2 3.8 20.8 4.2 20.2 5L7 19.5C6.3 20.3 5.2 20.1 5 19C4.9 17.8 5.7 16.7 6.5 16L19.5 4.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Oczko igły */}
      <Line x1="17.5" y1="6.5" x2="18.5" y2="5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Falująca niteczka */}
      <Path
        d="M18 6C15 2 10 4 11 8C12 12 6 12 4 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}

/**
 * Pasmo muliny (skein DMC) z banderolą
 */
export function FlossSkeinIcon({ size = 24, color = '#D9777F', secondaryColor = '#C2A68D', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Pętla górna */}
      <Path d="M9 3C9 2 15 2 15 3V7H9V3Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Środek skręcony */}
      <Path d="M9 7L15 11M15 7L9 11" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Banderola papierowa DMC */}
      <Rect x="8" y="11" width="8" height="4" rx="1" fill={secondaryColor} stroke={color} strokeWidth={1} />
      {/* Dolne pasma nici */}
      <Path d="M9 15V20C9 21.5 11 22 12 22C13 22 15 21.5 15 20V15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Wianek z polnych kwiatów / Dzika róża
 */
export function FlowerIcon({ size = 24, color = '#D9777F', secondaryColor = '#7E9F88', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Płatki kwiatka */}
      <Circle cx="12" cy="7.5" r="3" fill={color} opacity={0.85} />
      <Circle cx="16.5" cy="10.5" r="3" fill={color} opacity={0.85} />
      <Circle cx="15" cy="16" r="3" fill={color} opacity={0.85} />
      <Circle cx="9" cy="16" r="3" fill={color} opacity={0.85} />
      <Circle cx="7.5" cy="10.5" r="3" fill={color} opacity={0.85} />
      {/* Środek kwiatka */}
      <Circle cx="12" cy="12" r="2.8" fill="#F4D06F" />
      {/* Listek szałwii */}
      <Path d="M18 18C19.5 16.5 21 16 22 16C22 17 21.5 18.5 20 20C19 21 17.5 20.5 18 18Z" fill={secondaryColor} />
    </Svg>
  );
}

/**
 * Uroczy ptaszek (sylwetka rudzika/strzyżyka z logo)
 */
export function BirdIcon({ size = 24, color = '#D9777F', secondaryColor = '#E69C64', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Korpus i ogonek ptaszka */}
      <Path
        d="M2 17L7 15C8 17 11 18 14 17C17 16 19 13.5 19 10C19 7 17 5 14 5C12 5 10 6 9 8C7 9 6 12 7 15L2 17Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dziobek */}
      <Path d="M19 8L22 9L19 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Brzuszek ptaszka */}
      <Circle cx="12" cy="12" r="3.5" fill={secondaryColor} opacity={0.7} />
      {/* Oko */}
      <Circle cx="15.5" cy="7.5" r="1" fill={color} />
      {/* Nóżki na gałązce */}
      <Line x1="11" y1="18" x2="11" y2="21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="14" y1="18" x2="14" y2="21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Aparat fotograficzny z gałązką (konwerter zdjęć)
 */
export function CameraCraftIcon({ size = 24, color = '#D9777F', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M4 8H7L8.5 6H15.5L17 8H20C21.1 8 22 8.9 22 10V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V10C2 8.9 2.9 8 4 8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="14" r="3.5" stroke={color} strokeWidth={strokeWidth} />
      {/* Mały błysk obiektywu */}
      <Circle cx="13.5" cy="12.5" r="0.8" fill={color} />
      {/* Listek nad aparatem */}
      <Path d="M17 4C17.5 3 18.5 2.5 19.5 2.5C19.5 3.5 19 4.5 18 5C17.5 5 17 4.5 17 4Z" fill="#7E9F88" />
    </Svg>
  );
}

/**
 * Teczka ze schematami haftu
 */
export function PatternFolderIcon({ size = 24, color = '#D9777F', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M3 6C3 4.9 3.9 4 5 4H9L11 6H19C20.1 6 21 6.9 21 8V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wewnętrzny ścieg krzyżykowy */}
      <Line x1="10.5" y1="11.5" x2="13.5" y2="14.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="13.5" y1="11.5" x2="10.5" y2="14.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Koszyk rękodzielniczy / Sklep
 */
export function CraftShopIcon({ size = 24, color = '#D9777F', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Koszyk */}
      <Path
        d="M4 10H20L18 20H6L4 10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rączka koszyka */}
      <Path
        d="M8 10V6C8 4 9.5 3 12 3C14.5 3 16 4 16 6V10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Kłębek nici wystający z koszyka */}
      <Circle cx="10" cy="14" r="2" stroke={color} strokeWidth={1.4} />
      <Circle cx="14" cy="14" r="2" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

/**
 * Szpilka krawiecka z perełką (tryb parkowania)
 */
export function PearlPinIcon({ size = 24, color = '#D9777F', secondaryColor = '#E9B9BE', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* Perełka */}
      <Circle cx="17" cy="7" r="4" fill={secondaryColor} stroke={color} strokeWidth={strokeWidth} />
      {/* Trzon szpilki */}
      <Line x1="14" y1="10" x2="5" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Magiczna różdżka do usuwania confetti
 */
export function WandIcon({ size = 24, color = '#D9777F', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Line x1="4" y1="20" x2="16" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Błyski */}
      <Line x1="18" y1="4" x2="18" y2="8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="16" y1="6" x2="20" y2="6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="12" cy="5" r="1" fill={color} />
      <Circle cx="19" cy="12" r="1" fill={color} />
    </Svg>
  );
}

/**
 * Płomień passy hafciarskiej (Daily streak)
 */
export function HearthFlameIcon({ size = 20, color = '#E65100', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M12 2C9 7 6 9.5 6 14C6 17.5 8.7 20.5 12 20.5C15.3 20.5 18 17.5 18 14C18 9 14.5 6.5 12 2Z"
        fill={color}
        opacity={0.85}
      />
      <Path
        d="M12 11C10.5 13.5 10 14.5 10 16C10 17.2 10.9 18.2 12 18.2C13.1 18.2 14 17.2 14 16C14 14.5 13 13 12 11Z"
        fill="#FFE082"
      />
    </Svg>
  );
}

/**
 * Lupa ze znakiem powiększenia / pomniejszenia
 */
export function ZoomMagnifierIcon({ size = 20, type = 'in', color = '#5D4037', strokeWidth = 1.8, style }: IconProps & { type?: 'in' | 'out' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx="10.5" cy="10.5" r="6" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="15" y1="15" x2="20" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Znak minus */}
      <Line x1="7.5" y1="10.5" x2="13.5" y2="10.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Znak plus */}
      {type === 'in' && (
        <Line x1="10.5" y1="7.5" x2="10.5" y2="13.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      )}
    </Svg>
  );
}

/**
 * Strzałka cofania / ponawiania w formie ściegu
 */
export function StitchHistoryIcon({ size = 20, direction = 'undo', color = '#5D4037', strokeWidth = 1.8, style }: IconProps & { direction?: 'undo' | 'redo' }) {
  const isUndo = direction === 'undo';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {isUndo ? (
        <>
          <Path d="M9 7L4 12L9 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 12H14C17.5 12 20 14.5 20 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="3 2" />
        </>
      ) : (
        <>
          <Path d="M15 7L20 12L15 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 12H10C6.5 12 4 14.5 4 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="3 2" />
        </>
      )}
    </Svg>
  );
}

/**
 * Dokument PDF z motywem ściegu
 */
export function PdfStitchIcon({ size = 20, color = '#FFFFFF', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2V8H20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Symbol ściegu krzyżykowego na kartce */}
      <Line x1="9" y1="13" x2="13" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="13" y1="13" x2="9" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Rustykalny ornament botaniczny do oddzielania sekcji
 */
export function RusticDivider({ color = '#D9777F', secondaryColor = '#7E9F88', width = '100%', style }: { color?: string; secondaryColor?: string; width?: number | string; style?: any }) {
  return (
    <View style={[styles.dividerWrapper, style]}>
      <Svg width="100%" height={20} viewBox="0 0 300 20" preserveAspectRatio="xMidYMid meet">
        {/* Lewa nitka ściegowa */}
        <Line x1="10" y1="10" x2="120" y2="10" stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        {/* Lewe listki */}
        <Path d="M122 10C125 7 130 7 132 10C130 11 125 11 122 10Z" fill={secondaryColor} />
        <Path d="M125 10C127 13 132 13 134 10C132 9 127 9 125 10Z" fill={secondaryColor} />

        {/* Centralny kwiatek */}
        <Circle cx="150" cy="10" r="3.2" fill={color} />
        <Circle cx="150" cy="10" r="1.4" fill="#F4D06F" />
        <Circle cx="145" cy="10" r="1.8" fill={color} opacity={0.8} />
        <Circle cx="155" cy="10" r="1.8" fill={color} opacity={0.8} />
        <Circle cx="150" cy="5" r="1.8" fill={color} opacity={0.8} />
        <Circle cx="150" cy="15" r="1.8" fill={color} opacity={0.8} />

        {/* Prawe listki */}
        <Path d="M178 10C175 7 170 7 168 10C170 11 175 11 178 10Z" fill={secondaryColor} />
        <Path d="M175 10C173 13 168 13 166 10C168 9 173 9 175 10Z" fill={secondaryColor} />
        {/* Prawa nitka ściegowa */}
        <Line x1="180" y1="10" x2="290" y2="10" stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
      </Svg>
    </View>
  );
}

/**
 * Ramka zaznaczania ze ściegiem fastrygowym
 */
export function FrameBoxIcon({ size = 20, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="3 2"
      />
      <Circle cx="4" cy="4" r="1.5" fill={color} />
      <Circle cx="20" cy="4" r="1.5" fill={color} />
      <Circle cx="4" cy="20" r="1.5" fill={color} />
      <Circle cx="20" cy="20" r="1.5" fill={color} />
    </Svg>
  );
}

/**
 * Ołówek krawiecki do szkicowania ściegów
 */
export function PencilCraftIcon({ size = 20, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M18 2L22 6L7 21H3V17L18 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="14" y1="6" x2="18" y2="10" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Prujka hafciarska / Gumka
 */
export function EraserCraftIcon({ size = 20, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M6 18L15 9L19 13L10 22H5L2 19L6 15L10 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="12" x2="7" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Wiaderko z barwnikiem / Wypełnianie obszaru
 */
export function FillBucketIcon({ size = 20, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M19 11L13 5L4 14C3 15 3 16.5 4 17.5L8.5 22C9.5 23 11 23 12 22L19 15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5 2L15 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Kropla barwnika */}
      <Circle cx="20" cy="18" r="2" fill={color} />
    </Svg>
  );
}

/**
 * Ścieg krzyżykowy X
 */
export function CrossStitchIcon({ size = 18, color = '#5D4037', strokeWidth = 2, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Line x1="4" y1="4" x2="16" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="16" y1="4" x2="4" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Glif symbolu hafciarskiego
 */
export function SymbolGlyphIcon({ size = 18, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="10" y1="5" x2="10" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="6" y1="10" x2="14" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Paleta malarska / barw mulin
 */
export function ColorPaletteIcon({ size = 18, color = '#5D4037', strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d="M10 2C5.58 2 2 5.58 2 10C2 13.5 4.5 16.5 8 17.5C8.5 17.6 9 17.2 9 16.7V15.5C9 14.7 9.7 14 10.5 14H12C15.3 14 18 11.3 18 8C18 4.7 14.4 2 10 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="6" cy="8" r="1.2" fill={color} />
      <Circle cx="9" cy="6" r="1.2" fill={color} />
      <Circle cx="13" cy="7" r="1.2" fill={color} />
    </Svg>
  );
}

/**
 * Kłódka blokowania przewijania
 */
export function LockCraftIcon({ size = 18, locked = true, color = '#5D4037', strokeWidth = 1.8, style }: IconProps & { locked?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Rect x="4" y="9" width="12" height="9" rx="2" stroke={color} strokeWidth={strokeWidth} />
      {locked ? (
        <Path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      ) : (
        <Path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      )}
      <Circle cx="10" cy="13.5" r="1" fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  dividerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});
