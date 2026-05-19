import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { ViewStyle } from 'react-native';

interface IIconApp {
    name: string;
    color: string;
    pack: string;
    styles?: ViewStyle,
    size: number
}

export const IconApp: React.FC<IIconApp> = ({ name, color, pack, styles, size }) => {

    // const theme = useAppSelector(state => state.app_theme);
    // const app_description = useAppSelector(state => state.persisted_app.app_description);

    if (pack === "FA") {
        return (
            <FontAwesome name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "FI") {
        return (
            <Feather name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "FA5") {
        return (
            <FontAwesome5 name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "FA6") {
        return (
            <FontAwesome6 name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "IO") {
        return (
            <Ionicons name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "MC") {
        return (
            <MaterialCommunityIcons name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "MT") {
        return (
            <MaterialIcons name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "ET") {
        return (
            <Entypo name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "AD") {
        return (
            <AntDesign name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "OC") {
        return (
            <Octicons name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "FO") {
        return (
            <Fontisto name={name} style={styles} color={color} size={size} />
        )
    } else if (pack === "SLI") {
        return (
            <SimpleLineIcons name={name} style={styles} color={color} size={size} />
        )
    }
    else {
        return null;
    }
}