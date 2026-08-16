import { PlaceStatus } from './place-status';
import { PlaceType } from './place-type';

export interface PlaceMapResponse {

    id: string;

    name: string;

    latitude: number;

    longitude: number;

    type: PlaceType;

    status: PlaceStatus;

    source?: string;

    address?: string;

    phone?: string;

    openingHours?: string;

    category?: string;

    description?: string;

    establishmentType?: string;
}