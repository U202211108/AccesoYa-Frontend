export type NotificationType =

    | 'USER_ROLE_CHANGED'

    | 'USER_STATUS_CHANGED'

    | 'SYSTEM';


export interface Notification {

    id: string;

    type: NotificationType;

    title: string;

    message: string;

    read: boolean;

    relatedEntityId?: string;

    relatedEntityType?: string;

    createdAt: string;
}