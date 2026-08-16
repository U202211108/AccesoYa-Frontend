import { PlaceType } from './place-type';

export interface PlaceSearchItem {

    id: string;

    name: string;

    description?: string;

    address?: string;

    department?: string;

    province?: string;

    district?: string;

    latitude: number;

    longitude: number;

    type: PlaceType;

    classification?: string;

    establishmentType?: string;

    category?: string;

    phone?: string;

    openingHours?: string;

    imageUrl1?: string;

    imageUrl2?: string;

    imageUrl3?: string;
}


export interface PlaceSearchResponse {

    content: PlaceSearchItem[];

    page: number;

    size: number;

    totalElements: number;

    totalPages: number;
}