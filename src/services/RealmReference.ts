// realmReference.js
import { useRef } from 'react';

const realmReference = {
    ref: null,
};

// A function to initialize the realmRef if needed
export const initRealmRef = () => {
    if (!realmReference.ref) {
        realmReference.ref = useRef(null); // Initialize only once
    }
    return realmReference.ref;
};

export default realmReference;

