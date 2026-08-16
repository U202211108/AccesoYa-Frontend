import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient,
    HttpParams
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    PlaceMapResponse
} from '../models/place-map-response';

import { PlaceDetailResponse } from '../models/place-detail-response';

import { PlaceAccessibilityResponse } from '../models/place-accessibility-response';

import { UpdatePlaceAccessibilityRequest } from '../models/update-place-accessibility-request';
import { PlaceSearchResponse } from '../models/place-search-response';

@Injectable({
    providedIn: 'root'
})
export class PlaceService {

    private readonly http =
        inject(HttpClient);

    private readonly apiUrl =
        'http://localhost:8080/api/places';

    getPlacesForMap(
        minLatitude: number,
        maxLatitude: number,
        minLongitude: number,
        maxLongitude: number,
        zoom: number
    ): Observable<PlaceMapResponse[]> {

        const params = new HttpParams()
            .set(
                'minLatitude',
                minLatitude
            )
            .set(
                'maxLatitude',
                maxLatitude
            )
            .set(
                'minLongitude',
                minLongitude
            )
            .set(
                'maxLongitude',
                maxLongitude
            )
            .set(
                'zoom',
                zoom
            );

        return this.http.get<PlaceMapResponse[]>(
            `${this.apiUrl}/map`,
            { params }
        );
    }

    getPlaceById(
        id: string
    ): Observable<PlaceDetailResponse> {

        return this.http.get<PlaceDetailResponse>(
            `${this.apiUrl}/${id}`
        );
    }

    updateAccessibility(
        id: string,
        request: UpdatePlaceAccessibilityRequest
    ): Observable<PlaceAccessibilityResponse> {

        return this.http.put<PlaceAccessibilityResponse>(
            `${this.apiUrl}/${id}/accessibility`,
            request
        );
    }

    searchAvailablePlaces(
        name: string,
        page: number = 0,
        size: number = 10
    ): Observable<PlaceSearchResponse> {

        return this.http.get<PlaceSearchResponse>(
            `${this.apiUrl}/available`,
            {
                params: {
                    name,
                    page,
                    size
                }
            }
        );
    }

    getMyPlaces(): Observable<PlaceMapResponse[]> {

        return this.http.get<PlaceMapResponse[]>(
            `${this.apiUrl}/me`
        );
    }
}