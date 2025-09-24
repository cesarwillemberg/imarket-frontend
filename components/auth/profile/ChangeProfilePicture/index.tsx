import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Subtitle } from "@/components/common/subtitle/Index";
import { useTheme } from "@/themes/ThemeContext";
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { FC } from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import ProfilePictureandName from "../ProfilePictureandName";
import createStyles from "./styled";


interface Props {
    image: string | null;
    modalVisible: boolean;
    setImage: (uri: string) => void;
    setModalVisible: (visible: boolean) => void;
    openImageOptions: () => void;
}

const ChangeProfilePicture: FC<Props> = ({ 
    image, 
    modalVisible, 
    openImageOptions, 
    setModalVisible, 
    setImage,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        return status === 'granted';
    };

    const requestLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    };

    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
        setModalVisible(false);
    }

    const pickImage = async () => {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true,
        });
        
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
        setModalVisible(false);
    };

    const handelRemovePhoto = async () => {
        setImage("");
        setModalVisible(false);
    }


    return (
        <View style={{width: "50%"}}>
            <TouchableOpacity onPress={openImageOptions} style={{ justifyContent: "center", alignItems: "center" }}>
                <View style={{ position: 'relative' }}>
                    <ProfilePictureandName pathImage={image || undefined} />
                    
                    {/* Ícone sobreposto */}
                    <View style={{
                        position: 'absolute',
                        bottom: 0,      // canto inferior da imagem
                        right: 0,
                        padding: 6,
                    }}>
                        <Icon type="fontawesome" name="pencil" size={25} color={theme.colors.text} />
                    </View>
                </View>
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View>
                            <Subtitle align="center">Escolha uma opção para carregar a foto de perfil</Subtitle>
                        </View>
                        <Button 
                            style={styles.optionButton}
                            title="Tirar Foto" 
                            onPress={takePhoto} 
                        />
                        <Button 
                            style={styles.optionButton}
                            title="Escolher da Galeria"  
                            onPress={pickImage} 
                        />
                        <Button 
                            style={styles.optionButton}
                            title="Remover Foto de Perfil" 
                            onPress={handelRemovePhoto} 
                            variant="outline" 
                        />
                        <Button 
                            style={styles.optionButton}
                            title="Cancelar" 
                            onPress={() => setModalVisible(false)} 
                            variant="outline" 
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default ChangeProfilePicture;