import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { FC } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Icon, IconName, IconType } from "../Icon";
import createStyles from "./styled";



interface Props {
    title: string;
    iconName: IconName;
    iconType: IconType;
    linkPage: string;
}

const ProfileButton: FC<Props> = (props) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.link_wrapper} onPress={() => router.push(props.linkPage)}>
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