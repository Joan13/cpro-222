import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Slider } from '@expo/ui/swift-ui';

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
  step,
  onValueChange,
  onSlidingComplete,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Slider
        value={value}
        min={minimumValue}
        max={maximumValue}
        step={step}
        onValueChange={onValueChange}
        onEditingChanged={isEditing => {
          if (!isEditing && onSlidingComplete) {
            onSlidingComplete(value);
          }
        }}
      />
    </View>
  );
};

export default AppSlider;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
  },
  sliderStyle: {
    width: '100%',
    height: 44,
  },
});
