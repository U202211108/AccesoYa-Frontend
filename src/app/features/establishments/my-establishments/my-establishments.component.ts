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
    PlaceService
} from '../../../core/services/place.service';

import {
    PlaceMapResponse
} from '../../../core/models/place-map-response';


@Component({
    selector: 'app-my-establishments',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './my-establishments.component.html',

    styleUrl:
        './my-establishments.component.scss'
})
export class MyEstablishmentsComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly placeService =
        inject(PlaceService);

    private readonly router =
        inject(Router);

    private readonly cdr =
        inject(ChangeDetectorRef);


    // =====================================================
    // ESTADO
    // =====================================================

    establishments:
        PlaceMapResponse[] = [];

    loading = true;

    error = '';


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadEstablishments();
    }


    // =====================================================
    // CARGAR MIS ESTABLECIMIENTOS
    // =====================================================

    loadEstablishments(): void {

        this.loading = true;

        this.error = '';

        this.cdr.detectChanges();


        this.placeService
            .getMyPlaces()
            .subscribe({

                next: places => {

                    console.log(
                        'Mis establecimientos:',
                        places
                    );


                    // =============================================
                    // ACTUALIZAR DATOS
                    // =============================================

                    this.establishments =
                        places ?? [];


                    // =============================================
                    // FINALIZAR LOADING
                    // =============================================

                    this.loading = false;

                    this.error = '';


                    console.log(
                        'Mi establecimiento:',
                        this.establishments
                    );


                    // =============================================
                    // FORZAR ACTUALIZACIÓN DE LA VISTA
                    // =============================================

                    this.cdr.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error obteniendo mis establecimientos:',
                        error
                    );


                    this.establishments = [];

                    this.loading = false;


                    if (error?.status === 403) {

                        this.error =
                            'No tienes permisos para consultar tus establecimientos.';

                    }

                    else if (error?.status === 401) {

                        this.error =
                            'Tu sesión ha expirado. Inicia sesión nuevamente.';

                    }

                    else {

                        this.error =
                            'No se pudo cargar la información de tu establecimiento.';
                    }


                    // =============================================
                    // ACTUALIZAR VISTA
                    // =============================================

                    this.cdr.detectChanges();

                }

            });
    }


    // =====================================================
    // GESTIONAR ACCESIBILIDAD
    // =====================================================

    goToAccessibility(
        placeId: string
    ): void {

        if (!placeId) {

            console.error(
                'No se recibió el ID del establecimiento.'
            );

            return;
        }


        console.log(
            'Abriendo accesibilidad para:',
            placeId
        );


        this.router.navigate(
            [
                '/establishments/accessibility'
            ],
            {
                queryParams: {
                    placeId
                }
            }
        );
    }


    // =====================================================
    // VOLVER AL DASHBOARD
    // =====================================================

    goBack(): void {

        this.router.navigate([
            '/dashboard'
        ]);
    }

}