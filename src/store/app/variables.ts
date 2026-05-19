import { useAppSelector } from "./hooks";

export const app_theme = useAppSelector(state=>state.app_theme);
export const app_description = useAppSelector(state=>state.persisted_app.app_description);
// export const contacts = useAppSelector(state=>state.contacts);
