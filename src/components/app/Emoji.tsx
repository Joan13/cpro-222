import { Pressable, Text } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { memo, useCallback } from "react";

const Emoji = ({ item, selectEmoji }: { item, selectEmoji }) => {

    // const sel = createSelector(state=>state.app.message_selected, state=>state.app);

    const app_theme = useAppSelector(state => state.app_theme);

    console.log(item.emoji)

    const pressEmoji=useCallback(()=> {
        selectEmoji(item.emoji);
    },[])

    return(
        <Pressable style={{ flex:1, justifyContent:'center', alignItems:'center', height: 40}} onPress={pressEmoji}>
       <Text style={{color:'black', fontSize: 20}}>{item.emoji}</Text>
     </Pressable>
    )
}

export default memo(Emoji);

