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

import {
    PlaceDetailResponse
} from '../models/place-detail-response';

import {
    FlmNocFilterResponse
} from '../models/flm-noc-filter-response';


@Injectable({
    providedIn: 'root'
})
export class PlaceService {

    private readonly http =
        inject(HttpClient);

    private readonly apiUrl =
        'http://localhost:8080/api/places';


    // =====================================================
    // OBTENER SITIOS FLM / NOC PARA EL MAPA
    // =====================================================

    getPlacesForMap(
        minLatitude: number,
        maxLatitude: number,
        minLongitude: number,
        maxLongitude: number,
        zoom: number
    ): Observable<PlaceMapResponse[]> {

        const params = new HttpParams()
            .set('minLatitude', minLatitude)
            .set('maxLatitude', maxLatitude)
            .set('minLongitude', minLongitude)
            .set('maxLongitude', maxLongitude)
            .set('zoom', zoom);

        return this.http.get<PlaceMapResponse[]>(
            `${this.apiUrl}/map`,
            {
                params
            }
        );
    }


    // =====================================================
    // OBTENER DETALLE FLM / NOC
    // =====================================================

    getPlaceById(
        id: string
    ): Observable<PlaceDetailResponse> {

        return this.http.get<PlaceDetailResponse>(
            `${this.apiUrl}/${id}`
        );
    }


    // =====================================================
    // BUSCAR FLM / NOC EN EL MAPA
    // =====================================================

    searchPlacesForMap(
        query: string
    ): Observable<PlaceMapResponse[]> {

        const params = new HttpParams()
            .set('query', query.trim());

        return this.http.get<PlaceMapResponse[]>(
            `${this.apiUrl}/map/search`,
            {
                params
            }
        );
    }


    // =====================================================
    // OBTENER FILTROS FLM / NOC
    // =====================================================

    getFlmNocFilters(): Observable<FlmNocFilterResponse> {

        return this.http.get<FlmNocFilterResponse>(
            `${this.apiUrl}/flm-noc/filters`
        );
    }

}