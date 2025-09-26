import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { FC } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Icon, IconName, IconType } from "../Icon";
import createStyles from "./styled";


type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

interface Props {
    title: string;
    iconName: IconName;
    iconType: IconType;
    linkPage: string;
    params?: Json;
}

const ProfileButton: FC<Props> = (props) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();

    const handleOnPress = () => {
    const paramsToSend = props.params ? { data: JSON.stringify(props.params) } : undefined;

    router.push({
        pathname: props.linkPage,
        params: paramsToSend,
    });
    };
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.link_wrapper} onPress={handleOnPress}>
                <View style={styles.button_wrapper}>
                    <View style={styles.icon_title_wrapper}>
                        <Icon 
                            name={props.iconName}
                            type={props.iconType} 
                            color={theme.colors.text} 
                            size={30}
                        />
                        <Text style={styles.title}>
                            {props.title}
                        </Text>
                    </View>
                    <Icon 
                        name="chevron-right" 
                        type="feather" 
                        size={30} 
                        color={theme.colors.text}   
                    />
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default ProfileButton;