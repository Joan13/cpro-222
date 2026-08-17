import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { Host, Slider } from '@expo/ui/jetpack-compose';
import { width as composeWidth, height as composeHeight } from '@expo/ui/jetpack-compose/modifiers';
import { useAppSelector } from '../../store/app/hooks';

export interface AppSliderProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange: (val: number) => void;
  onSlidingComplete?: (val: number) => void;
  style?: any;
}

export const AppSlider: React.FC<AppSliderProps> = ({
  value,
  minimumValue = 0,
  maximumValue = 100,
  onValueChange,
  onSlidingComplete,
  style,
}) => {
  const theme = useAppSelector(state => state.app_theme);
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(windowWidth - 40);

  const activeColor = theme.colors.button_background_color || theme.colors.high_color || '#3B82F6';
  const inactiveColor = theme.colors.border || 'rgba(255, 255, 255, 0.2)';

  const handleLayout = (evt: LayoutChangeEvent) => {
    const w = evt.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(w);
    }
  };

  const sliderWidth = Math.max(100, containerWidth);

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      <Host style={{ width: sliderWidth, height: 44 }}>
        <Slider
          value={value}
          min={minimumValue}
          max={maximumValue}
          onValueChange={onValueChange}
          onValueChangeFinished={() => {
            if (onSlidingComplete) onSlidingComplete(value);
          }}
          modifiers={[composeWidth(sliderWidth), composeHeight(44)]}
          colors={{
            thumbColor: activeColor,
            activeTrackColor: activeColor,
            inactiveTrackColor: inactiveColor,
          }}
        />
      </Host>
    </View>
  );
};

export default AppSlider;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
