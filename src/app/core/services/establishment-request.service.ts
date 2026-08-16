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
    CreateEstablishmentRequest,
    EstablishmentRequestResponse,
    ReviewEstablishmentRequest
} from '../models/establishment-request';


@Injectable({
    providedIn: 'root'
})
export class EstablishmentRequestService {

    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/establishment-requests';


    // =====================================================
    // CREAR SOLICITUD
    // =====================================================

    createRequest(
        request: CreateEstablishmentRequest
    ): Observable<EstablishmentRequestResponse> {

        return this.http.post<EstablishmentRequestResponse>(
            this.apiUrl,
            request
        );
    }


    // =====================================================
    // MIS SOLICITUDES
    // =====================================================

    getMyRequests():
        Observable<EstablishmentRequestResponse[]> {

        return this.http.get<EstablishmentRequestResponse[]>(
            `${this.apiUrl}/me`
        );
    }


    // =====================================================
    // SOLICITUDES PENDIENTES
    // =====================================================

    getPendingRequests():
        Observable<EstablishmentRequestResponse[]> {

        return this.http.get<EstablishmentRequestResponse[]>(
            `${this.apiUrl}/pending`
        );
    }


    // =====================================================
    // REVISAR SOLICITUD
    // =====================================================

    reviewRequest(
        id: string,
        request: ReviewEstablishmentRequest
    ): Observable<EstablishmentRequestResponse> {

        return this.http.patch<EstablishmentRequestResponse>(
            `${this.apiUrl}/${id}/review`,
            request
        );
    }
}