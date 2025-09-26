// Hook personalizado para operações de autenticação
import { supabase } from '@/src/lib/supabase';
import authService, { UserInfo } from '@/src/services/auth-service';
import { useState } from 'react';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      return await authService.signIn({ email, password });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
    cpf: string;
    date_birth: string;
  }) => {
    setIsLoading(true);
    try {
      return await authService.signUp(input);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getInfoUser = async (id: string): Promise<UserInfo> => {
    setIsLoading(true);
    try {
      return await authService.getInfoUser({ id });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (input: {
    id?: string;
    profile_picture?: string;
    name?: string;
    cpf?: string;
    date_birth?: string;
    phone?: string;
    email?: string;
  }) => {
    setIsLoading(true);
    try {
      // Ajustar para a interface esperada pelo authService
      const profileData = {
        userInfo: {
          id: input.id,
          nome: input.name,
          cpf: input.cpf,
          data_nascimento: input.date_birth,
          telefone: input.phone,
          email: input.email,
        },
        profilePictureUrl: input.profile_picture || ''
      };
      return await authService.updateProfile(profileData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePicture = async (input: {
    localFilePath: string;
    storageFilePath: string;
  }): Promise<string> => {
    setIsLoading(true);
    try {
      return await authService.UploadProfilePicture(input);
    } finally {
      setIsLoading(false);
    }
  };

  const removeProfilePicture = async (storageFilePath: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      return await authService.RemoveProfilePicture({ storageFilePath });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    getInfoUser,
    updateProfile,
    updateProfilePicture,
    removeProfilePicture,
    isLoading,
  };
};
