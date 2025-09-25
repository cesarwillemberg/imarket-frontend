import { useTheme } from '@/themes/ThemeContext';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import PhoneInputLib, { ICountry, isValidPhoneNumber } from 'react-native-international-phone-number';
import createStyles from './styled';

// Props interface for the component
interface PhoneInputProps {
  value?: string;
  onChangePhoneNumber?: (phoneNumber: string) => void;
  label?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  defaultValue?: string;
  selectedCountry?: ICountry | null;
  onChangeSelectedCountry?: (country: ICountry) => void;
  [key: string]: any; // For additional props passed to PhoneInputLib
}

// Ref interface for exposed methods
interface PhoneInputRef {
  focus: () => void;
  blur: () => void;
  isValid: () => boolean;
  getFullNumber: () => string;
  selectedCountry: ICountry | null;
}

// Define max digits per country (expand conforme necessário)
const maxDigitsPerCountry: Record<string, number> = {
  BR: 11,
  US: 10,
  IN: 10,
  GB: 10,
};

const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(
  (
    {
      value,
      onChangePhoneNumber,
      label = 'TELEFONE',
      style,
      inputStyle,
      labelStyle,
      onSubmitEditing,
      onFocus,
      returnKeyType = 'next',
      defaultValue,
      selectedCountry,
      onChangeSelectedCountry,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [inputValue, setInputValue] = useState<string>(value || defaultValue || '');
    const [currentCountry, setCurrentCountry] = useState<ICountry | null>(selectedCountry || null);

    // Sync external value changes
    useEffect(() => {
      setInputValue(value ? String(value) : '');
    }, [value]);

    const handleInputValue = useCallback((phoneNumber: string) => {
      setInputValue(phoneNumber);
      onChangePhoneNumber?.(phoneNumber);
    }, [onChangePhoneNumber]);

    const handleSelectedCountry = useCallback((country: ICountry) => {
      setCurrentCountry(country);
      onChangeSelectedCountry?.(country);
      // Reformat current input if needed
      if (inputValue && typeof inputValue === 'string') {
        const digitsOnly = inputValue.replace(/\D/g, '');
        const maxDigits = maxDigitsPerCountry[country.code] || 15;
        const truncated = digitsOnly.slice(0, maxDigits);
        const fullNumber = `${country.idd.root} ${truncated}`;
        onChangePhoneNumber?.(fullNumber);
        setInputValue(truncated);
      }
    }, [inputValue, onChangeSelectedCountry, onChangePhoneNumber]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        // Focus logic if the lib exposes it
      },
      blur: () => {
        // Blur logic if needed
      },
      isValid: () => currentCountry ? isValidPhoneNumber(inputValue, currentCountry) : false,
      getFullNumber: () => currentCountry ? `${currentCountry.idd.root} ${inputValue}` : inputValue,
      selectedCountry: currentCountry,
    }), [inputValue, currentCountry]);

    return (
      <PhoneInputLib
        defaultValue={defaultValue}
        value={inputValue}
        onChangePhoneNumber={handleInputValue}
        selectedCountry={currentCountry}
        onChangeSelectedCountry={handleSelectedCountry}
        maxLength={currentCountry ? maxDigitsPerCountry[currentCountry.code] || 15 : 15} 
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        returnKeyType={returnKeyType}
        placeholder="Telefone"
        phoneInputPlaceholderTextColor="#999"
        language="por"
        phoneInputStyles={{
          container: styles.inputContainer,
          input: styles.input,
          callingCode: styles.callingCode,
          flagContainer: styles.flagContainer,
          flag: styles.flag,
          divider: styles.divider,
          caret: styles.caret,
        }}
        modalStyles={{
          container: {
            backgroundColor: 'white',
            borderRadius: 10,
          },
          content: {
            padding: 20,
          },
        }}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;

// Export utility functions for external use
export { getAllCountries, getCountryByPhoneNumber, ICountry, isValidPhoneNumber } from 'react-native-international-phone-number';

