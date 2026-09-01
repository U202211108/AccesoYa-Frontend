import {
    ChangeDetectorRef,
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    Notification,
    NotificationType
} from '../../core/models/notification';

import {
    NotificationService
} from '../../core/services/notification.service';


@Component({

    selector: 'app-notifications',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './notifications.component.html',

    styleUrl:
        './notifications.component.scss'
})
export class NotificationsComponent
    implements OnInit {


    private readonly notificationService =
        inject(NotificationService);


    private readonly changeDetectorRef =
        inject(ChangeDetectorRef);


    // =====================================================
    // ESTADO
    // =====================================================

    notifications:
        Notification[] = [];


    loading = false;


    markingAllAsRead = false;


    markingAsReadId:
        string | null = null;


    errorMessage = '';


    successMessage = '';


    activeFilter:
        'ALL' | 'UNREAD' | 'READ' = 'ALL';


    unreadCount = 0;


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.loadNotifications();

    }


    // =====================================================
    // CARGAR NOTIFICACIONES
    // =====================================================

    loadNotifications(): void {

        if (this.loading) {

            return;
        }


        this.loading = true;

        this.errorMessage = '';

        this.successMessage = '';


        this.changeDetectorRef.detectChanges();


        this.notificationService
            .getNotifications()
            .subscribe({

                next: notifications => {

                    this.notifications =
                        notifications ?? [];


                    this.updateUnreadCount();


                    this.loading = false;


                    this.changeDetectorRef.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error cargando notificaciones:',
                        error
                    );


                    this.loading = false;


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudieron cargar las notificaciones.';


                    this.changeDetectorRef.detectChanges();

                }

            });
    }


    // =====================================================
    // ACTUALIZAR
    // =====================================================

    refresh(): void {

        if (this.loading) {

            return;
        }


        this.loadNotifications();
    }


    // =====================================================
    // CONTADOR
    // =====================================================

    private updateUnreadCount(): void {

        this.unreadCount =
            this.notifications.filter(
                notification =>
                    !notification.read
            ).length;
    }


    // =====================================================
    // FILTRADO
    // =====================================================

    get filteredNotifications():
        Notification[] {

        switch (this.activeFilter) {

            case 'UNREAD':

                return this.notifications.filter(
                    notification =>
                        !notification.read
                );


            case 'READ':

                return this.notifications.filter(
                    notification =>
                        notification.read
                );


            default:

                return this.notifications;
        }
    }


    // =====================================================
    // CAMBIAR FILTRO
    // =====================================================

    setFilter(
        filter: 'ALL' | 'UNREAD' | 'READ'
    ): void {

        this.activeFilter =
            filter;


        this.changeDetectorRef.detectChanges();
    }


    // =====================================================
    // MARCAR UNA COMO LEÍDA
    // =====================================================

    markAsRead(
        notification: Notification
    ): void {

        if (
            notification.read ||
            this.markingAsReadId !== null ||
            this.markingAllAsRead
        ) {

            return;
        }


        this.markingAsReadId =
            notification.id;


        this.errorMessage = '';

        this.successMessage = '';


        this.changeDetectorRef.detectChanges();


        this.notificationService
            .markAsRead(
                notification.id
            )
            .subscribe({

                next: () => {

                    this.notifications =
                        this.notifications.map(
                            item => {

                                if (
                                    item.id ===
                                    notification.id
                                ) {

                                    return {
                                        ...item,
                                        read: true
                                    };
                                }


                                return item;

                            }
                        );


                    this.updateUnreadCount();


                    this.markingAsReadId =
                        null;


                    this.changeDetectorRef.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error marcando notificación:',
                        error
                    );


                    this.markingAsReadId =
                        null;


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo marcar la notificación como leída.';


                    this.changeDetectorRef.detectChanges();

                }

            });
    }


    // =====================================================
    // MARCAR TODAS COMO LEÍDAS
    // =====================================================

    markAllAsRead(): void {

        if (
            this.unreadCount === 0 ||
            this.markingAllAsRead ||
            this.markingAsReadId !== null
        ) {

            return;
        }


        this.markingAllAsRead =
            true;


        this.errorMessage = '';

        this.successMessage = '';


        this.changeDetectorRef.detectChanges();


        this.notificationService
            .markAllAsRead()
            .subscribe({

                next: () => {

                    this.notifications =
                        this.notifications.map(
                            notification => ({
                                ...notification,
                                read: true
                            })
                        );


                    this.unreadCount = 0;


                    this.markingAllAsRead =
                        false;


                    this.successMessage =
                        'Todas las notificaciones fueron marcadas como leídas.';


                    this.changeDetectorRef.detectChanges();


                    setTimeout(() => {

                        this.successMessage = '';

                        this.changeDetectorRef.detectChanges();

                    }, 3500);

                },


                error: error => {

                    console.error(
                        'Error marcando todas como leídas:',
                        error
                    );


                    this.markingAllAsRead =
                        false;


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudieron marcar todas las notificaciones como leídas.';


                    this.changeDetectorRef.detectChanges();

                }

            });
    }


    // =====================================================
    // ICONO
    // =====================================================

    getNotificationIcon(
        type: NotificationType
    ): string {

        switch (type) {

            case 'USER_ROLE_CHANGED':
                return 'manage_accounts';

            case 'USER_STATUS_CHANGED':
                return 'admin_panel_settings';

            case 'SYSTEM':
                return 'settings';

            default:
                return 'notifications';
        }
    }


    // =====================================================
    // ETIQUETA DEL TIPO
    // =====================================================

    getNotificationTypeLabel(
        type: NotificationType
    ): string {

        switch (type) {

            case 'USER_ROLE_CHANGED':
                return 'Cambio de rol';

            case 'USER_STATUS_CHANGED':
                return 'Estado de cuenta';

            case 'SYSTEM':
                return 'Sistema';

            default:
                return 'Notificación';
        }
    }


    // =====================================================
    // CLASE VISUAL
    // =====================================================

    getNotificationTypeClass(
        type: NotificationType
    ): string {

        switch (type) {

            case 'USER_ROLE_CHANGED':
                return 'role-changed';

            case 'USER_STATUS_CHANGED':
                return 'status-changed';

            case 'SYSTEM':
            default:
                return 'system';
        }
    }


    // =====================================================
    // FECHA
    // =====================================================

    formatDate(
        date: string
    ): string {

        if (!date) {

            return '';
        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return date;
        }


        return new Intl.DateTimeFormat(
            'es-PE',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        ).format(parsedDate);
    }


    // =====================================================
    // TRACK
    // =====================================================

    trackById(
        _index: number,
        notification: Notification
    ): string {

        return notification.id;
    }
}