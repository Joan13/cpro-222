/**
 * Formats a number to remove trailing zeros after decimal point
 * @param amount - The amount to format (can be string or number)
 * @returns Formatted string without trailing zeros
 */
export const formatAmount = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    
    // If it's a whole number, return without decimals
    if (num % 1 === 0) {
        return num.toString();
    }
    
    // Remove trailing zeros
    return num.toString().replace(/\.?0+$/, '');
};
