import { View, TouchableOpacity } from 'react-native';
import { NavProps, TBusiness } from '../../types/types';
import { useState, useEffect } from 'react';
import BusinessesListModern from '../../components/lists/business/BusinessesListModern';
import { useAppSelector } from '../../store/app/hooks';
import { TextNormalYambiHighColor, TextSmallYambiGray } from '../../components/app/Text';
import { strings } from '../../lang/lang';
import * as RootNavigation from '../../services/Navigation_ref';
import { remote_host } from '../../../GlobalVariables';
import axios from 'axios';

const BusinessViewModern = ({ route }: NavProps) => {
    const { business } = route.params;
    const theme = useAppSelector(state=>state.app_theme);
    const [subscriberCount, setSubscriberCount] = useState<number>(0);
    
    // Wrap the single business in an array for BusinessesListModern
    const [businesses] = useState<TBusiness[]>([business]);
    const [currentBusinessIndex] = useState<number>(0);

    useEffect(() => {
        if (business?._id) {
            fetchSubscriberCount();
        }
    }, [business?._id]);

    const fetchSubscriberCount = async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_subscriptions", {
                business_id: business._id
            });

            if (res.data.success === "1") {
                setSubscriberCount(res.data.count || 0);
            }
        } catch (error) {
            console.error("Error fetching subscriber count:", error);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor:theme.colors.background, borderTopColor: theme.colors.border, borderTopWidth:1 }}>
            {/* {subscriberCount > 0 && (
                <TouchableOpacity
                    onPress={() => {
                        RootNavigation.navigate("BusinessSubscribers", { business_id: business._id });
                    }}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 15,
                        paddingVertical: 12,
                        backgroundColor: theme.colors.border,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }}>
                    <TextSmallYambiGray text={strings.followers} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextNormalYambiHighColor text={subscriberCount.toString()} bold styles={{ marginRight: 8 }} />
                        <TextSmallYambiGray text="→" />
                    </View>
                </TouchableOpacity>
            )} */}
            <BusinessesListModern
                businesses={businesses}
                currentBusinessIndex={currentBusinessIndex}
                onBusinessSwitch={(index) => {
                    // No-op since we only have one business
                }}
                isAdmin={true}
            />
        </View>
    );
};

export default BusinessViewModern;
