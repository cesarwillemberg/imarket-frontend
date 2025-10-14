import { useSession } from '@/src/providers/SessionContext/Index';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

interface UseEmailChangeProps {
  currentEmail: string;
  onEmailChangeSuccess?: () => void;
}

export const useEmailChange = ({ currentEmail, onEmailChangeSuccess }: UseEmailChangeProps) => {
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { changeEmail, signOut } = useSession();
  const router = useRouter();

  const handleEmailChange = async (newEmail: string): Promise<boolean> => {
    // Se o email não mudou, não fazer nada
    if (newEmail === currentEmail) {
      console.log("📧 Email não mudou, ignorando...", { newEmail, currentEmail });
      return false;
    }

    console.log("📧 Email mudou, iniciando processo...", { newEmail, currentEmail });

    return new Promise((resolve) => {
      setIsChangingEmail(true);
      
      const showConfirmation = () => {
        Alert.alert(
          "Alterar Email",
          `Deseja alterar seu email para ${newEmail}?\n\nUm email de confirmação será enviado para o novo endereço.`,
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => {
                console.log("📧 Usuário cancelou alteração de email");
                setIsChangingEmail(false);
                resolve(false);
              }
            },
            {
              text: "Confirmar",
              onPress: () => {
                console.log("📧 Usuário confirmou alteração, iniciando processo...");
                processEmailChange(newEmail, resolve);
              }
            }
          ]
        );
      };

      const processEmailChange = async (email: string, resolve: (value: boolean) => void) => {
        try {
          console.log("📧 Chamando changeEmail...");
          await changeEmail(email);
          console.log("✅ changeEmail executado com sucesso");
          setPendingEmail(email);
          
          Alert.alert(
            "Email Alterado",
            `Email de verificação enviado para ${email}.\n\nVocê será deslogado para confirmar o novo email. Após confirmar, faça login novamente.`,
            [
              {
                text: "OK",
                onPress: async () => {
                  console.log("📧 Usuário confirmou logout, executando signOut...");
                  onEmailChangeSuccess?.();
                  setIsChangingEmail(false);
                  
                  try {
                    await signOut();
                    console.log("📧 SignOut executado com sucesso, redirecionando...");
                    router.replace("/confirmemailscreen");
                    resolve(true);
                  } catch (error) {
                    console.error("❌ Erro ao fazer logout:", error);
                    router.replace("/signin");
                    resolve(true);
                  }
                }
              }
            ]
          );
          
        } catch (error: any) {
          console.error("❌ Erro ao alterar email:", error);
          setIsChangingEmail(false);
          Alert.alert(
            "Erro",
            error.message || "Erro ao alterar email. Tente novamente.",
            [{ 
              text: "OK", 
              onPress: () => resolve(false)
            }]
          );
        }
      };

      // Chamar confirmação
      showConfirmation();
    });
  };

  const resetPendingEmail = () => {
    setPendingEmail(null);
  };

  return {
    handleEmailChange,
    isChangingEmail,
    pendingEmail,
    resetPendingEmail,
    hasEmailChanged: (newEmail: string) => newEmail !== currentEmail
  };
};
