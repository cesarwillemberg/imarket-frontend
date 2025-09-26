import { Title } from "@/src/components/common/Title";
import { useTheme } from "@/src/themes/ThemeContext";
import { FC } from "react";
import { Image, View } from "react-native";
import createStyles from "./styled";


interface Props {
    name?: string;
    pathImage?: string;
}

const ProfilePictureandName: FC<Props> = ({ name, pathImage}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <>
            <View style={styles.wrapper}>
                <View style={{marginBottom: 10}}>
                    { pathImage ? (
                        <Image 
                            source={{uri: pathImage}}
                            style={styles.img}
                        />    
                    ) : (
                        <Image 
                            source={
                                require("@/src/assets/images/profile/profile_img_default.jpg")
                            }
                            style={styles.img}
                        />    
                    )}
                </View>
                {name ? (
                    <Title style={styles.title}>{name}</Title>
                ) : ("")}
            </View>
        </>
    )
}

export default ProfilePictureandName;