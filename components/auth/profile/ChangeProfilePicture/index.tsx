import { Button } from "@/components/common/Button";
import { Subtitle } from "@/components/common/subtitle/Index";
import { useTheme } from "@/themes/ThemeContext";
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Dispatch, FC, SetStateAction } from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import ProfielPictureAndName from "../ProfilePictureandName";
import createStyles from "./styled";


interface Props {
    image: string | null;
    modalVisible: boolean;
    setImage: Dispatch<SetStateAction<string | null>>;
    setModalVisible: () => Dispatch<SetStateAction<boolean>>;
    openImageOptions: () => void;

}

const ChangeProfilePicture: FC<Props> = ({ 
    image, 
    modalVisible, 
    openImageOptions, 
    setModalVisible, 
    setImage

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
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
        setModalVisible(false);
    };



    return (
        <>
            <TouchableOpacity onPress={openImageOptions}>
                {
                    image === null ? (
                        <ProfielPictureAndName />
                    ) : ( 
                        <ProfielPictureAndName  pathImage={image}/>
                    )
                }
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                
            >
                <View style={styles.modalContainer}>
                        <View>
                            <Subtitle align="center">Escolha uma opção para carregar a foto de perfil</Subtitle>
                        </View>
                    <View style={styles.modalContent}>
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
                            title="Cancelar" 
                            onPress={() => setModalVisible(false)} 
                            variant="outline" 
                        />
                    </View>
                </View>
            </Modal>
        </>
    )
}

export default ChangeProfilePicture;