
import loadingCart from "@/src/assets/animations/loading/loading-cart.json";
import { useTheme } from "@/src/themes/ThemeContext";
import LottieView from "lottie-react-native";
import { FC, RefObject } from "react";
import { StyleProp, ViewStyle } from "react-native";
import createStyles from "./styled";


interface LoadingIconProps {
    autoPlay?: boolean;
    refAnimationLoading?: RefObject<LottieView | null>;
    source?: number | { uri: string } | object;
    style?: StyleProp<ViewStyle>;
    loop?: boolean;
}

const LoadingIcon: FC<LoadingIconProps> = ({ autoPlay, loop, refAnimationLoading, source, style  }) => {
    const { theme } = useTheme();
    const styles =  createStyles(theme);
    return (
        <LottieView
            source={source ? source : loadingCart}
            style={[style]}
            loop={loop}
            autoPlay={autoPlay}
            ref={refAnimationLoading}
        />
    )
}

export default LoadingIcon