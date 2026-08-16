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
    Router
} from '@angular/router';

import {
    FormsModule
} from '@angular/forms';

import {
    EstablishmentRequestService
} from '../../../core/services/establishment-request.service';

import {
    EstablishmentRequestResponse,
    ReviewEstablishmentRequest
} from '../../../core/models/establishment-request';


@Component({
    selector: 'app-moderator-requests',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './moderator-requests.component.html',

    styleUrl:
        './moderator-requests.component.scss'
})
export class ModeratorRequestsComponent
    implements OnInit {


    private readonly requestService =
        inject(EstablishmentRequestService);

    private readonly router =
        inject(Router);

    private readonly cdr =
        inject(ChangeDetectorRef);


    // =====================================================
    // ESTADO
    // =====================================================

    requests:
        EstablishmentRequestResponse[] = [];

    selectedRequest:
        EstablishmentRequestResponse | null = null;

    loading = true;

    processing = false;

    errorMessage = '';

    successMessage = '';

    showReviewPanel = false;

    reviewAction:
        'APPROVED' | 'REJECTED' | null = null;

    reviewComment = '';


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadRequests();
    }


    // =====================================================
    // CARGAR SOLICITUDES
    // =====================================================

    loadRequests(): void {

        this.loading = true;

        this.errorMessage = '';

        this.requestService
            .getPendingRequests()
            .subscribe({

                next: response => {

                    this.requests = response;

                    this.loading = false;

                    this.cdr.detectChanges();
                },

                error: error => {

                    console.error(
                        'Error obteniendo solicitudes:',
                        error
                    );

                    this.loading = false;

                    this.errorMessage =
                        'No se pudieron cargar las solicitudes pendientes.';

                    this.cdr.detectChanges();
                }

            });
    }


    // =====================================================
    // SELECCIONAR SOLICITUD
    // =====================================================

    selectRequest(
        request: EstablishmentRequestResponse
    ): void {

        this.selectedRequest = request;

        this.showReviewPanel = false;

        this.reviewAction = null;

        this.reviewComment = '';

        this.successMessage = '';

        this.errorMessage = '';
    }


    // =====================================================
    // CERRAR DETALLE
    // =====================================================

    closeRequest(): void {

        if (this.processing) {
            return;
        }

        this.selectedRequest = null;

        this.showReviewPanel = false;

        this.reviewAction = null;

        this.reviewComment = '';
    }


    // =====================================================
    // INICIAR REVISIÓN
    // =====================================================

    startReview(
        action: 'APPROVED' | 'REJECTED'
    ): void {

        if (!this.selectedRequest) {
            return;
        }

        this.reviewAction = action;

        this.reviewComment = '';

        this.showReviewPanel = true;

        this.errorMessage = '';
    }


    // =====================================================
    // CANCELAR REVISIÓN
    // =====================================================

    cancelReview(): void {

        if (this.processing) {
            return;
        }

        this.showReviewPanel = false;

        this.reviewAction = null;

        this.reviewComment = '';
    }


    // =====================================================
    // CONFIRMAR REVISIÓN
    // =====================================================

    confirmReview(): void {

        if (
            !this.selectedRequest ||
            !this.reviewAction ||
            this.processing
        ) {
            return;
        }


        if (
            this.reviewAction === 'REJECTED' &&
            !this.reviewComment.trim()
        ) {

            this.errorMessage =
                'Debes indicar el motivo del rechazo.';

            return;
        }


        this.processing = true;

        this.errorMessage = '';

        const request: ReviewEstablishmentRequest = {

            status:
                this.reviewAction,

            comment:
                this.reviewComment.trim() || undefined
        };


        this.requestService
            .reviewRequest(
                this.selectedRequest.id,
                request
            )
            .subscribe({

                next: response => {

                    console.log(
                        'Solicitud procesada:',
                        response
                    );


                    this.requests =
                        this.requests.filter(
                            item =>
                                item.id !==
                                response.id
                        );


                    this.processing = false;

                    this.showReviewPanel = false;

                    this.reviewAction = null;

                    this.reviewComment = '';

                    this.successMessage =
                        response.status === 'APPROVED'
                            ? 'Solicitud aprobada correctamente.'
                            : 'Solicitud rechazada correctamente.';

                    this.selectedRequest = null;

                    this.cdr.detectChanges();
                },


                error: error => {

                    console.error(
                        'Error procesando solicitud:',
                        error
                    );

                    this.processing = false;

                    this.errorMessage =
                        error.status === 403
                            ? 'No tienes permisos para revisar solicitudes.'
                            : 'No se pudo procesar la solicitud. Inténtalo nuevamente.';

                    this.cdr.detectChanges();
                }

            });
    }


    // =====================================================
    // ETIQUETA DE ESTADO
    // =====================================================

    getStatusLabel(
        status: string
    ): string {

        switch (
        status.toUpperCase()
        ) {

            case 'PENDING':
                return 'Pendiente';

            case 'APPROVED':
                return 'Aprobada';

            case 'REJECTED':
                return 'Rechazada';

            default:
                return status;
        }
    }


    // =====================================================
    // FORMATEAR FECHA
    // =====================================================

    formatDate(
        date?: string
    ): string {

        if (!date) {
            return 'Sin información';
        }

        return new Intl.DateTimeFormat(
            'es-PE',
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        ).format(
            new Date(date)
        );
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