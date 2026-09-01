import {
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    Router,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
} from '@angular/router';

import {
    takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
    timer
} from 'rxjs';

import {
    switchMap
} from 'rxjs/operators';

import {
    UserRole
} from '../../core/models/auth-user';

import {
    AuthService
} from '../../core/services/auth.service';

import {
    NotificationService
} from '../../core/services/notification.service';

import {
    Notification,
    NotificationType
} from '../../core/models/notification';


@Component({

    selector: 'app-layout',

    standalone: true,

    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        RouterOutlet
    ],

    templateUrl:
        './app-layout.component.html',

    styleUrl:
        './app-layout.component.scss'
})
export class AppLayoutComponent
    implements OnInit {


    // =====================================================
    // USUARIO
    // =====================================================

    currentRole:
        UserRole | null = null;


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly router =
        inject(Router);

    readonly authService =
        inject(AuthService);

    private readonly notificationService =
        inject(NotificationService);

    private readonly changeDetector =
        inject(ChangeDetectorRef);

    private readonly destroyRef =
        inject(DestroyRef);


    // =====================================================
    // SIDEBAR
    // =====================================================

    sidebarOpen = true;


    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    notifications:
        Notification[] = [];


    unreadCount = 0;


    notificationPanelOpen =
        false;


    loadingNotifications =
        false;

    notificationsEnabled = true;


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.currentRole =
            this.authService.getCurrentRole();

        this.loadNotificationPreference();


        if (this.notificationsEnabled) {

            this.loadNotifications();

        } else {

            this.notifications = [];

            this.unreadCount = 0;

        }

        this.loadNotifications();

        this.startNotificationPolling();
    }

    // =====================================================
    // ESTADO DE NOTIFICACIONES
    // =====================================================

    private loadNotificationPreference(): void {

        const settings =
            localStorage.getItem('app_settings');


        if (!settings) {

            this.notificationsEnabled = true;

            return;
        }


        try {

            const data =
                JSON.parse(settings);


            this.notificationsEnabled =
                data.notificationsEnabled ?? true;


        } catch (error) {

            console.error(
                'Error leyendo preferencia de notificaciones:',
                error
            );

            this.notificationsEnabled = true;
        }

    }


    // =====================================================
    // ACTUALIZAR ESTADO DEL USUARIO
    // =====================================================

    refreshUserState(): void {

        const user =
            this.authService.getCurrentUser();

        this.currentRole =
            user?.role ?? null;

        this.changeDetector.detectChanges();
    }


    // =====================================================
    // CARGAR NOTIFICACIONES
    // =====================================================

    loadNotifications(): void {

        this.loadNotificationPreference();


        if (!this.notificationsEnabled) {

            this.notifications = [];

            this.unreadCount = 0;

            this.changeDetector.detectChanges();

            return;
        }


        this.notificationService
            .getNotifications()
            .subscribe({

                next: notifications => {

                    console.log(
                        'Notificaciones recibidas:',
                        notifications
                    );


                    this.notifications =
                        notifications ?? [];


                    this.updateUnreadCount();


                    this.changeDetector.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error cargando notificaciones:',
                        error
                    );


                    this.notifications = [];

                    this.unreadCount = 0;


                    this.changeDetector.detectChanges();

                }

            });

    }


    // =====================================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // =====================================================

    private startNotificationPolling(): void {

        timer(15000, 15000)
            .pipe(

                switchMap(() =>
                    this.notificationService
                        .getUnreadNotifications()
                ),

                takeUntilDestroyed(
                    this.destroyRef
                )

            )
            .subscribe({

                next: unreadNotifications => {

                    this.mergeUnreadNotifications(
                        unreadNotifications ?? []
                    );

                    this.changeDetector.detectChanges();
                },

                error: error => {

                    console.error(
                        'Error actualizando notificaciones:',
                        error
                    );
                }

            });
    }


    // =====================================================
    // MEZCLAR NO LEÍDAS
    // =====================================================

    private mergeUnreadNotifications(
        unreadNotifications: Notification[]
    ): void {

        const unreadIds =
            new Set(
                unreadNotifications.map(
                    notification =>
                        notification.id
                )
            );


        const readNotifications =
            this.notifications.filter(
                notification =>
                    notification.read &&
                    !unreadIds.has(
                        notification.id
                    )
            );


        this.notifications = [
            ...unreadNotifications,
            ...readNotifications
        ];


        this.notifications =
            this.sortNotifications(
                this.notifications
            );


        this.updateUnreadCount();
    }


    // =====================================================
    // ORDENAR
    // =====================================================

    private sortNotifications(
        notifications: Notification[]
    ): Notification[] {

        return [...notifications].sort(
            (a, b) =>
                new Date(
                    b.createdAt
                ).getTime()
                -
                new Date(
                    a.createdAt
                ).getTime()
        );
    }


    // =====================================================
    // ETIQUETA DEL ROL
    // =====================================================

    getCurrentRoleLabel(): string {

        switch (this.currentRole) {

            case 'CONSULTOR':
                return 'Consultor';

            case 'OPERADOR_FLNOC':
                return 'Operador FLM/NOC';

            case 'SUPERVISOR':
                return 'Supervisor';

            case 'ADMIN':
                return 'Administrador';

            default:
                return 'Usuario';
        }
    }


    // =====================================================
    // CONTADOR
    // =====================================================

    updateUnreadCount(): void {

        this.unreadCount =
            this.notifications.filter(
                notification =>
                    !notification.read
            ).length;
    }


    // =====================================================
    // ABRIR PANEL
    // =====================================================

    toggleNotifications(): void {

        this.loadNotificationPreference();


        if (!this.notificationsEnabled) {

            this.notificationPanelOpen = false;

            this.notifications = [];

            this.unreadCount = 0;

            this.changeDetector.detectChanges();

            return;
        }


        this.notificationPanelOpen =
            !this.notificationPanelOpen;


        if (this.notificationPanelOpen) {

            this.loadNotifications();

        }

    }

    // =====================================================
    // ALERTAS
    // =====================================================

    openAlerts(): void {

        this.router.navigate([
            '/alerts'
        ]);

    }


    // =====================================================
    // AYUDA
    // =====================================================

    openHelp(): void {

        this.router.navigate([
            '/help'
        ]);

    }


    // =====================================================
    // ABRIR NOTIFICACIÓN
    // =====================================================

    openNotification(
        notification: Notification
    ): void {

        this.notificationPanelOpen =
            false;


        if (notification.read) {

            this.navigateFromNotification(
                notification
            );

            return;
        }


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

                    this.changeDetector.detectChanges();

                    this.navigateFromNotification(
                        notification
                    );
                },

                error: error => {

                    console.error(
                        'Error marcando notificación como leída:',
                        error
                    );

                    this.navigateFromNotification(
                        notification
                    );
                }

            });
    }


    // =====================================================
    // MARCAR UNA
    // =====================================================

    markAsRead(
        notification: Notification
    ): void {

        if (notification.read) {

            return;
        }


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

                    this.changeDetector.detectChanges();
                },

                error: error => {

                    console.error(
                        'Error marcando notificación:',
                        error
                    );
                }

            });
    }


    // =====================================================
    // MARCAR TODAS
    // =====================================================

    markAllNotificationsAsRead(): void {

        if (
            this.unreadCount === 0
        ) {

            return;
        }


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


                    this.unreadCount =
                        0;


                    this.changeDetector.detectChanges();
                },

                error: error => {

                    console.error(
                        'Error marcando todas las notificaciones:',
                        error
                    );
                }

            });
    }


    // =====================================================
    // VER TODAS
    // =====================================================

    viewAllNotifications(): void {

        this.notificationPanelOpen =
            false;


        this.router.navigate([
            '/notifications'
        ]);
    }


    // =====================================================
    // ICONO
    // =====================================================

    getNotificationIcon(
        type: Notification['type']
    ): string {

        switch (type) {

            case 'USER_ROLE_CHANGED':
                return 'manage_accounts';

            case 'USER_STATUS_CHANGED':
                return 'admin_panel_settings';

            case 'SYSTEM':
            default:
                return 'notifications';
        }
    }


    // =====================================================
    // CLASE VISUAL
    // =====================================================

    getNotificationClass(
        type: NotificationType
    ): string {

        switch (type) {

            case 'USER_STATUS_CHANGED':
                return 'rejected';

            default:
                return 'info';
        }
    }

    getNotificationTypeClass(
        type: Notification['type']
    ): string {

        switch (type) {

            case 'USER_ROLE_CHANGED':
                return 'role';

            case 'USER_STATUS_CHANGED':
                return 'status';

            case 'SYSTEM':
            default:
                return 'info';
        }
    }


    // =====================================================
    // ETIQUETA
    // =====================================================

    getNotificationTypeLabel(
        type: NotificationType
    ): string {

        switch (type) {

            case 'USER_STATUS_CHANGED':
                return 'Estado de cuenta';

            case 'SYSTEM':
            default:
                return 'Sistema';
        }
    }


    // =====================================================
    // NAVEGACIÓN
    // =====================================================

    navigateFromNotification(
        notification: Notification
    ): void {

        switch (notification.type) {

            // =====================================================
            // USUARIOS
            // =====================================================

            case 'USER_ROLE_CHANGED':
            case 'USER_STATUS_CHANGED':

                this.router.navigate([
                    '/admin/users'
                ]);

                break;


            // =====================================================
            // SISTEMA
            // =====================================================

            case 'SYSTEM':

                console.log(
                    'Notificación del sistema:',
                    notification
                );

                break;


            // =====================================================
            // DESCONOCIDO
            // =====================================================

            default:

                console.warn(
                    'Tipo de notificación no reconocido:',
                    notification.type
                );

                break;
        }

    }


    // =====================================================
    // SIDEBAR
    // =====================================================

    toggleSidebar(): void {

        this.sidebarOpen =
            !this.sidebarOpen;

        this.changeDetector.detectChanges();
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    logout(): void {

        this.authService.logout();

        this.notificationPanelOpen =
            false;

        this.router.navigate([
            '/login'
        ]);
    }
}