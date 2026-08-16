import { AccessibilityStatus } from './accessibility-status';

export interface PlaceAccessibilityResponse {

    wheelchairAccess: AccessibilityStatus;

    accessibleEntrance: AccessibilityStatus;

    accessibleParking: AccessibilityStatus;

    accessibleBathroom: AccessibilityStatus;

    elevator: AccessibilityStatus;

    accessibleRoute: AccessibilityStatus;

    signage: AccessibilityStatus;

    assistance: AccessibilityStatus;
}