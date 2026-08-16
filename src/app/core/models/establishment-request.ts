export type EstablishmentRequestStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';


export interface CreateEstablishmentRequest {

    placeId: string;

    businessName: string;

    businessAddress: string;

    businessPhone?: string;

    businessType?: string;

    description?: string;
}


export interface EstablishmentRequestResponse {

    id: string;

    userId: string;

    userName: string;

    userEmail: string;

    placeId: string;

    businessName: string;

    businessAddress: string;

    businessPhone?: string;

    businessType?: string;

    description?: string;

    status: EstablishmentRequestStatus;

    reviewedBy?: string;

    reviewComment?: string;

    reviewedAt?: string;

    createdAt: string;

    updatedAt: string;
}


export interface ReviewEstablishmentRequest {

    status: 'APPROVED' | 'REJECTED';

    comment?: string;
}