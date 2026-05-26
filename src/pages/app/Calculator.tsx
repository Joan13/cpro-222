import { View, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAppSelector } from '../../store/app/hooks';
import { TextBigYambi, TextNormalYambiHighColor, TextSmallYambiGray, YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import StatusBarYambi from '../../components/app/StatusBar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const Calculator = ({}: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operation, setOperation] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [calculationExpression, setCalculationExpression] = useState<string>('');

    const formatNumber = (num: number): string => {
        // Format number to remove unnecessary trailing zeros for floats
        if (num % 1 === 0) {
            return num.toString();
        }
        // Keep up to 10 decimal places but remove trailing zeros
        return num.toString().replace(/\.?0+$/, '');
    };

    const handleNumberPress = (num: string) => {
        if (waitingForOperand) {
            setDisplay(num);
            setWaitingForOperand(false);
            setCalculationExpression('');
        } else {
            setDisplay(display === '0' ? num : display + num);
        }
    };

    const handleOperationPress = (nextOperation: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operation);
            const formattedValue = formatNumber(newValue);

            setDisplay(formattedValue);
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
        setCalculationExpression('');
    };

    const calculate = (firstValue: number, secondValue: number, operation: string): number => {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '×':
                return firstValue * secondValue;
            case '÷':
                return secondValue !== 0 ? firstValue / secondValue : 0;
            default:
                return secondValue;
        }
    };

    const handleEquals = () => {
        const inputValue = parseFloat(display);

        if (previousValue !== null && operation) {
            const newValue = calculate(previousValue, inputValue, operation);
            const formattedValue = formatNumber(newValue);
            const formattedPrev = formatNumber(previousValue);
            const formattedInput = formatNumber(inputValue);
            
            // Show the full calculation expression
            setCalculationExpression(`${formattedPrev} ${operation} ${formattedInput} =`);
            setDisplay(formattedValue);
            setPreviousValue(null);
            setOperation(null);
            setWaitingForOperand(true);
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
        setCalculationExpression('');
    };

    const handleDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const Button = ({ 
        onPress, 
        text, 
        style = {}, 
        textStyle = {},
        icon,
        iconPack,
        iconSize = 24,
        useBadgeColor = false
    }: { 
        onPress: () => void; 
        text?: string; 
        style?: any;
        textStyle?: any;
        icon?: string;
        iconPack?: string;
        iconSize?: number;
        useBadgeColor?: boolean;
    }) => (
        <Pressable
            onPress={onPress}
            style={[
                {
                    flex: 1,
                    height: 70,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 16,
                    margin: 6,
                    backgroundColor: style.backgroundColor || theme.colors.border,
                },
                style,
            ]}
        >
            {icon ? (
                <IconApp pack={iconPack || 'FI'} name={icon} size={iconSize} color={textStyle.color || theme.colors.text} />
            ) : useBadgeColor ? (
                <YambiText 
                    text={text || ''} 
                    bold 
                    size="normal"
                    color="badge"
                    style={{
                        fontSize: 28,
                        ...textStyle
                    }} 
                />
            ) : (
                <TextNormalYambiHighColor 
                    text={text || ''} 
                    bold 
                    styles={{
                        fontSize: 28,
                        color: textStyle.color || theme.colors.high_color,
                        ...textStyle
                    }} 
                />
            )}
        </Pressable>
    );

    return (
        <SafeAreaView style={[{ backgroundColor: theme.colors.background, flex: 1 }, StyleSheet.absoluteFill]}>
            <StatusBarYambi />
            <View style={{ flex: 1, padding: 15 }}>
                {/* Display */}
                <Animated.View 
                    entering={FadeIn.duration(300)}
                    style={{
                        flex: 1,
                        backgroundColor: theme.colors.border,
                        borderRadius: 20,
                        padding: 25,
                        marginBottom: 20,
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end',
                        
                    }}
                >
                    {/* Calculation Expression */}
                    {calculationExpression && (
                        <TextSmallYambiGray 
                            text={calculationExpression} 
                            styles={{ 
                                fontSize: 18, 
                                marginBottom: 8,
                                opacity: 0.7 
                            }} 
                        />
                    )}
                    {/* Current Operation Preview */}
                    {!calculationExpression && previousValue !== null && operation && (
                        <TextSmallYambiGray 
                            text={`${formatNumber(previousValue)} ${operation}`} 
                            styles={{ 
                                fontSize: 18, 
                                marginBottom: 8,
                                opacity: 0.6 
                            }} 
                        />
                    )}
                    {/* Main Display */}
                    <TextBigYambi 
                        text={display} 
                        bold 
                        styles={{ 
                            fontSize: 52, 
                            color: theme.colors.text,
                            textAlign: 'right',
                        }} 
                    />
                </Animated.View>

                {/* Buttons Grid - Takes remaining space */}
                <View style={{ flex: 3 }}>
                    {/* Row 1: Clear, Backspace, Divide */}
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Button
                            onPress={handleClear}
                            text="C"
                            style={{ backgroundColor: theme.colors.error + '20' }}
                            textStyle={{ color: theme.colors.error }}
                        />
                        <Button
                            onPress={handleBackspace}
                            icon="delete"
                            iconPack="FI"
                            style={{ backgroundColor: theme.colors.gray + '20' }}
                            textStyle={{ color: '#000000' }}
                        />
                        <Button
                            onPress={() => handleOperationPress('÷')}
                            text="÷"
                            style={{ backgroundColor: theme.colors.high_color + '20' }}
                            textStyle={{ color: theme.colors.high_color }}
                        />
                    </View>

                    {/* Row 2: 7, 8, 9, Multiply */}
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Button onPress={() => handleNumberPress('7')} text="7" />
                        <Button onPress={() => handleNumberPress('8')} text="8" />
                        <Button onPress={() => handleNumberPress('9')} text="9" />
                        <Button
                            onPress={() => handleOperationPress('×')}
                            text="×"
                            style={{ backgroundColor: theme.colors.high_color + '20' }}
                            textStyle={{ color: theme.colors.high_color }}
                        />
                    </View>

                    {/* Row 3: 4, 5, 6, Subtract */}
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Button onPress={() => handleNumberPress('4')} text="4" />
                        <Button onPress={() => handleNumberPress('5')} text="5" />
                        <Button onPress={() => handleNumberPress('6')} text="6" />
                        <Button
                            onPress={() => handleOperationPress('-')}
                            text="−"
                            style={{ backgroundColor: theme.colors.high_color + '20' }}
                            textStyle={{ color: theme.colors.high_color }}
                        />
                    </View>

                    {/* Row 4: 1, 2, 3, Add */}
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Button onPress={() => handleNumberPress('1')} text="1" />
                        <Button onPress={() => handleNumberPress('2')} text="2" />
                        <Button onPress={() => handleNumberPress('3')} text="3" />
                        <Button
                            onPress={() => handleOperationPress('+')}
                            text="+"
                            style={{ backgroundColor: theme.colors.high_color + '20' }}
                            textStyle={{ color: theme.colors.high_color }}
                        />
                    </View>

                    {/* Row 5: 0, Decimal, Equals */}
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <View style={{ flex: 2, marginRight: 6 }}>
                            <Button onPress={() => handleNumberPress('0')} text="0" />
                        </View>
                        <Button
                            onPress={handleDecimal}
                            text="."
                            style={{ flex: 1 }}
                        />
                        <Button
                            onPress={handleEquals}
                            text="="
                            useBadgeColor={true}
                            style={{ 
                                flex: 1,
                                backgroundColor: theme.colors.badge_background_color,
                            }}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Calculator;
