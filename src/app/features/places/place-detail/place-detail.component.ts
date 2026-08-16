import {
    Component,
    OnInit,
    inject,
    ChangeDetectorRef
} from '@angular/core';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import {
    CommonModule
} from '@angular/common';

import {
    PlaceService
} from '../../../core/services/place.service';

import {
    PlaceDetailResponse
} from '../../../core/models/place-detail-response';


@Component({
    selector: 'app-place-detail',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './place-detail.component.html',

    styleUrl:
        './place-detail.component.scss'
})
export class PlaceDetailComponent
    implements OnInit {

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    private readonly placeService =
        inject(PlaceService);


    place: PlaceDetailResponse | null =
        null;

    loading = true;

    error = false;

    editingAccessibility = false;

    savingAccessibility = false;

    accessibilitySaved = false;

    accessibilityForm = {
        wheelchairAccess: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        accessibleEntrance: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        accessibleParking: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        accessibleBathroom: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        elevator: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        accessibleRoute: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        signage: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN',
        assistance: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN'
    };

    private readonly cdr =
        inject(ChangeDetectorRef);


    ngOnInit(): void {

        console.log('=== PLACE DETAIL ===');

        const id =
            this.route.snapshot.paramMap.get('id');

        console.log('ID recibido:', id);

        if (!id) {

            console.error('No se encontró el ID en la URL');

            this.loading = false;
            this.error = true;

            return;
        }

        console.log(
            'Solicitando detalle del lugar:',
            id
        );

        this.loadPlace(id);
    }


    private loadPlace(id: string): void {

        console.log('Solicitando detalle del lugar:', id);

        this.loading = true;
        this.error = false;
        this.place = null;

        this.placeService
            .getPlaceById(id)
            .subscribe({

                next: (response) => {

                    console.log(
                        'RESPUESTA DEL BACKEND:',
                        response
                    );

                    this.place = response;

                    this.error = false;
                    this.loading = false;

                    console.log(
                        'Estado actualizado:',
                        {
                            loading: this.loading,
                            error: this.error,
                            place: this.place
                        }
                    );

                    this.cdr.detectChanges();
                },

                error: (error) => {

                    console.error(
                        'Error obteniendo detalle del lugar:',
                        error
                    );

                    this.place = null;
                    this.loading = false;
                    this.error = true;

                    this.cdr.detectChanges();
                },

                complete: () => {

                    console.log(
                        'Petición completada'
                    );

                }

            });
    }


    goBack(): void {

        this.router.navigate([
            '/places/map'
        ]);
    }

    getAccessibilityLabel(
        status?: string
    ): string {

        switch (
        status?.toUpperCase()
        ) {

            case 'YES':
                return 'Sí';

            case 'NO':
                return 'No';

            default:
                return 'Sin información';
        }
    }

    getAccessibilityClass(
        status?: string
    ): string {

        switch (
        status?.toUpperCase()
        ) {

            case 'YES':
                return 'yes';

            case 'NO':
                return 'no';

            default:
                return 'unknown';
        }
    }

    getAccessibilityIcon(
        status?: string
    ): string {

        switch (
        status?.toUpperCase()
        ) {

            case 'YES':
                return '✓';

            case 'NO':
                return '✕';

            default:
                return '?';
        }
    }

    getTypeLabel(
        type?: string
    ): string {

        switch (
        type?.toUpperCase()
        ) {

            case 'HEALTHCARE':
                return 'Salud';

            case 'PHARMACY':
                return 'Farmacia';

            case 'RESTAURANT':
                return 'Restaurante';

            case 'BANK':
                return 'Banco';

            case 'SCHOOL':
            case 'UNIVERSITY':
                return 'Educación';

            case 'HOTEL':
                return 'Hotel';

            case 'SUPERMARKET':
                return 'Supermercado';

            case 'SHOPPING_CENTER':
                return 'Centro comercial';

            case 'SPORTS':
                return 'Deportes';

            case 'RELIGIOUS':
                return 'Religioso';

            case 'CULTURAL':
                return 'Cultura';

            case 'PUBLIC_SERVICE':
                return 'Servicio público';

            case 'TRANSPORTATION':
                return 'Transporte';

            default:
                return 'Lugar';
        }
    }


    getSourceLabel(
        source?: string
    ): string {

        switch (
        source?.toUpperCase()
        ) {

            case 'RENIPRESS':
                return 'RENIPRESS';

            case 'OPENSTREETMAP':
                return 'OpenStreetMap';

            case 'GOOGLE_PLACES':
                return 'Google Places';

            case 'ACCESOYA':
                return 'AccesoYa';

            default:
                return source ??
                    'AccesoYa';
        }
    }


    getFullAddress(): string {

        if (!this.place) {
            return '';
        }


        const parts = [
            this.place.address,
            this.place.district,
            this.place.province,
            this.place.department
        ];


        return parts
            .filter(
                value =>
                    value?.trim()
            )
            .join(', ');
    }


    get hasImages(): boolean {

        if (!this.place) {
            return false;
        }


        return !!(
            this.place.imageUrl1 ||
            this.place.imageUrl2 ||
            this.place.imageUrl3
        );
    }

    startAccessibilityEdit(): void {

        if (!this.place?.accessibility) {
            return;
        }

        this.accessibilityForm = {
            wheelchairAccess:
                this.place.accessibility.wheelchairAccess,

            accessibleEntrance:
                this.place.accessibility.accessibleEntrance,

            accessibleParking:
                this.place.accessibility.accessibleParking,

            accessibleBathroom:
                this.place.accessibility.accessibleBathroom,

            elevator:
                this.place.accessibility.elevator,

            accessibleRoute:
                this.place.accessibility.accessibleRoute,

            signage:
                this.place.accessibility.signage,

            assistance:
                this.place.accessibility.assistance
        };

        this.accessibilitySaved = false;

        this.editingAccessibility = true;
    }

    cancelAccessibilityEdit(): void {

        this.editingAccessibility = false;

        this.accessibilitySaved = false;
    }

    saveAccessibility(): void {

        if (!this.place) {
            return;
        }

        this.savingAccessibility = true;

        this.accessibilitySaved = false;

        this.placeService
            .updateAccessibility(
                this.place.id,
                this.accessibilityForm
            )
            .subscribe({

                next: (response) => {

                    if (this.place) {

                        this.place = {
                            ...this.place,
                            accessibility: response
                        };
                    }

                    this.editingAccessibility = false;

                    this.savingAccessibility = false;

                    this.accessibilitySaved = true;

                    this.cdr.detectChanges();

                    console.log(
                        'Accesibilidad actualizada:',
                        response
                    );
                },

                error: (error) => {

                    console.error(
                        'Error actualizando accesibilidad:',
                        error
                    );

                    this.savingAccessibility = false;

                    this.accessibilitySaved = false;

                    alert(
                        'No se pudo actualizar la información de accesibilidad.'
                    );
                }
            });
    }
}