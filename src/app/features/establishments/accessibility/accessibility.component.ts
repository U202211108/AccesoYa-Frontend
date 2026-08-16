import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import {
    AccessibilityService
} from '../../../core/services/accessibility.service';

import {
    Accessibility,
    AccessibilityLevel,
    UpdateAccessibilityRequest
} from '../../../core/models/accessibility';


@Component({
    selector: 'app-accessibility',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './accessibility.component.html',

    styleUrl:
        './accessibility.component.scss'
})
export class AccessibilityComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    private readonly accessibilityService =
        inject(AccessibilityService);


    // =====================================================
    // ESTADO
    // =====================================================

    placeId = '';

    loading = true;

    saving = false;

    saved = false;

    errorMessage = '';


    // =====================================================
    // NIVELES
    // =====================================================

    readonly levels: AccessibilityLevel[] = [
        'YES',
        'PARTIAL',
        'NO',
        'UNKNOWN'
    ];


    // =====================================================
    // ACCESIBILIDAD
    // =====================================================

    accessibility: Accessibility = {

        id: '',

        placeId: '',

        entrance: 'UNKNOWN',

        ramps: 'UNKNOWN',

        elevator: 'UNKNOWN',

        accessibleRestroom: 'UNKNOWN',

        accessibleParking: 'UNKNOWN',

        signage: 'UNKNOWN',

        braille: 'UNKNOWN',

        tactilePath: 'UNKNOWN',

        observations: '',

        createdAt: '',

        updatedAt: ''
    };


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.placeId =
            this.route.snapshot
                .queryParamMap
                .get('placeId') ?? '';

        if (!this.placeId) {

            this.loading = false;

            this.errorMessage =
                'No se encontró el establecimiento seleccionado.';

            return;
        }

        this.loadAccessibility();
    }


    // =====================================================
    // CARGAR
    // =====================================================

    loadAccessibility(): void {

        this.loading = true;

        this.errorMessage = '';

        this.accessibilityService
            .getAccessibility(this.placeId)
            .subscribe({

                next: response => {

                    console.log(
                        'Accesibilidad recibida:',
                        response
                    );

                    this.accessibility =
                        response;

                    this.loading = false;
                },

                error: error => {

                    console.error(
                        'Error obteniendo accesibilidad:',
                        error
                    );

                    this.loading = false;

                    if (error?.status === 401) {

                        this.errorMessage =
                            'Tu sesión ha expirado. Inicia sesión nuevamente.';

                    } else if (error?.status === 404) {

                        this.errorMessage =
                            'No se encontró el establecimiento.';

                    } else {

                        this.errorMessage =
                            'No se pudo cargar la información de accesibilidad.';
                    }
                }

            });
    }


    // =====================================================
    // GUARDAR
    // =====================================================

    saveAccessibility(): void {

        if (!this.placeId) {

            this.errorMessage =
                'No se encontró el establecimiento.';

            return;
        }

        if (this.saving) {
            return;
        }

        this.saving = true;

        this.saved = false;

        this.errorMessage = '';


        const request:
            UpdateAccessibilityRequest = {

            entrance:
                this.accessibility.entrance,

            ramps:
                this.accessibility.ramps,

            elevator:
                this.accessibility.elevator,

            accessibleRestroom:
                this.accessibility.accessibleRestroom,

            accessibleParking:
                this.accessibility.accessibleParking,

            signage:
                this.accessibility.signage,

            braille:
                this.accessibility.braille,

            tactilePath:
                this.accessibility.tactilePath,

            observations:
                this.accessibility.observations?.trim() || undefined
        };


        console.log(
            'Guardando accesibilidad:',
            request
        );


        this.accessibilityService
            .updateAccessibility(
                this.placeId,
                request
            )
            .subscribe({

                next: response => {

                    console.log(
                        'Accesibilidad guardada:',
                        response
                    );

                    this.accessibility =
                        response;

                    this.saving = false;

                    this.saved = true;


                    setTimeout(() => {

                        this.saved = false;

                    }, 4000);
                },

                error: error => {

                    console.error(
                        'Error guardando accesibilidad:',
                        error
                    );

                    this.saving = false;

                    if (error?.status === 401) {

                        this.errorMessage =
                            'Tu sesión ha expirado. Inicia sesión nuevamente.';

                    } else if (error?.status === 403) {

                        this.errorMessage =
                            'No tienes permisos para modificar este establecimiento.';

                    } else {

                        this.errorMessage =
                            'No se pudo guardar la información de accesibilidad.';
                    }
                }

            });
    }


    // =====================================================
    // CAMBIAR NIVEL
    // =====================================================

    setLevel(
        field:
            'entrance' |
            'ramps' |
            'elevator' |
            'accessibleRestroom' |
            'accessibleParking' |
            'signage' |
            'braille' |
            'tactilePath',

        level: AccessibilityLevel
    ): void {

        this.accessibility[field] =
            level;

        this.saved = false;

        this.errorMessage = '';
    }


    // =====================================================
    // LABEL
    // =====================================================

    getLevelLabel(
        level: AccessibilityLevel
    ): string {

        switch (level) {

            case 'YES':
                return 'Sí';

            case 'PARTIAL':
                return 'Parcial';

            case 'NO':
                return 'No';

            case 'UNKNOWN':
            default:
                return 'Sin información';
        }
    }


    // =====================================================
    // ICONO
    // =====================================================

    getLevelIcon(
        level: AccessibilityLevel
    ): string {

        switch (level) {

            case 'YES':
                return 'check_circle';

            case 'PARTIAL':
                return 'contrast';

            case 'NO':
                return 'cancel';

            case 'UNKNOWN':
            default:
                return 'help';
        }
    }


    // =====================================================
    // CLASE
    // =====================================================

    getLevelClass(
        level: AccessibilityLevel
    ): string {

        switch (level) {

            case 'YES':
                return 'level-yes';

            case 'PARTIAL':
                return 'level-partial';

            case 'NO':
                return 'level-no';

            case 'UNKNOWN':
            default:
                return 'level-unknown';
        }
    }


    // =====================================================
    // PORCENTAJE
    // =====================================================

    getAccessibilityPercentage(): number {

        const values: AccessibilityLevel[] = [

            this.accessibility.entrance,

            this.accessibility.ramps,

            this.accessibility.elevator,

            this.accessibility.accessibleRestroom,

            this.accessibility.accessibleParking,

            this.accessibility.signage,

            this.accessibility.braille,

            this.accessibility.tactilePath
        ];


        const score =
            values.reduce(
                (total, value) => {

                    if (value === 'YES') {
                        return total + 1;
                    }

                    if (value === 'PARTIAL') {
                        return total + 0.5;
                    }

                    return total;

                },
                0
            );


        return Math.round(
            (score / values.length) * 100
        );
    }


    // =====================================================
    // CANTIDAD COMPLETA
    // =====================================================

    getAccessibleCount(): number {

        const values: AccessibilityLevel[] = [

            this.accessibility.entrance,

            this.accessibility.ramps,

            this.accessibility.elevator,

            this.accessibility.accessibleRestroom,

            this.accessibility.accessibleParking,

            this.accessibility.signage,

            this.accessibility.braille,

            this.accessibility.tactilePath
        ];


        return values.filter(
            value => value === 'YES'
        ).length;
    }


    // =====================================================
    // VOLVER
    // =====================================================

    goBack(): void {

        if (this.saving) {
            return;
        }

        this.router.navigate([
            '/establishments'
        ]);
    }
}