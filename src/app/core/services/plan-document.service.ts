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
    PlanDocumentResponse
} from '../models/plan-document-response';


@Injectable({
    providedIn: 'root'
})
export class PlanDocumentService {

    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/places';


    // =====================================================
    // LISTAR PLANOS
    // =====================================================

    getPlans(
        placeId: string
    ): Observable<PlanDocumentResponse[]> {

        return this.http.get<PlanDocumentResponse[]>(
            `${this.apiUrl}/${placeId}/plans`
        );
    }


    // =====================================================
    // SUBIR DOCUMENTO
    // =====================================================

    uploadPlan(
        placeId: string,
        file: File
    ): Observable<PlanDocumentResponse> {

        const formData =
            new FormData();

        formData.append(
            'file',
            file
        );

        return this.http.post<PlanDocumentResponse>(
            `${this.apiUrl}/${placeId}/plans`,
            formData
        );
    }


    // =====================================================
    // OBTENER URL DEL ARCHIVO ORIGINAL
    // =====================================================

    getPlanUrl(
        placeId: string,
        planId: string
    ): string {

        return `${this.apiUrl}/${placeId}/plans/${planId}`;
    }


    // =====================================================
    // OBTENER ARCHIVO ORIGINAL AUTENTICADO
    // =====================================================

    getPlanFile(
        placeId: string,
        planId: string
    ): Observable<Blob> {

        return this.http.get(
            `${this.apiUrl}/${placeId}/plans/${planId}`,
            {
                responseType: 'blob'
            }
        );
    }


    // =====================================================
    // OBTENER VISTA PREVIA
    // =====================================================

    getPlanPreview(
        placeId: string,
        planId: string
    ): Observable<Blob> {

        return this.http.get(
            `${this.apiUrl}/${placeId}/plans/${planId}/preview`,
            {
                responseType: 'blob'
            }
        );
    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    deletePlan(
        placeId: string,
        planId: string
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/${placeId}/plans/${planId}`
        );
    }

}