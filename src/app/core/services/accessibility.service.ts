import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    Accessibility,
    UpdateAccessibilityRequest
} from '../models/accessibility';


@Injectable({
    providedIn: 'root'
})
export class AccessibilityService {


    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/places';


    // =====================================================
    // OBTENER ACCESIBILIDAD
    // =====================================================

    getAccessibility(
        placeId: string
    ): Observable<Accessibility> {

        return this.http.get<Accessibility>(
            `${this.apiUrl}/${placeId}/accessibility`
        );
    }


    // =====================================================
    // ACTUALIZAR ACCESIBILIDAD
    // =====================================================

    updateAccessibility(
        placeId: string,
        request: UpdateAccessibilityRequest
    ): Observable<Accessibility> {

        return this.http.put<Accessibility>(
            `${this.apiUrl}/${placeId}/accessibility`,
            request
        );
    }
}