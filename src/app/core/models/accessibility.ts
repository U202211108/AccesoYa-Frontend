export type AccessibilityLevel =
    | 'YES'
    | 'NO'
    | 'PARTIAL'
    | 'UNKNOWN';


export interface Accessibility {

    id: string;

    placeId: string;

    entrance: AccessibilityLevel;

    ramps: AccessibilityLevel;

    elevator: AccessibilityLevel;

    accessibleRestroom: AccessibilityLevel;

    accessibleParking: AccessibilityLevel;

    signage: AccessibilityLevel;

    braille: AccessibilityLevel;

    tactilePath: AccessibilityLevel;

    observations?: string;

    createdAt: string;

    updatedAt: string;
}


export interface UpdateAccessibilityRequest {

    entrance: AccessibilityLevel;

    ramps: AccessibilityLevel;

    elevator: AccessibilityLevel;

    accessibleRestroom: AccessibilityLevel;

    accessibleParking: AccessibilityLevel;

    signage: AccessibilityLevel;

    braille: AccessibilityLevel;

    tactilePath: AccessibilityLevel;

    observations?: string;
}