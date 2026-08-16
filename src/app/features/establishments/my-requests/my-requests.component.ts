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
    EstablishmentRequestResponse
} from '../../../core/models/establishment-request';

import {
    AuthService
} from '../../../core/services/auth.service';


@Component({
    selector: 'app-my-requests',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './my-requests.component.html',

    styleUrl:
        './my-requests.component.scss'
})
export class MyRequestsComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly requestService =
        inject(EstablishmentRequestService);

    private readonly router =
        inject(Router);

    private readonly authService =
        inject(AuthService);

    private readonly cdr =
        inject(ChangeDetectorRef);


    // =====================================================
    // ESTADO
    // =====================================================

    requests:
        EstablishmentRequestResponse[] = [];

    loading = true;

    error = '';

    role = '';


    // =====================================================
    // REVISIÓN
    // =====================================================

    reviewing = false;

    reviewingRequest:
        EstablishmentRequestResponse | null = null;

    rejectModalOpen = false;

    rejectComment = '';


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.role =
            this.authService.getCurrentRole() ?? '';

        console.log(
            'Rol actual:',
            this.role
        );

        this.loadRequests();
    }


    // =====================================================
    // ¿ES MODERADOR?
    // =====================================================

    isModerator(): boolean {

        return (
            this.role === 'MODERATOR' ||
            this.role === 'ADMIN'
        );
    }


    // =====================================================
    // CARGAR SOLICITUDES
    // =====================================================

    loadRequests(): void {

        this.loading = true;

        this.error = '';

        this.cdr.detectChanges();


        const request$ =
            this.isModerator()
                ? this.requestService.getPendingRequests()
                : this.requestService.getMyRequests();


        request$.subscribe({

            next: response => {

                console.log(
                    'Solicitudes recibidas:',
                    response
                );

                this.requests =
                    response ?? [];

                this.loading = false;

                this.error = '';

                this.cdr.detectChanges();
            },


            error: error => {

                console.error(
                    'Error obteniendo solicitudes:',
                    error
                );

                this.requests = [];

                this.loading = false;

                if (error.status === 403) {

                    this.error =
                        'No tienes permisos para consultar estas solicitudes.';

                } else {

                    this.error =
                        'No se pudieron cargar las solicitudes.';
                }

                this.cdr.detectChanges();
            }

        });
    }


    // =====================================================
    // APROBAR SOLICITUD
    // =====================================================

    approveRequest(
        request: EstablishmentRequestResponse
    ): void {

        if (this.reviewing) {
            return;
        }


        const confirmed =
            window.confirm(
                `¿Deseas aprobar la solicitud de "${request.businessName}"?`
            );


        if (!confirmed) {
            return;
        }


        this.reviewing = true;

        this.reviewingRequest = request;

        this.error = '';


        this.requestService
            .reviewRequest(
                request.id,
                {
                    status: 'APPROVED'
                }
            )
            .subscribe({

                next: response => {

                    console.log(
                        'Solicitud aprobada:',
                        response
                    );


                    this.reviewing = false;

                    this.reviewingRequest = null;


                    // Actualizamos la lista inmediatamente
                    this.requests =
                        this.requests.filter(
                            item =>
                                item.id !== request.id
                        );


                    this.cdr.detectChanges();
                },


                error: error => {

                    console.error(
                        'Error aprobando solicitud:',
                        error
                    );


                    this.reviewing = false;

                    this.reviewingRequest = null;


                    if (error.status === 403) {

                        this.error =
                            'No tienes permisos para aprobar esta solicitud.';

                    } else if (error.status === 404) {

                        this.error =
                            'La solicitud ya no existe.';

                    } else if (error.status === 400) {

                        this.error =
                            error.error?.message ??
                            'La solicitud no puede ser aprobada.';

                    } else {

                        this.error =
                            'No se pudo aprobar la solicitud.';
                    }


                    this.cdr.detectChanges();
                }

            });
    }


    // =====================================================
    // ABRIR MODAL DE RECHAZO
    // =====================================================

    openRejectModal(
        request: EstablishmentRequestResponse
    ): void {

        if (this.reviewing) {
            return;
        }


        this.reviewingRequest = request;

        this.rejectComment = '';

        this.rejectModalOpen = true;

        this.error = '';

        this.cdr.detectChanges();
    }


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    closeRejectModal(): void {

        if (this.reviewing) {
            return;
        }


        this.rejectModalOpen = false;

        this.reviewingRequest = null;

        this.rejectComment = '';
    }


    // =====================================================
    // RECHAZAR SOLICITUD
    // =====================================================

    rejectRequest(): void {

        if (
            this.reviewing ||
            !this.reviewingRequest
        ) {
            return;
        }


        const comment =
            this.rejectComment.trim();


        if (!comment) {

            this.error =
                'Debes indicar el motivo del rechazo.';

            return;
        }


        if (comment.length < 5) {

            this.error =
                'El motivo del rechazo debe tener al menos 5 caracteres.';

            return;
        }


        this.reviewing = true;

        this.error = '';


        this.requestService
            .reviewRequest(
                this.reviewingRequest.id,
                {
                    status: 'REJECTED',
                    comment: comment
                }
            )
            .subscribe({

                next: response => {

                    console.log(
                        'Solicitud rechazada:',
                        response
                    );


                    this.reviewing = false;

                    this.rejectModalOpen = false;

                    this.reviewingRequest = null;

                    this.rejectComment = '';


                    // El moderador trabaja solamente
                    // con solicitudes pendientes.
                    this.requests =
                        this.requests.filter(
                            request =>
                                request.id !== response.id
                        );


                    this.cdr.detectChanges();
                },


                error: error => {

                    console.error(
                        'Error rechazando solicitud:',
                        error
                    );


                    this.reviewing = false;


                    if (error.status === 403) {

                        this.error =
                            'No tienes permisos para rechazar esta solicitud.';

                    } else if (error.status === 404) {

                        this.error =
                            'La solicitud ya no existe.';

                    } else if (error.status === 400) {

                        this.error =
                            error.error?.message ??
                            'La solicitud no puede ser rechazada.';

                    } else {

                        this.error =
                            'No se pudo rechazar la solicitud.';
                    }


                    this.cdr.detectChanges();
                }

            });
    }


    // =====================================================
    // ESTADO
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
                return 'Desconocido';
        }
    }


    getStatusClass(
        status: string
    ): string {

        switch (
        status.toUpperCase()
        ) {

            case 'PENDING':
                return 'pending';

            case 'APPROVED':
                return 'approved';

            case 'REJECTED':
                return 'rejected';

            default:
                return 'unknown';
        }
    }


    getStatusIcon(
        status: string
    ): string {

        switch (
        status.toUpperCase()
        ) {

            case 'PENDING':
                return 'schedule';

            case 'APPROVED':
                return 'check_circle';

            case 'REJECTED':
                return 'cancel';

            default:
                return 'help';
        }
    }


    // =====================================================
    // NUEVA SOLICITUD
    // =====================================================

    goToRequest(): void {

        this.router.navigate([
            '/establishment/request'
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