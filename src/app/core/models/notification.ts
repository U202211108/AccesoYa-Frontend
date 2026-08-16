export type NotificationType =
    | 'ESTABLISHMENT_REQUEST_CREATED'
    | 'ESTABLISHMENT_APPROVED'
    | 'ESTABLISHMENT_REJECTED'
    | 'ACCESSIBILITY_UPDATED'
    | 'ESTABLISHMENT_UPDATED'
    | 'SYSTEM';


export interface Notification {

    id: string;

    title: string;

    message: string;

    type: NotificationType;

    read: boolean;

    relatedEntityId?: string;

    relatedEntityType?: string;

    createdAt: string;
}