import {
    Component,
    OnInit,
    inject,
    ChangeDetectorRef
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    Router
} from '@angular/router';

import {
    EstablishmentRequestService
} from '../../../core/services/establishment-request.service';

import {
    PlaceService
} from '../../../core/services/place.service';

import {
    PlaceSearchItem
} from '../../../core/models/place-search-response';

import {
    CreateEstablishmentRequest,
    EstablishmentRequestResponse
} from '../../../core/models/establishment-request';


@Component({
    selector: 'app-establishment-request',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './establishment-request.component.html',

    styleUrl:
        './establishment-request.component.scss'
})
export class EstablishmentRequestComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly router =
        inject(Router);

    private readonly requestService =
        inject(EstablishmentRequestService);

    private readonly placeService =
        inject(PlaceService);

    private readonly cdr =
        inject(ChangeDetectorRef);


    // =====================================================
    // BÚSQUEDA
    // =====================================================

    searchTerm = '';

    searchResults:
        PlaceSearchItem[] = [];

    selectedPlace:
        PlaceSearchItem | null = null;

    searching = false;


    // =====================================================
    // FORMULARIO
    // =====================================================

    businessPhone = '';

    businessType = '';

    description = '';


    // =====================================================
    // ESTADO DEL FORMULARIO
    // =====================================================

    submitting = false;

    success = false;

    errorMessage = '';


    // =====================================================
    // ESTADO DE SOLICITUD EXISTENTE
    // =====================================================

    checkingRequest = true;

    existingRequest:
        EstablishmentRequestResponse | null = null;

    hasPendingRequest = false;

    hasApprovedRequest = false;


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.checkExistingRequest();
    }


    // =====================================================
    // COMPROBAR SOLICITUDES EXISTENTES
    // =====================================================

    checkExistingRequest(): void {

        console.log(
            '🔎 Comenzando comprobación de solicitudes...'
        );

        this.checkingRequest = true;

        this.errorMessage = '';

        this.requestService
            .getMyRequests()
            .subscribe({

                next: requests => {

                    console.log(
                        '📋 Mis solicitudes:',
                        requests
                    );


                    const requestsList =
                        Array.isArray(requests)
                            ? requests
                            : [];


                    // =================================================
                    // BUSCAR SOLICITUD PENDIENTE
                    // =================================================

                    const pendingRequest =
                        requestsList.find(
                            request =>
                                request.status === 'PENDING'
                        );


                    if (pendingRequest) {

                        console.log(
                            '⏳ Solicitud pendiente encontrada:',
                            pendingRequest
                        );

                        this.existingRequest =
                            pendingRequest;

                        this.hasPendingRequest =
                            true;

                        this.hasApprovedRequest =
                            false;

                        this.checkingRequest =
                            false;

                        this.cdr.detectChanges();

                        return;
                    }


                    // =================================================
                    // BUSCAR SOLICITUD APROBADA
                    // =================================================

                    const approvedRequest =
                        requestsList.find(
                            request =>
                                request.status === 'APPROVED'
                        );


                    if (approvedRequest) {

                        console.log(
                            '✅ Solicitud aprobada encontrada:',
                            approvedRequest
                        );

                        this.existingRequest =
                            approvedRequest;

                        this.hasApprovedRequest =
                            true;

                        this.hasPendingRequest =
                            false;

                        this.checkingRequest =
                            false;

                        this.cdr.detectChanges();

                        return;
                    }


                    // =================================================
                    // NO EXISTE SOLICITUD
                    // =================================================

                    console.log(
                        '🟢 Usuario puede enviar una solicitud.'
                    );


                    this.existingRequest =
                        null;

                    this.hasPendingRequest =
                        false;

                    this.hasApprovedRequest =
                        false;


                    this.checkingRequest = false;

                    console.log(
                        '🔓 checkingRequest:',
                        this.checkingRequest
                    );

                    this.cdr.detectChanges();

                },


                error: error => {

                    console.error(
                        '❌ Error consultando solicitudes:',
                        error
                    );


                    this.existingRequest =
                        null;

                    this.hasPendingRequest =
                        false;

                    this.hasApprovedRequest =
                        false;


                    // Aunque falle la consulta,
                    // no debemos dejar la pantalla bloqueada
                    this.checkingRequest =
                        false;


                    if (error.status === 401) {

                        this.errorMessage =
                            'Tu sesión ha expirado. Inicia sesión nuevamente.';

                        return;
                    }


                    if (error.status === 403) {

                        this.errorMessage =
                            'No tienes permisos para consultar tus solicitudes.';

                        return;
                    }


                    this.errorMessage =
                        'No pudimos comprobar tus solicitudes. Inténtalo nuevamente.';

                    this.cdr.detectChanges();
                }



            });
    }


    // =====================================================
    // BUSCAR ESTABLECIMIENTOS
    // =====================================================

    searchPlaces(): void {

        const term =
            this.searchTerm.trim();


        if (!term) {

            this.searchResults = [];

            this.searching = false;

            return;
        }


        if (
            this.selectedPlace &&
            this.selectedPlace.name !== term
        ) {

            this.selectedPlace =
                null;
        }


        this.searching = true;

        this.errorMessage = '';


        this.placeService
            .searchAvailablePlaces(
                term,
                0,
                10
            )
            .subscribe({

                next: response => {

                    console.log(
                        'Resultados de establecimientos:',
                        response
                    );

                    this.searchResults =
                        response.content ?? [];

                    this.searching = false;
                },


                error: error => {

                    console.error(
                        'Error buscando establecimientos:',
                        error
                    );

                    this.searchResults = [];

                    this.searching = false;

                    this.errorMessage =
                        error.error?.message ??
                        'No se pudieron buscar establecimientos.';
                }

            });
    }


    // =====================================================
    // SELECCIONAR ESTABLECIMIENTO
    // =====================================================

    selectPlace(
        place: PlaceSearchItem
    ): void {

        this.selectedPlace =
            place;

        this.searchTerm =
            place.name;

        this.searchResults =
            [];

        this.errorMessage =
            '';

        this.businessPhone =
            place.phone ??
            '';

        this.businessType =
            place.establishmentType ??
            String(place.type);

        this.description =
            place.description ??
            '';
    }


    // =====================================================
    // ENVIAR SOLICITUD
    // =====================================================

    submit(): void {

        this.errorMessage = '';

        this.success = false;


        // =================================================
        // VALIDAR ESTABLECIMIENTO
        // =================================================

        if (!this.selectedPlace) {

            this.errorMessage =
                'Debes seleccionar un establecimiento de la lista.';

            return;
        }


        // =================================================
        // SEGURIDAD ADICIONAL
        // =================================================

        if (
            this.hasPendingRequest ||
            this.hasApprovedRequest
        ) {

            this.errorMessage =
                'Ya tienes una solicitud activa.';

            return;
        }


        // =================================================
        // EVITAR DOBLE ENVÍO
        // =================================================

        if (this.submitting) {

            return;
        }


        this.submitting = true;


        // =================================================
        // CONSTRUIR REQUEST
        // =================================================

        const request:
            CreateEstablishmentRequest = {

            placeId:
                this.selectedPlace.id,

            businessName:
                this.selectedPlace.name,

            businessAddress:
                this.selectedPlace.address ??
                '',

            businessPhone:
                this.businessPhone.trim() ||
                undefined,

            businessType:
                this.businessType.trim() ||
                undefined,

            description:
                this.description.trim() ||
                undefined
        };


        console.log(
            'Solicitud de establecimiento:',
            request
        );


        // =================================================
        // ENVIAR AL BACKEND
        // =================================================

        this.requestService
            .createRequest(request)
            .subscribe({

                next: response => {

                    console.log(
                        '✅ Solicitud creada correctamente:',
                        response
                    );


                    // =================================================
                    // ACTUALIZAR ESTADO
                    // =================================================

                    this.submitting = false;

                    this.success = true;

                    this.errorMessage = '';

                    this.existingRequest = response;

                    this.hasPendingRequest =
                        response.status === 'PENDING';

                    this.hasApprovedRequest =
                        response.status === 'APPROVED';


                    console.log(
                        '📌 Estado después de crear solicitud:',
                        {
                            submitting: this.submitting,
                            success: this.success,
                            hasPendingRequest: this.hasPendingRequest,
                            hasApprovedRequest: this.hasApprovedRequest
                        }
                    );


                    // =================================================
                    // FORZAR ACTUALIZACIÓN VISUAL
                    // =================================================

                    this.cdr.detectChanges();
                },


                error: error => {

                    console.error(
                        '❌ Error creando solicitud:',
                        error
                    );


                    // =================================================
                    // DETENER LOADING
                    // =================================================

                    this.submitting = false;


                    // =================================================
                    // BAD REQUEST
                    // =================================================

                    if (error.status === 400) {

                        this.errorMessage =
                            error.error?.message ??
                            'Los datos de la solicitud no son válidos.';
                    }


                    // =================================================
                    // NO AUTORIZADO
                    // =================================================

                    else if (error.status === 401) {

                        this.errorMessage =
                            'Tu sesión ha expirado. Inicia sesión nuevamente.';
                    }


                    // =================================================
                    // SIN PERMISOS
                    // =================================================

                    else if (error.status === 403) {

                        this.errorMessage =
                            'No tienes permisos para realizar esta solicitud.';
                    }


                    // =================================================
                    // SOLICITUD DUPLICADA
                    // =================================================

                    else if (error.status === 409) {

                        this.errorMessage =
                            error.error?.message ??
                            'Ya tienes una solicitud de establecimiento pendiente.';
                    }


                    // =================================================
                    // ERROR GENÉRICO
                    // =================================================

                    else {

                        this.errorMessage =
                            'No se pudo enviar la solicitud. Inténtalo nuevamente.';
                    }


                    // =================================================
                    // ACTUALIZAR VISTA
                    // =================================================

                    this.cdr.detectChanges();
                }

            });
    }


    // =====================================================
    // CAMBIAR ESTABLECIMIENTO
    // =====================================================

    changePlace(): void {

        if (this.submitting) {

            return;
        }


        this.selectedPlace =
            null;

        this.searchResults =
            [];

        this.searchTerm =
            '';

        this.businessPhone =
            '';

        this.businessType =
            '';

        this.description =
            '';

        this.errorMessage =
            '';
    }


    // =====================================================
    // VER MIS SOLICITUDES
    // =====================================================

    viewMyRequests(): void {

        this.router.navigate([
            '/establishment/requests'
        ]);
    }


    // =====================================================
    // IR A MIS ESTABLECIMIENTOS
    // =====================================================

    goToMyEstablishment(): void {

        this.router.navigate([
            '/establishments'
        ]);
    }


    // =====================================================
    // VOLVER
    // =====================================================

    goBack(): void {

        this.router.navigate([
            '/dashboard'
        ]);
    }
}