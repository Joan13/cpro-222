import { View, Pressable } from "react-native";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { IconApp } from "../app/IconApp";
import { NavProps } from "../../types/types";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { useState } from "react";
import ModalApp from "../app/ModalApp";
import { YambiText } from "../app/Text";
import { strings } from "../../lang/lang";
import { useRealm, useObject } from "@realm/react";
import { Expenses } from "../../store/database/Models";
import { SocketApp } from "../../../GlobalVariables";
import moment from "moment";
import { setLoadingButton } from "../../store/reducers/appSlice";

const HeaderRightExpense = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    
    // Get expense_id from route params
    const expense_id = route.params?.expense_id;
    const expense = useObject(Expenses, expense_id);

    const handleDelete = () => {
        if (!expense) return;

        dispatch(setLoadingButton(true));

        const deletedExpense = {
            ...expense,
            expense_active: 0,
            uploaded: 0,
            updatedAt: moment(new Date()).format()
        };

        try {
            realm.write(() => {
                try {
                    realm.create('Expenses', deletedExpense, true);
                } catch (error) {
                    console.log(error);
                }
            });

            // Emit to server for sync
            SocketApp.emit("expensesChanged", JSON.stringify({ phone_number: user_data.phone_number, items: [deletedExpense] }));

            setTimeout(() => {
                dispatch(setLoadingButton(false));
                dispatch(setShowModalApp(false));
                setShowDeleteModal(false);
                navigation.goBack();
            }, 300);
        } catch (error) {
            console.log(error);
            dispatch(setLoadingButton(false));
        }
    };

    // Check if we're on Expense page (not EditExpense) to show edit button
    const isExpensePage = route.name === 'Expense';

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {isExpensePage && (
                <Pressable
                    onPress={() => {
                        navigation.navigate('EditExpense', { expense_id });
                    }}
                    style={{
                        height: 30,
                        width: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10
                    }}
                >
                    <IconApp pack="FI" name="edit" size={20} color={theme.text_design1} />
                </Pressable>
            )}
            <Pressable
                onPress={() => {
                    dispatch(setShowModalApp(true));
                    setShowDeleteModal(true);
                }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                }}
            >
                <IconApp pack="FI" name="trash-2" size={20} color={theme.error || theme.high_color} />
            </Pressable>

            {showDeleteModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowDeleteModal(false);
                    }}
                    singleButton={false}
                    title={strings.delete || "Delete"}
                    onAction={handleDelete}
                    onCancel={() => {
                        dispatch(setShowModalApp(false));
                        setShowDeleteModal(false);
                    }}
                    textAction={strings.delete || "Delete"}
                    textCancel={strings.cancel || "Cancel"}
                >
                    <YambiText
                        text={(strings as any).delete_expense_confirmation || "Are you sure you want to delete this expense? This action cannot be undone."}
                        size="normal"
                        color="default"
                        style={{ textAlign: 'center', marginBottom: 20 }}
                    />
                </ModalApp>
            )}
        </View>
    );
};

export default HeaderRightExpense;
