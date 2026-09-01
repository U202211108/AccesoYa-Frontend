import {
    Component,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';


interface AlertItem {

    id: number;

    title: string;

    description: string;

    type: 'critical' | 'warning' | 'info';

    date: string;

    read: boolean;

}


@Component({

    selector: 'app-alerts',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './alerts.component.html',

    styleUrl:
        './alerts.component.scss'

})
export class AlertsComponent
    implements OnInit {


    // =====================================================
    // ALERTAS
    // =====================================================

    alerts: AlertItem[] = [

        {
            id: 1,

            title:
                'Información de un lugar requiere revisión',

            description:
                'Se ha detectado información que podría requerir una actualización en uno de los lugares registrados.',

            type:
                'warning',

            date:
                'Hoy, 10:35 a. m.',

            read:
                false
        },

        {
            id: 2,

            title:
                'Actualización del sistema',

            description:
                'AccesoYa cuenta con nuevas mejoras en la consulta y visualización de información.',

            type:
                'info',

            date:
                'Ayer, 4:20 p. m.',

            read:
                false
        },

        {
            id: 3,

            title:
                'Revisión pendiente',

            description:
                'Existe información pendiente de revisión dentro de la plataforma.',

            type:
                'warning',

            date:
                '28 ago. 2026',

            read:
                true
        }

    ];


    // =====================================================
    // FILTRO
    // =====================================================

    selectedFilter:
        'all' |
        'unread' |
        'read' =
        'all';


    ngOnInit(): void {

        this.loadAlerts();

    }


    // =====================================================
    // CARGAR ALERTAS
    // =====================================================

    private loadAlerts(): void {

        /*
         * Actualmente se utilizan datos locales.
         *
         * Posteriormente esta función puede conectarse
         * directamente con el backend de AccesoYa.
         */

    }


    // =====================================================
    // ALERTAS FILTRADAS
    // =====================================================

    get filteredAlerts(): AlertItem[] {

        if (
            this.selectedFilter ===
            'unread'
        ) {

            return this.alerts.filter(
                alert =>
                    !alert.read
            );

        }


        if (
            this.selectedFilter ===
            'read'
        ) {

            return this.alerts.filter(
                alert =>
                    alert.read
            );

        }


        return this.alerts;

    }


    // =====================================================
    // CONTADOR
    // =====================================================

    get unreadCount(): number {

        return this.alerts.filter(
            alert =>
                !alert.read
        ).length;

    }


    // =====================================================
    // MARCAR COMO LEÍDA
    // =====================================================

    markAsRead(
        alert: AlertItem
    ): void {

        alert.read = true;

    }


    // =====================================================
    // MARCAR TODAS
    // =====================================================

    markAllAsRead(): void {

        this.alerts =
            this.alerts.map(
                alert => ({
                    ...alert,
                    read: true
                })
            );

    }


    // =====================================================
    // FILTRO
    // =====================================================

    setFilter(
        filter:
            'all' |
            'unread' |
            'read'
    ): void {

        this.selectedFilter =
            filter;

    }


    // =====================================================
    // ICONO
    // =====================================================

    getAlertIcon(
        type: AlertItem['type']
    ): string {

        switch (type) {

            case 'critical':
                return 'error';

            case 'warning':
                return 'warning';

            default:
                return 'info';

        }

    }


    // =====================================================
    // ETIQUETA
    // =====================================================

    getAlertLabel(
        type: AlertItem['type']
    ): string {

        switch (type) {

            case 'critical':
                return 'Crítica';

            case 'warning':
                return 'Importante';

            default:
                return 'Información';

        }

    }

}