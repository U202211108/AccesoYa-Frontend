import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    inject
} from '@angular/core';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import {
    CommonModule
} from '@angular/common';

import {
    HttpErrorResponse
} from '@angular/common/http';

import * as L from 'leaflet';

import {
    PlaceService
} from '../../../core/services/place.service';

import {
    PlaceDetailResponse
} from '../../../core/models/place-detail-response';

import {
    FlmNocData
} from '../../../core/models/flm-noc-data';


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
    implements OnInit, AfterViewInit, OnDestroy {

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    private readonly placeService =
        inject(PlaceService);

    private readonly cdr =
        inject(ChangeDetectorRef);

    @ViewChild('detailMap')
    private detailMapElement?: ElementRef<HTMLDivElement>;

    private detailMap?: L.Map;

    private detailMapMarker?: L.CircleMarker;


    // =====================================================
    // ESTADO
    // =====================================================

    place:
        PlaceDetailResponse | null =
        null;

    loading = true;

    error = false;

    errorTitle =
        'No se pudo cargar el establecimiento';

    errorMessage =
        'Ocurrió un problema al obtener la información del sitio.';

    copiedId = false;

    selectedImage: string | null = null;


    // =====================================================
    // LABELS
    // =====================================================

    private readonly typeLabels:
        Record<string, string> = {

            HEALTHCARE:
                'Salud',

            PHARMACY:
                'Farmacia',

            RESTAURANT:
                'Restaurante',

            BANK:
                'Banco',

            SCHOOL:
                'Educación',

            UNIVERSITY:
                'Educación',

            HOTEL:
                'Hotel',

            SUPERMARKET:
                'Supermercado',

            SHOPPING_CENTER:
                'Centro comercial',

            SPORTS:
                'Deportes',

            RELIGIOUS:
                'Religioso',

            CULTURAL:
                'Cultura',

            PUBLIC_SERVICE:
                'Servicio público',

            TRANSPORTATION:
                'Transporte',

            TELECOMMUNICATION_SITE:
                'Telecomunicaciones'
        };


    private readonly sourceLabels:
        Record<string, string> = {

            RENIPRESS:
                'RENIPRESS',

            OPENSTREETMAP:
                'OpenStreetMap',

            GOOGLE_PLACES:
                'Google Places',

            ACCESOYA:
                'AccesoYa',

            FLM_NOC:
                'FLM / NOC'
        };


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        console.log(
            '================================='
        );

        console.log(
            '=== ACCESOYA - PLACE DETAIL ==='
        );

        console.log(
            '================================='
        );


        const id =
            this.route.snapshot.paramMap.get('id');


        console.log(
            '[PLACE DETAIL] ID recibido:',
            id
        );


        if (!id) {

            this.setError(
                'Establecimiento no válido',
                'No se encontró el identificador del establecimiento en la dirección solicitada.'
            );

            return;
        }


        this.loadPlace(id);
    }


    ngAfterViewInit(): void {
        // El mapa se inicializa cuando la respuesta
        // ya está disponible y el elemento existe.
    }


    // =====================================================
    // CARGAR ESTABLECIMIENTO
    // =====================================================

    private loadPlace(
        id: string
    ): void {

        console.log(
            '[PLACE DETAIL] Iniciando consulta...',
            id
        );


        this.loading = true;
        this.error = false;
        this.place = null;


        this.destroyDetailMap();


        this.placeService
            .getPlaceById(id)
            .subscribe({

                next: (
                    response: PlaceDetailResponse
                ) => {

                    console.log(
                        '[PLACE DETAIL] RESPUESTA RECIBIDA:',
                        response
                    );


                    this.place =
                        response;

                    this.loading =
                        false;

                    this.error =
                        false;


                    this.cdr.detectChanges();


                    // Esperamos a que Angular pinte
                    // el contenedor del mapa.
                    setTimeout(() => {

                        this.initializeDetailMap();

                    }, 0);
                },


                error: (
                    httpError: unknown
                ) => {

                    console.error(
                        '[PLACE DETAIL] ERROR:',
                        httpError
                    );


                    this.destroyDetailMap();

                    this.place =
                        null;

                    this.loading =
                        false;

                    this.error =
                        true;


                    this.handleLoadError(
                        httpError
                    );


                    this.cdr.detectChanges();
                },


                complete: () => {

                    console.log(
                        '[PLACE DETAIL] Consulta completada'
                    );
                }
            });
    }


    // =====================================================
    // MAPA PROPIO DE ACCESOYA
    // =====================================================

    private initializeDetailMap(): void {

        if (
            !this.place ||
            !this.hasCoordinates ||
            !this.detailMapElement
        ) {
            return;
        }


        const container =
            this.detailMapElement.nativeElement;


        this.destroyDetailMap();


        const latitude =
            this.place.latitude;

        const longitude =
            this.place.longitude;


        this.detailMap =
            L.map(
                container,
                {
                    center: [
                        latitude,
                        longitude
                    ],

                    zoom: 16,

                    minZoom: 5,

                    maxZoom: 19,

                    zoomControl: true,

                    attributionControl: true
                }
            );


        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution:
                    '&copy; OpenStreetMap contributors'
            }
        ).addTo(
            this.detailMap
        );


        this.detailMapMarker =
            L.circleMarker(
                [
                    latitude,
                    longitude
                ],
                {
                    radius: 9,

                    weight: 3,

                    fillOpacity: 0.9
                }
            )
                .addTo(
                    this.detailMap
                );


        this.detailMapMarker.bindPopup(
            `
            <strong>${this.escapeHtml(this.place.name)}</strong>
            <br>
            ${this.escapeHtml(this.getTypeLabel(this.place.type))}
            `
        );


        this.detailMapMarker.openPopup();


        setTimeout(() => {

            this.detailMap?.invalidateSize();

        }, 100);
    }


    private destroyDetailMap(): void {

        if (this.detailMap) {

            this.detailMap.off();

            this.detailMap.remove();

            this.detailMap =
                undefined;
        }


        this.detailMapMarker =
            undefined;
    }


    private escapeHtml(
        value: string
    ): string {

        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }


    // =====================================================
    // MANEJO DE ERRORES
    // =====================================================

    private handleLoadError(
        error: unknown
    ): void {

        if (
            error instanceof HttpErrorResponse
        ) {

            console.error(
                '[PLACE DETAIL] HTTP STATUS:',
                error.status
            );


            if (
                error.status === 404
            ) {

                this.errorTitle =
                    'Establecimiento no encontrado';

                this.errorMessage =
                    'El sitio solicitado no existe o ya no está disponible.';

                return;
            }


            if (
                error.status === 401 ||
                error.status === 403
            ) {

                this.errorTitle =
                    'Acceso no autorizado';

                this.errorMessage =
                    'No tienes permisos para consultar la información de este establecimiento.';

                return;
            }


            if (
                error.status >= 500
            ) {

                this.errorTitle =
                    'Error del servidor';

                this.errorMessage =
                    'El servidor no pudo procesar la solicitud. Inténtalo nuevamente en unos instantes.';

                return;
            }
        }


        this.errorTitle =
            'No se pudo cargar el establecimiento';

        this.errorMessage =
            'Verifica tu conexión e inténtalo nuevamente.';
    }


    private setError(
        title: string,
        message: string
    ): void {

        this.place =
            null;

        this.loading =
            false;

        this.error =
            true;

        this.errorTitle =
            title;

        this.errorMessage =
            message;
    }


    // =====================================================
    // NAVEGACIÓN
    // =====================================================

    goBack(): void {

        this.router.navigate([
            '/places/map'
        ]);
    }


    goToFullMap(): void {

        this.router.navigate([
            '/places/map'
        ]);
    }


    // =====================================================
    // TIPO / FUENTE / ESTADO
    // =====================================================

    getTypeLabel(
        type?: string
    ): string {

        const normalized =
            type
                ?.trim()
                .toUpperCase() ?? '';


        return (
            this.typeLabels[normalized]
            ?? type?.trim()
            ?? 'Lugar'
        );
    }


    getSourceLabel(
        source?: string
    ): string {

        const normalized =
            source
                ?.trim()
                .toUpperCase() ?? '';


        return (
            this.sourceLabels[normalized]
            ?? source?.trim()
            ?? 'AccesoYa'
        );
    }


    get isActive(): boolean {

        return (
            this.place?.status
                ?.trim()
                .toUpperCase() ===
            'ACTIVE'
        );
    }


    get statusLabel(): string {

        const normalized =
            this.place?.status
                ?.trim()
                .toUpperCase();


        if (
            normalized === 'ACTIVE'
        ) {
            return 'Activo';
        }


        if (
            normalized === 'INACTIVE'
        ) {
            return 'Inactivo';
        }


        return this.place?.status
            ?.trim()
            || 'Sin estado';
    }


    get sourceStatusLabel(): string {

        return this.place?.sourceStatus
            ?.trim()
            || 'No disponible';
    }


    // =====================================================
    // DIRECCIÓN
    // =====================================================

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
                    !!value?.trim()
            )
            .join(', ');
    }


    // =====================================================
    // COORDENADAS
    // =====================================================

    get hasCoordinates(): boolean {

        if (!this.place) {
            return false;
        }


        return Number.isFinite(
            this.place.latitude
        ) &&
            Number.isFinite(
                this.place.longitude
            );
    }


    get coordinateText(): string {

        if (!this.place) {
            return '';
        }


        return `${this.place.latitude}, ${this.place.longitude}`;
    }


    // =====================================================
    // FLM / NOC
    // =====================================================

    get flmNoc(): FlmNocData | null {

        return this.place?.flmNocData
            ?? null;
    }


    get hasFlmNocData(): boolean {

        return !!this.flmNoc;
    }


    // =====================================================
    // UTILIDADES DE DATOS
    // =====================================================

    hasValue(
        value?: string | null
    ): boolean {

        return !!value?.trim();
    }


    get images(): string[] {

        if (!this.place) {
            return [];
        }


        return [
            this.place.imageUrl1,
            this.place.imageUrl2,
            this.place.imageUrl3
        ].filter(
            (
                image
            ): image is string =>
                !!image?.trim()
        );
    }


    get hasImages(): boolean {

        return this.images.length > 0;
    }


    // =====================================================
    // COPIAR IDENTIFICADOR
    // =====================================================

    async copyId(): Promise<void> {

        if (
            !this.place?.id
        ) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                this.place.id
            );

            this.copiedId =
                true;

            this.cdr.detectChanges();


            setTimeout(() => {

                this.copiedId =
                    false;

                this.cdr.detectChanges();

            }, 1800);

        } catch (error) {

            console.error(
                '[PLACE DETAIL] No se pudo copiar el ID:',
                error
            );
        }
    }


    // =====================================================
    // GALERÍA
    // =====================================================

    openImage(
        image: string
    ): void {

        this.selectedImage =
            image;
    }


    closeImage(): void {

        this.selectedImage =
            null;
    }


    // =====================================================
    // ERROR DE IMAGEN
    // =====================================================

    onImageError(
        event: Event
    ): void {

        const image =
            event.target as HTMLImageElement;


        if (!image) {
            return;
        }


        image.style.display =
            'none';
    }


    // =====================================================
    // REINTENTAR
    // =====================================================

    retry(): void {

        const id =
            this.route.snapshot.paramMap.get('id');


        if (!id) {

            this.setError(
                'Establecimiento no válido',
                'No se encontró el identificador del establecimiento.'
            );

            return;
        }


        this.loadPlace(id);
    }


    // =====================================================
    // DESTRUCCIÓN
    // =====================================================

    ngOnDestroy(): void {

        this.destroyDetailMap();
    }
}
