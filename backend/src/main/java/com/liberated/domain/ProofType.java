package com.liberated.domain;

/**
 * How the user proves an activity on-device. The backend only ever stores a
 * boolean completion flag; the proof content itself never leaves the phone.
 * This enum drives which Tracking Page form the mobile app renders.
 */
public enum ProofType {
    PHOTO, // capture / pick an image
    NAMED_LIST, // fill N text fields (e.g. names of friends)
    TEXT_ENTRY, // free-text reflection
    TIMER, // start/stop, log minutes
    COUNTER, // increment / checklist
    HONOR_TOGGLE // single "I did it" confirmation (weak proof)
}
