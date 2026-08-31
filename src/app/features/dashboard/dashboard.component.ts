import {
    ChangeDetectorRef,
    Component,
    HostListener,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    RouterLink
} from '@angular/router';

import {
    UserRole
} from '../../core/models/auth-user';

import {
    DashboardService
} from '../../core/services/dashboard.service';

import {
    DashboardResponse,
    DashboardDistribution
} from '../../core/models/dashboard-response';


// =====================================================
// TIPOS DE DISTRIBUCIÓN
// =====================================================

type DistributionType =
    | 'departments'
    | 'provinces'
    | 'districts'
    | 'zonales'
    | 'reactionCoverage'
    | 'patrol'
    | 'guard'
    | 'surveillance'
    | 'dynamicRound'
    | 'csiMonitoring'
    | 'towerOwners'
    | 'towerOwnerClassifications';


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

    role: UserRole | null = null;


    // =====================================================
    // DASHBOARD
    // =====================================================

    dashboard:
        DashboardResponse | null = null;

    loading = false;

    error = false;


    // =====================================================
    // CONFIGURACIÓN DE LISTAS
    // =====================================================

    /**
     * Cantidad de elementos que se muestran directamente
     * dentro de cada tarjeta.
     *
     * El resto se consulta mediante "Ver todos".
     */
    readonly visibleLimit = 5;


    // =====================================================
    // MODAL
    // =====================================================

    isDistributionModalOpen = false;

    modalDistributionType:
        DistributionType = 'departments';

    distributionSearch = '';


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadUser();

        this.loadDashboard();
    }


    // =====================================================
    // CARGAR USUARIO
    // =====================================================

    private loadUser(): void {

        const userData =
            sessionStorage.getItem('user');

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
                null;

            console.log(
                'Rol del usuario:',
                this.role
            );

        } catch (error) {

            console.error(
                'Error leyendo usuario:',
                error
            );
        }
    }


    // =====================================================
    // CARGAR DASHBOARD
    // =====================================================

    private loadDashboard(): void {

        this.loading = true;

        this.error = false;

        this.dashboardService
            .getDashboard()
            .subscribe({

                next: response => {

                    console.log(
                        'Dashboard recibido:',
                        response
                    );

                    this.dashboard =
                        response;

                    this.loading =
                        false;

                    this.error =
                        false;

                    this.changeDetectorRef.detectChanges();
                },


                error: error => {

                    console.error(
                        'Error cargando dashboard:',
                        error
                    );

                    this.dashboard =
                        null;

                    this.loading =
                        false;

                    this.error =
                        true;

                    this.changeDetectorRef.detectChanges();
                }

            });
    }


    // =====================================================
    // TIPO DE DASHBOARD
    // =====================================================

    get dashboardTitle(): string {

        switch (this.role) {

            case 'CONSULTOR':
                return 'Panel de consulta';

            case 'OPERADOR_FLNOC':
                return 'Panel operativo FLM/NOC';

            case 'SUPERVISOR':
                return 'Panel de supervisión';

            case 'ADMIN':
                return 'Panel de administración';

            default:
                return 'Panel de control';
        }
    }


    // =====================================================
    // DESCRIPCIÓN
    // =====================================================

    get dashboardDescription(): string {

        switch (this.role) {

            case 'CONSULTOR':
                return 'Consulta información general y distribución geográfica de los sitios.';

            case 'OPERADOR_FLNOC':
                return 'Consulta información operativa y de seguridad de los sitios FLM/NOC.';

            case 'SUPERVISOR':
                return 'Supervisa la distribución, operación y condiciones de los sitios FLM/NOC.';

            case 'ADMIN':
                return 'Consulta la información completa disponible de la plataforma.';

            default:
                return 'Información general de AccesoYa.';
        }
    }


    // =====================================================
    // PERMISOS VISUALES
    // =====================================================

    isConsultor(): boolean {

        return this.role === 'CONSULTOR';
    }


    isOperator(): boolean {

        return this.role === 'OPERADOR_FLNOC';
    }


    isSupervisor(): boolean {

        return this.role === 'SUPERVISOR';
    }


    isAdmin(): boolean {

        return this.role === 'ADMIN';
    }


    canViewOperational(): boolean {

        return this.role === 'OPERADOR_FLNOC'
            || this.role === 'SUPERVISOR'
            || this.role === 'ADMIN';
    }


    canViewTowerInformation(): boolean {

        return this.role === 'SUPERVISOR'
            || this.role === 'ADMIN';
    }


    // =====================================================
    // DISTRIBUCIONES
    // =====================================================

    get zonales(): DashboardDistribution[] {

        return this.dashboard?.byZonal ?? [];
    }


    get departments(): DashboardDistribution[] {

        return this.dashboard?.byDepartment ?? [];
    }


    get provinces(): DashboardDistribution[] {

        return this.dashboard?.byProvince ?? [];
    }


    get districts(): DashboardDistribution[] {

        return this.dashboard?.byDistrict ?? [];
    }


    get towerOwners(): DashboardDistribution[] {

        return this.dashboard?.byTowerOwner ?? [];
    }


    get towerOwnerClassifications(): DashboardDistribution[] {

        return this.dashboard
            ?.byTowerOwnerClassification ?? [];
    }


    get reactionCoverage(): DashboardDistribution[] {

        return this.dashboard
            ?.reactionCoverage ?? [];
    }


    get patrol(): DashboardDistribution[] {

        return this.dashboard?.patrol ?? [];
    }


    get guard(): DashboardDistribution[] {

        return this.dashboard?.guard ?? [];
    }


    get surveillance(): DashboardDistribution[] {

        return this.dashboard?.surveillance ?? [];
    }


    get dynamicRound(): DashboardDistribution[] {

        return this.dashboard?.dynamicRound ?? [];
    }


    get csiMonitoring(): DashboardDistribution[] {

        return this.dashboard?.csiMonitoring ?? [];
    }


    // =====================================================
    // ELEMENTOS VISIBLES
    // =====================================================

    getVisibleItems(
        items: DashboardDistribution[]
    ): DashboardDistribution[] {

        return items.slice(
            0,
            this.visibleLimit
        );
    }


    // =====================================================
    // MOSTRAR BOTÓN VER TODOS
    // =====================================================

    hasMoreItems(
        items: DashboardDistribution[]
    ): boolean {

        return items.length >
            this.visibleLimit;
    }


    // =====================================================
    // PORCENTAJE
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
    // TOTAL DE UNA DISTRIBUCIÓN
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
    // DATOS DEL MODAL
    // =====================================================

    get modalItems():
        DashboardDistribution[] {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return this.departments;

            case 'provinces':
                return this.provinces;

            case 'districts':
                return this.districts;

            case 'zonales':
                return this.zonales;

            case 'reactionCoverage':
                return this.reactionCoverage;

            case 'patrol':
                return this.patrol;

            case 'guard':
                return this.guard;

            case 'surveillance':
                return this.surveillance;

            case 'dynamicRound':
                return this.dynamicRound;

            case 'csiMonitoring':
                return this.csiMonitoring;

            case 'towerOwners':
                return this.towerOwners;

            case 'towerOwnerClassifications':
                return this.towerOwnerClassifications;

            default:
                return [];
        }
    }


    // =====================================================
    // TÍTULO DEL MODAL
    // =====================================================

    get modalTitle(): string {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return 'Departamentos';

            case 'provinces':
                return 'Provincias';

            case 'districts':
                return 'Distritos';

            case 'zonales':
                return 'Zonales';

            case 'reactionCoverage':
                return 'Cobertura de reacción';

            case 'patrol':
                return 'Patrullaje';

            case 'guard':
                return 'Guardianía';

            case 'surveillance':
                return 'Vigilancia';

            case 'dynamicRound':
                return 'Ronda dinámica';

            case 'csiMonitoring':
                return 'Monitoreo CSI';

            case 'towerOwners':
                return 'Propietarios de torre';

            case 'towerOwnerClassifications':
                return 'Clasificación del propietario';

            default:
                return 'Distribución';
        }
    }


    // =====================================================
    // DESCRIPCIÓN DEL MODAL
    // =====================================================

    get modalDescription(): string {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return 'Consulta todos los departamentos registrados.';

            case 'provinces':
                return 'Consulta todas las provincias registradas.';

            case 'districts':
                return 'Consulta todos los distritos registrados.';

            case 'zonales':
                return 'Consulta la distribución completa de sitios por zonal.';

            case 'reactionCoverage':
                return 'Consulta todas las categorías de cobertura de reacción.';

            case 'patrol':
                return 'Consulta la distribución completa de patrullaje.';

            case 'guard':
                return 'Consulta la distribución completa de guardianía.';

            case 'surveillance':
                return 'Consulta la distribución completa de vigilancia.';

            case 'dynamicRound':
                return 'Consulta la distribución completa de ronda dinámica.';

            case 'csiMonitoring':
                return 'Consulta todas las categorías de monitoreo CSI.';

            case 'towerOwners':
                return 'Consulta todos los propietarios de torre registrados.';

            case 'towerOwnerClassifications':
                return 'Consulta todas las clasificaciones de propietario.';

            default:
                return 'Consulta todos los registros disponibles.';
        }
    }


    // =====================================================
    // ICONO DEL MODAL
    // =====================================================

    get modalIcon(): string {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return 'location_city';

            case 'provinces':
                return 'map';

            case 'districts':
                return 'pin_drop';

            case 'zonales':
                return 'hub';

            case 'reactionCoverage':
                return 'shield';

            case 'patrol':
                return 'directions_car';

            case 'guard':
                return 'security';

            case 'surveillance':
                return 'visibility';

            case 'dynamicRound':
                return 'route';

            case 'csiMonitoring':
                return 'monitor_heart';

            case 'towerOwners':
                return 'domain';

            case 'towerOwnerClassifications':
                return 'category';

            default:
                return 'analytics';
        }
    }


    // =====================================================
    // COLOR DEL MODAL
    // =====================================================

    get modalColorClass(): string {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return 'departments';

            case 'provinces':
                return 'provinces';

            case 'districts':
                return 'districts';

            case 'zonales':
                return 'zonales';

            case 'reactionCoverage':
                return 'reactionCoverage';

            case 'patrol':
                return 'patrol';

            case 'guard':
                return 'guard';

            case 'surveillance':
                return 'surveillance';

            case 'dynamicRound':
                return 'dynamicRound';

            case 'csiMonitoring':
                return 'csiMonitoring';

            case 'towerOwners':
                return 'towerOwners';

            case 'towerOwnerClassifications':
                return 'towerOwnerClassifications';

            default:
                return 'departments';
        }
    }


    // =====================================================
    // PLACEHOLDER DEL BUSCADOR
    // =====================================================

    get modalSearchPlaceholder(): string {

        switch (
        this.modalDistributionType
        ) {

            case 'departments':
                return 'Buscar departamento...';

            case 'provinces':
                return 'Buscar provincia...';

            case 'districts':
                return 'Buscar distrito...';

            case 'zonales':
                return 'Buscar zonal...';

            case 'reactionCoverage':
                return 'Buscar categoría...';

            case 'patrol':
                return 'Buscar tipo de patrullaje...';

            case 'guard':
                return 'Buscar tipo de guardianía...';

            case 'surveillance':
                return 'Buscar tipo de vigilancia...';

            case 'dynamicRound':
                return 'Buscar tipo de ronda...';

            case 'csiMonitoring':
                return 'Buscar categoría CSI...';

            case 'towerOwners':
                return 'Buscar propietario...';

            case 'towerOwnerClassifications':
                return 'Buscar clasificación...';

            default:
                return 'Buscar...';
        }
    }


    // =====================================================
    // DISTRIBUCIÓN FILTRADA
    // =====================================================

    get filteredDistributionItems():
        DashboardDistribution[] {

        const search =
            this.distributionSearch
                .trim()
                .toLowerCase();

        if (!search) {

            return this.modalItems;
        }

        return this.modalItems.filter(
            item =>
                item.value
                    .toLowerCase()
                    .includes(search)
        );
    }


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    openDistribution(
        type: DistributionType
    ): void {

        this.modalDistributionType =
            type;

        this.distributionSearch =
            '';

        this.isDistributionModalOpen =
            true;

        document.body.classList.add(
            'dashboard-modal-open'
        );

        this.changeDetectorRef.detectChanges();
    }


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    closeDistribution(): void {

        this.isDistributionModalOpen =
            false;

        this.distributionSearch =
            '';

        document.body.classList.remove(
            'dashboard-modal-open'
        );

        this.changeDetectorRef.detectChanges();
    }


    // =====================================================
    // CLIC EN FONDO
    // =====================================================

    onBackdropClick(
        event: MouseEvent
    ): void {

        if (
            event.target ===
            event.currentTarget
        ) {

            this.closeDistribution();
        }
    }


    // =====================================================
    // ESCAPE
    // =====================================================

    @HostListener(
        'document:keydown.escape'
    )
    onEscape(): void {

        if (
            this.isDistributionModalOpen
        ) {

            this.closeDistribution();
        }
    }


    // =====================================================
    // BUSCAR
    // =====================================================

    onDistributionSearch(
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        this.distributionSearch =
            input.value;
    }


    // =====================================================
    // LIMPIAR BÚSQUEDA
    // =====================================================

    clearDistributionSearch(): void {

        this.distributionSearch =
            '';
    }


    // =====================================================
    // ESTADOS
    // =====================================================

    isLoading(): boolean {

        return this.loading;
    }


    hasError(): boolean {

        return this.error;
    }


    // =====================================================
    // REINTENTAR
    // =====================================================

    retry(): void {

        this.loadDashboard();
    }


    // =====================================================
    // SERVICIO
    // =====================================================

    constructor(
        private readonly dashboardService:
            DashboardService,

        private readonly changeDetectorRef:
            ChangeDetectorRef
    ) { }

}