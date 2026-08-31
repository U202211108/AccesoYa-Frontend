export type NotificationType =
    | 'SITE_CREATED'
    | 'SITE_UPDATED'
    | 'SITE_STATUS_CHANGED'
    | 'FLM_NOC_UPDATED'
    | 'PLAN_DOCUMENT_UPLOADED'
    | 'PLAN_DOCUMENT_UPDATED'
    | 'SYSTEM';

export interface Notification {

    id: string;

    userId: string;

    type: NotificationType;

    title: string;

    message: string;

    read: boolean;

    createdAt: string;
}