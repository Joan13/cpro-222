import moment from "moment";
import { strings } from "./src/lang/lang";
import { TContact, TUser } from "./src/types/types";
import { io } from "socket.io-client";
import { createAudioPlayer } from "expo-audio";
import Clipboard from '@react-native-clipboard/clipboard';
import parsePhoneNumberFromString from "libphonenumber-js";
import { DateTime } from "luxon";

// const oo = new Realm({ schema: [UserBusinessItems, ItemPrices], schemaVersion:6 });

// export const getDateFormat = (date: string, lang: string, flag?: number) => {
//     if (!date) return "";

//     const dt = DateTime.fromISO(date).setLocale(lang);

//     if (flag && flag === 1) {
//         return dt.toLocaleString(); // Format ISO : "YYYY-MM-DD"
//     } else {
//         return dt.toLocaleString(DateTime.DATE_FULL); // Format local complet, ex : "13 octobre 2025"
//     }
// };

function localeSupported(locale: string) {
    try {
        const supported = Intl.DateTimeFormat.supportedLocalesOf([locale]);
        return supported.length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * True when remote app_version_code is strictly greater than local (e.g. package.json `version`).
 * Expects dotted numeric codes such as "2.46.90"; each segment is compared with parseFloat.
 */
export const isRemoteAppVersionNewer = (remoteVersion: string, localVersion: string): boolean => {
    const r = remoteVersion.trim().split(".").map((s) => parseFloat(s) || 0);
    const l = localVersion.trim().split(".").map((s) => parseFloat(s) || 0);
    const n = Math.max(r.length, l.length);
    for (let i = 0; i < n; i++) {
        const rv = r[i] ?? 0;
        const lv = l[i] ?? 0;
        if (rv > lv) return true;
        if (rv < lv) return false;
    }
    return false;
};

export const getDateFormat = (date: string, lang: string, flag?: number) => {
    if (!date) return "";

    try {
        let ll = lang;

        if (lang === "sw_drc" || lang === "swcd") {
            ll = "fr";
        }

        const dt = DateTime.fromISO(date).setLocale(localeSupported(ll) ? ll : "en");

        // Si flag === 1 → format simple YYYY-MM-DD
        if (flag === 1) {
            return dt.toFormat("yyyy-MM-dd");
        }

        // Sinon → format local complet, ex : "13 octobre 2025"
        return dt.toLocaleString(DateTime.DATE_FULL);
    } catch (e) {
        // Fallback if Intl/ICU classes are unavailable on this device
        return DateTime.fromISO(date).toFormat("yyyy-MM-dd");
    }
};


export const getHourFormat = (date: string, lang: string, flag?: number) => {
    if (!date) return "";

    try {
        let ll = lang;

        if (lang === "sw_drc" || lang === "swcd") {
            ll = "fr";
        }

        const dt = DateTime.fromISO(date).setLocale(localeSupported(ll) ? ll : "en");

        // Format par défaut : heures + minutes
        let format = DateTime.TIME_SIMPLE;

        // Si flag === 1 → inclure les secondes
        if (flag === 1) {
            format = {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            };
        }

        return dt.toLocaleString(format);
    } catch (e) {
        // Fallback if Intl/ICU classes are unavailable on this device
        return DateTime.fromISO(date).toFormat(flag === 1 ? "HH:mm:ss" : "HH:mm");
    }
};

export const renderDateUpToMilliseconds = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();
    const hh = today.getHours();
    const minutes = today.getMinutes();
    const seconds = today.getSeconds();
    const milliseconds = today.getMilliseconds();

    return yyyy + "" + mm + "" + dd + "" + hh + "" + minutes + "" + seconds + "" + milliseconds;
}

export const formatPhoneInternational = (user_data: TUser) => {
    try {
        const countryCode = typeof user_data.country === 'string' && /^[A-Z]{2}$/.test(user_data.country)
            ? user_data.country as import('libphonenumber-js').CountryCode
            : undefined;
        const phoneNumber = parsePhoneNumberFromString(user_data.phone_number, { defaultCountry: countryCode });
        if (phoneNumber) {
            return phoneNumber.formatInternational();
        }
    } catch (error) { }
    return user_data.phone_number;
};

const isYesterday = (date: string) => {
    const yesterday = moment().subtract(1, 'days').startOf('day');
    return moment(date).isSame(yesterday, 'day');
};

export const renderDateTime = (date: string, full: number, condensed: boolean, showHoursIfToday?: boolean) => {
    if (full === 0) {
        if (moment(date).format("L") === moment().format("L")) {
            if (showHoursIfToday) {
                return moment(date).format("LT");
            } else {
                return strings.today;
            }
        } else if (isYesterday(date)) {
            return strings.yesterday;
        } else {
            return moment(date).format(condensed ? "L" : "LL");
        }
    } else if (full === 1) {
        if (moment(date).format("L") === moment().format("L")) {
            return strings.today + " " + strings.at.toLowerCase() + " " + moment(date).format("HH:mm");
        } else if (isYesterday(date)) {
            return strings.yesterday + "" + " " + strings.at.toLowerCase() + " " + moment(date).format("HH:mm");
        } else {
            return moment(date).format(condensed ? "L" : "LL") + " " + strings.at.toLowerCase() + " " + moment(date).format("HH:mm");
        }
    } else if (full === 2) {
        return moment(date).format(condensed ? "L" : "LL") + " " + strings.at.toLowerCase() + " " + moment(date).format("HH:mm");
    } else {
        return moment(date).format(condensed ? "L" : "LL");
    }
}

export const renderBusinessUserLevel = (level: number) => {
    if (level === 1) {
        return strings.owner;
    } else if (level === 2) {
        return strings.salesforce_manager;
    } else if (level === 3) {
        return strings.sale_operator;
    } else {
        return "";
    }
}

export const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
};

export const default_profile = "require('./src/assets/profile_black.jpg')";

// export const remote_host = 'http://192.168.43.146:3452';
// export const remote_host_server = 'http://192.168.43.146';
// export const remote_host_web_socket = 'ws://192.168.43.146:3453';
// export const media_url = 'http://192.168.43.146/backnode/media'

export const remote_host = 'https://server.yambi.net';
export const remote_host_server = 'https://server.yambi.net';
export const remote_host_web_socket = 'wss://server.yambi.net';
export const media_url = 'https://server.yambi.net/media'

// export const remote_host = 'http://147.79.114.220:3452';
// export const remote_host_server = 'http://147.79.114.220';
// export const remote_host_web_socket = 'ws://147.79.114.220:3453';
// export const media_url = 'https://server.yambi.net/backnode/media'

// export const remote_host = 'http://10.42.0.1:3452'; 
// export const remote_host_server = 'http://10.42.0.1';
// export const remote_host_web_socket = 'http://10.42.0.1:3453';
// export const media_url = 'https://server.yambi.net/backnode/media'

// export const remote_host = 'http://192.168.0.113:3452'; 
// export const remote_host_server = 'http://192.168.0.113';
// export const remote_host_web_socket = 'http://192.168.0.113:3453';
// export const media_url = 'http://192.168.0.113/backnode/media'

export const SocketApp = io(remote_host_server, {
    path: "/ws"
});

//   export const SocketApp = io(remote_host_web_socket);

export const randomString = (length: number) => {
    for (var s = ''; s.length < length; s += 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.random() * 62 | 0));
    return s;
}

export const randomInt = (length: number) => {
    for (var s = ''; s.length < length; s += '0123456789'.charAt(Math.random() * 62 | 0));
    return s;
}

export const months = (month: string) => {
    if (month === '1' || month === '01') {
        return strings.january;
    } else if (month === '2' || month === '02') {
        return strings.february;
    } else if (month === '3' || month === '03') {
        return strings.march;
    } else if (month === '4' || month === '04') {
        return strings.april;
    } else if (month === '5' || month === '05') {
        return strings.may;
    } else if (month === '6' || month === '06') {
        return strings.june;
    } else if (month === '7' || month === '07') {
        return strings.july;
    } else if (month === '8' || month === '08') {
        return strings.august;
    } else if (month === '9' || month === '09') {
        return strings.september;
    } else if (month === '10') {
        return strings.october;
    } else if (month === '11') {
        return strings.november;
    } else if (month === '12') {
        return strings.december;
    } else {
        return "";
    }
}

export const displayDate = (d: string, lang: string) => {
    let year = d.substr(6, 4);
    let month = d.substr(3, 2);
    let day = d.substr(0, 2);

    if (lang === "en") {
        return months(month) + " " + day + ", " + year;
    } else if (lang === "fr" || lang === "sw_drc") {
        return "Le " + day + " " + months(month) + " " + year;
    } else {
        return months(month) + " " + day + ", " + year;
    }
};

export const displayDateSmall = (d: string, lang: string) => {
    let year = d.substr(6, 4);
    let month = d.substr(3, 2);
    let day = d.substr(0, 2);

    if (lang === "en") {
        return month + "/" + day + "/" + year;
    } else if (lang === "fr" || lang === "sw_drc") {
        return day + "/" + month + "/" + year;
    } else {
        return month + "/" + day + "/" + year;
    }
};

// const user_session_exists = async () => {
//     try {
//         const yambi_user_connected = await AsyncStorage.getItem('yambi_user_connected');
//         if (yambi_user_connected === '1') { return true; }
//     } catch (e) { return false; }
//     return false;
// };

export const removeWhiteSpaces = (number: string) => {
    let number_return = number.replace(' ', '');
    number_return = number_return.replace(' ', '');
    number_return = number_return.replace(' ', '');
    number_return = number_return.replace(' ', '');
    number_return = number_return.replace(' ', '');
    number_return = number_return.replace(' ', '');
    return number_return;
}

export const removeDuplicateNumbers = (contacts: Array<TContact>) => {
    const arrUniq = [...new Map(contacts.map(v => [v.phoneNumber, v])).values()];
    return arrUniq;
}

export const renderCategoryName = (categoryID: number) => {
    if (categoryID === 1) {
        return strings.retail;
    } else if (categoryID === 2) {
        return strings.manufacturing;
    } else if (categoryID === 3) {
        return strings.healthcare;
    } else if (categoryID === 4) {
        return strings.technology;
    } else if (categoryID === 5) {
        return strings.finance;
    } else if (categoryID === 6) {
        return strings.education;
    } else if (categoryID === 7) {
        return strings.hospitality;
    } else if (categoryID === 8) {
        return strings.real_estate;
    } else if (categoryID === 9) {
        return strings.entertainment;
    } else if (categoryID === 10) {
        return strings.transportation;
    } else if (categoryID === 11) {
        return strings.energy;
    } else if (categoryID === 12) {
        return strings.agriculture;
    } else if (categoryID === 13) {
        return strings.fashion_textile;
    } else if (categoryID === 14) {
        return strings.communication_media;
    } else if (categoryID === 15) {
        return strings.food_beverages;
    } else if (categoryID === 16) {
        return strings.business_services;
    } else if (categoryID === 17) {
        return strings.biotechnology;
    } else {
        return strings.telecommunications;
    }
}

export const renderCurrency = (currencyID: number, full: boolean) => {
    // Existing currencies (1-6)
    if (currencyID === 1) {
        return full ? "CDF" + " (" + strings.cdf_full + ")" : "CDF";
    } else if (currencyID === 2) {
        return full ? "USD" + " (" + strings.usd_full + ")" : "USD";
    } else if (currencyID === 3) {
        return full ? "EUR" + " (" + strings.eur_full + ")" : "EUR";
    } else if (currencyID === 4) {
        return full ? "FCFA" + " (" + strings.fcfa_full + ")" : "FCFA";
    } else if (currencyID === 5) {
        return full ? "FBU" + " (" + strings.fbu_full + ")" : "FBU";
    } else if (currencyID === 6) {
        return full ? "FRW" + " (" + strings.frw_full + ")" : "FRW";
    }
    // African currencies (7-30)
    else if (currencyID === 7) {
        return full ? "ZAR" + " (" + strings.zar_full + ")" : "ZAR";
    } else if (currencyID === 8) {
        return full ? "NGN" + " (" + strings.ngn_full + ")" : "NGN";
    } else if (currencyID === 9) {
        return full ? "EGP" + " (" + strings.egp_full + ")" : "EGP";
    } else if (currencyID === 10) {
        return full ? "KES" + " (" + strings.kes_full + ")" : "KES";
    } else if (currencyID === 11) {
        return full ? "GHS" + " (" + strings.ghs_full + ")" : "GHS";
    } else if (currencyID === 12) {
        return full ? "TZS" + " (" + strings.tzs_full + ")" : "TZS";
    } else if (currencyID === 13) {
        return full ? "UGX" + " (" + strings.ugx_full + ")" : "UGX";
    } else if (currencyID === 14) {
        return full ? "MAD" + " (" + strings.mad_full + ")" : "MAD";
    } else if (currencyID === 15) {
        return full ? "ETB" + " (" + strings.etb_full + ")" : "ETB";
    } else if (currencyID === 16) {
        return full ? "XOF" + " (" + strings.xof_full + ")" : "XOF";
    } else if (currencyID === 17) {
        return full ? "AOA" + " (" + strings.aoa_full + ")" : "AOA";
    } else if (currencyID === 18) {
        return full ? "MUR" + " (" + strings.mur_full + ")" : "MUR";
    } else if (currencyID === 19) {
        return full ? "TND" + " (" + strings.tnd_full + ")" : "TND";
    } else if (currencyID === 20) {
        return full ? "ZMW" + " (" + strings.zmw_full + ")" : "ZMW";
    } else if (currencyID === 21) {
        return full ? "BWP" + " (" + strings.bwp_full + ")" : "BWP";
    } else if (currencyID === 22) {
        return full ? "MZN" + " (" + strings.mzn_full + ")" : "MZN";
    } else if (currencyID === 23) {
        return full ? "NAD" + " (" + strings.nad_full + ")" : "NAD";
    } else if (currencyID === 24) {
        return full ? "MWK" + " (" + strings.mwk_full + ")" : "MWK";
    } else if (currencyID === 25) {
        return full ? "SZL" + " (" + strings.szl_full + ")" : "SZL";
    } else if (currencyID === 26) {
        return full ? "LSL" + " (" + strings.lsl_full + ")" : "LSL";
    } else if (currencyID === 27) {
        return full ? "SCR" + " (" + strings.scr_full + ")" : "SCR";
    } else if (currencyID === 28) {
        return full ? "DZD" + " (" + strings.dzd_full + ")" : "DZD";
    } else if (currencyID === 29) {
        return full ? "LYD" + " (" + strings.lyd_full + ")" : "LYD";
    } else if (currencyID === 30) {
        return full ? "SDG" + " (" + strings.sdg_full + ")" : "SDG";
    }
    // Worldwide currencies (31-50)
    else if (currencyID === 31) {
        return full ? "GBP" + " (" + strings.gbp_full + ")" : "GBP";
    } else if (currencyID === 32) {
        return full ? "JPY" + " (" + strings.jpy_full + ")" : "JPY";
    } else if (currencyID === 33) {
        return full ? "CNY" + " (" + strings.cny_full + ")" : "CNY";
    } else if (currencyID === 34) {
        return full ? "CHF" + " (" + strings.chf_full + ")" : "CHF";
    } else if (currencyID === 35) {
        return full ? "CAD" + " (" + strings.cad_full + ")" : "CAD";
    } else if (currencyID === 36) {
        return full ? "AUD" + " (" + strings.aud_full + ")" : "AUD";
    } else if (currencyID === 37) {
        return full ? "INR" + " (" + strings.inr_full + ")" : "INR";
    } else if (currencyID === 38) {
        return full ? "BRL" + " (" + strings.brl_full + ")" : "BRL";
    } else if (currencyID === 39) {
        return full ? "RUB" + " (" + strings.rub_full + ")" : "RUB";
    } else if (currencyID === 40) {
        return full ? "KRW" + " (" + strings.krw_full + ")" : "KRW";
    } else if (currencyID === 41) {
        return full ? "MXN" + " (" + strings.mxn_full + ")" : "MXN";
    } else if (currencyID === 42) {
        return full ? "SGD" + " (" + strings.sgd_full + ")" : "SGD";
    } else if (currencyID === 43) {
        return full ? "HKD" + " (" + strings.hkd_full + ")" : "HKD";
    } else if (currencyID === 44) {
        return full ? "NOK" + " (" + strings.nok_full + ")" : "NOK";
    } else if (currencyID === 45) {
        return full ? "SEK" + " (" + strings.sek_full + ")" : "SEK";
    } else if (currencyID === 46) {
        return full ? "DKK" + " (" + strings.dkk_full + ")" : "DKK";
    } else if (currencyID === 47) {
        return full ? "PLN" + " (" + strings.pln_full + ")" : "PLN";
    } else if (currencyID === 48) {
        return full ? "THB" + " (" + strings.thb_full + ")" : "THB";
    } else if (currencyID === 49) {
        return full ? "AED" + " (" + strings.aed_full + ")" : "AED";
    } else if (currencyID === 50) {
        return full ? "SAR" + " (" + strings.sar_full + ")" : "SAR";
    } else {
        return "";
    }
}

export const PlayActionSound = async (index: number) => {
    const playShortActionSound = (source: number) => {
        const player = createAudioPlayer(source, { updateInterval: 250 });
        player.play();
        setTimeout(() => {
            try {
                player.remove();
            } catch (error) { }
        }, 2500);
    };

    if (index === 1) {
        // Vibration.vibrate(25);
        // playShortActionSound(require('./src/assets/sounds/Double_Pop.mp3'));
    }

    if (index === 2) {
        // Vibration.vibrate(10);
        playShortActionSound(require('./src/assets/sounds/Single_Pop.mp3'));
    }

    if (index === 3) {
        // Vibration.vibrate(25);
        playShortActionSound(require('./src/assets/sounds/Triple_Pop.mp3'));
    }

    if (index === 4) {
        // Vibration.vibrate(10);
        playShortActionSound(require('./src/assets/sounds/Double_Pop.mp3'));
    }

    if (index === 5) {
        // Vibration.vibrate(25);
        // playShortActionSound(require('./src/assets/sounds/Double_Pop.mp3'));
    }
};

export const global_currencies: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

