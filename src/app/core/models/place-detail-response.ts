import { PlaceStatus } from './place-status';
import { PlaceType } from './place-type';
import { PlaceAccessibilityResponse } from './place-accessibility-response';

export interface PlaceDetailResponse {

    id: string;

    name: string;

    description?: string;

    address?: string;

    department?: string;

    province?: string;

    district?: string;

    ubigeo?: string;

    latitude: number;

    longitude: number;

    type: PlaceType;

    source: string;

    status: PlaceStatus;

    classification?: string;

    establishmentType?: string;

    category?: string;

    phone?: string;

    openingHours?: string;

    sourceStatus?: string;

    imageUrl1?: string;

    imageUrl2?: string;

    imageUrl3?: string;

    accessibility: PlaceAccessibilityResponse;

    createdAt: string;

    updatedAt: string;
}