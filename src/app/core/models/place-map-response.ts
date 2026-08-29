import { PlaceStatus } from './place-status';
import { PlaceType } from './place-type';
import { FlmNocData } from './flm-noc-data';

export interface PlaceMapResponse {

    id: string;

    externalId?: string;

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

    flmNoc?: FlmNocData;
}