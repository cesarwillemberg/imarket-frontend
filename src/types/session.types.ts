// Types para o contexto de sessão
import { UserInfo } from '@/src/services/auth-service';
import { Session, User } from '@supabase/supabase-js';

export interface ISessionContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isFirstAccess: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: ISignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  getInfoUser: (id: string) => Promise<UserInfo>;
  updateProfile: (input: IUpdateProfileData) => Promise<{ dataUpdate: any; errorUpdate: any }>;
  updateProfilePicture: (input: IUploadPictureData) => Promise<string>;
  removeProfilePicture: (storageFilePath: string) => Promise<boolean>;
}

export interface ISignUpData {
  name: string;
  phone: string;
  email: string;
  password: string;
  cpf: string;
  date_birth: string;
}

export interface IUpdateProfileData {
  id?: string;
  profile_picture?: string;
  name?: string;
  cpf?: string;
  date_birth?: string;
  phone?: string;
  email?: string;
}

export interface IUploadPictureData {
  localFilePath: string;
  storageFilePath: string;
}
