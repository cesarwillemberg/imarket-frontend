import { useTheme } from '@/src/themes/ThemeContext';
import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { Input } from '../Input';
import createStyles from './styled';

interface EmailInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmitEditing?: () => void;
  scrollToInput?: (ref: React.RefObject<any>) => void;
  passwordRef?: React.RefObject<any>;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onValueChange,
  onSubmitEditing,
  scrollToInput,
  passwordRef,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const inputEmailRef = useRef<any>(null);
  const [emailError, setEmailError] = useState<string>('');

  const validateEmail = (emailText: string): boolean => {
    const regex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(emailText);
  };

  const handleEmailChange = (text: string): void => {
    onValueChange(text);
    if (text.trim() === '') {
      setEmailError('');
    } else if (!validateEmail(text)) {
      setEmailError('Email inválido. Ex: exemplo@exemplo.com');
    } else {
      setEmailError('');
    }
  };

  return (
    <>
      <Input
        placeholder="exemplo@exemplo.com"
        ref={inputEmailRef}
        onSubmitEditing={onSubmitEditing || (() => {
          passwordRef?.current?.focus();
          scrollToInput?.(passwordRef);
        })}
        onFocus={() => scrollToInput?.(inputEmailRef)}
        inputMode="email"
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={handleEmailChange}
        returnKeyType="next"
        errorMessage={emailError}
        style={[
          styles.input,
          emailError ? { borderColor: 'red' } : { borderColor: 'gray' },
        ]}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
    </>
  );
};

export default EmailInput;
