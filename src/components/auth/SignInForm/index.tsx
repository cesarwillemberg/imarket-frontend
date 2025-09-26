// Versão refatorada do SignInForm com melhor organização e tratamento de erros
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { Input } from '@/src/components/common/Input';
import InputPassword from '@/src/components/common/InputPassword';
import { Subtitle } from '@/src/components/common/subtitle';
import ThemedCheckbox from '@/src/components/common/ThemedCheckbox';
import { Title } from '@/src/components/common/Title/index';
import { useSession } from '@/src/providers/SessionContext/Index';
import { useTheme } from '@/src/themes/ThemeContext';

import createStyles from './styled';

interface IFormData {
  email: string;
  password: string;
}

interface IFormState {
  isLoading: boolean;
  keepLoggedIn: boolean;
  showPassword: boolean;
}

export const SignInForm = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signIn } = useSession();

  // Form data
  const [formData, setFormData] = useState<IFormData>({
    email: '',
    password: '',
  });

  // Form state
  const [formState, setFormState] = useState<IFormState>({
    isLoading: false,
    keepLoggedIn: false,
    showPassword: false,
  });

  const passwordRef = useRef<TextInput>(null);

  // Handlers
  const updateFormData = useCallback((field: keyof IFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFormState = useCallback((field: keyof IFormState, value: boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua senha');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return false;
    }
    return true;
  };

  const handleSignIn = useCallback(async () => {
    if (!validateForm()) return;

    updateFormState('isLoading', true);
    
    try {
      await signIn(formData.email, formData.password);
      // Reset form on success
      setFormData({ email: '', password: '' });
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Erro', 'Falha no login. Verifique suas credenciais.');
    } finally {
      updateFormState('isLoading', false);
    }
  }, [formData, signIn, updateFormState]);

  const togglePasswordVisibility = useCallback(() => {
    updateFormState('showPassword', !formState.showPassword);
  }, [formState.showPassword, updateFormState]);

  return (
    <View>
      <Title align="center" style={{ marginBottom: 0 }}>
        Entrar
      </Title>
      <Subtitle align="center">Por favor, faça login com a sua conta</Subtitle>
      
      <View style={styles.input_group}>
        <Text style={styles.label}>EMAIL</Text>
        <Input
          placeholder="Email"
          inputMode="email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      <View style={styles.input_group}>
        <Text style={styles.label}>SENHA</Text>
        <InputPassword
          placeholder="Password"
          value={formData.password}
          onValueChange={(value) => updateFormData('password', value)}
          inputRef={passwordRef}
          returnKeyType="done"
          secureTextEntry={!formState.showPassword}
          onSubmitEditing={handleSignIn}
        />
      </View>

      <View style={styles.options_row}>
        <ThemedCheckbox
          label="mantenha-me conectado."
          checked={formState.keepLoggedIn}
          onChange={(checked) => updateFormState('keepLoggedIn', checked)}
        />
        <TouchableOpacity>
          <Text style={styles.forgot_password_text}>Esqueceu a senha?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submit_button_wrapper}>
        <Button
          title="ENTRAR"
          style={styles.login_button}
          onPress={handleSignIn}
          loading={formState.isLoading}
          disabled={formState.isLoading}
        />
      </View>
    </View>
  );
};
