import {
    Component,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    RouterLink
} from '@angular/router';

import {
    DashboardService
} from '../../core/services/dashboard.service';

import {
    DashboardResponse,
    DashboardDistribution
} from '../../core/models/dashboard-response';


@Component({

    selector: 'app-dashboard',

    standalone: true,

    imports: [
        CommonModule,
        RouterLink
    ],

    templateUrl:
        './dashboard.component.html',

    styleUrl:
        './dashboard.component.scss'
})
export class DashboardComponent
    implements OnInit {


    // =====================================================
    // USUARIO
    // =====================================================

    firstName = 'Usuario';

    role = 'USER';


    // =====================================================
    // DASHBOARD
    // =====================================================

    dashboard:
        DashboardResponse | null = null;


    loading = false;

    error = false;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    constructor(
        private readonly dashboardService:
            DashboardService
    ) { }


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadUser();

        this.loadDashboard();

    }


    // =====================================================
    // USUARIO
    // =====================================================

    private loadUser(): void {

        const userData =
            localStorage.getItem('user');


        if (!userData) {

            return;
        }


        try {

            const user =
                JSON.parse(userData);


            this.firstName =
                user.firstName ??
                'Usuario';


            this.role =
                user.role ??
                'USER';


        } catch (error) {

            console.error(
                'Error leyendo usuario:',
                error
            );

        }

    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    private loadDashboard(): void {

        this.loading = true;

        this.error = false;


        this.dashboardService
            .getDashboard()
            .subscribe({

                next: (response) => {

                    console.log(
                        'Dashboard FLM/NOC:',
                        response
                    );


                    this.dashboard =
                        response;


                    this.loading = false;

                },


                error: (error) => {

                    console.error(
                        'Error cargando dashboard FLM/NOC:',
                        error
                    );


                    this.dashboard =
                        null;


                    this.error = true;

                    this.loading = false;

                }

            });

    }


    // =====================================================
    // ZONALES
    // =====================================================

    get zonales():
        DashboardDistribution[] {

        return this.dashboard?.byZonal ?? [];

    }


    // =====================================================
    // TIPOS DE ESTACIÓN
    // =====================================================

    get stationTypes():
        DashboardDistribution[] {

        return this.dashboard?.byStationType ?? [];

    }


    // =====================================================
    // PORCENTAJE DE DISTRIBUCIÓN
    // =====================================================

    getPercentage(
        value: number
    ): number {

        const total =
            this.dashboard?.totalSites ?? 0;


        if (
            total <= 0 ||
            value <= 0
        ) {

            return 0;
        }


        return Math.min(
            (value / total) * 100,
            100
        );

    }


    // =====================================================
    // OPERACIÓN
    // =====================================================

    getOperationCount(
        items: DashboardDistribution[]
    ): number {

        if (
            !items ||
            items.length === 0
        ) {

            return 0;
        }


        return items.reduce(
            (
                total,
                item
            ) => total + item.count,
            0
        );

    }


    // =====================================================
    // PRIMER VALOR
    // =====================================================

    getFirstValue(
        items: DashboardDistribution[]
    ): string {

        if (
            !items ||
            items.length === 0
        ) {

            return 'Sin datos';
        }


        return items[0].value;

    }


    // =====================================================
    // ESTADO DE CARGA
    // =====================================================

    isLoading(): boolean {

        return this.loading;

    }


    // =====================================================
    // ESTADO DE ERROR
    // =====================================================

    hasError(): boolean {

        return this.error;

    }


    // =====================================================
    // REINTENTAR
    // =====================================================

    retry(): void {

        this.loadDashboard();

    }

    comingSoon(feature: string): void {

        console.log(
            `Funcionalidad pendiente: ${feature}`
        );

        alert(
            `${feature}\n\nEsta funcionalidad será implementada en la siguiente etapa.`
        );

    }

}