import {
    Component,
    OnInit,
    ChangeDetectorRef,
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
    UserRole
} from '../../core/models/auth-user';

import {
    AuthService
} from '../../core/services/auth.service';

import {
    NotificationService
} from '../../core/services/notification.service';

import {
    Notification
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

    currentRole: UserRole | null = null;


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


    // =====================================================
    // SIDEBAR
    // =====================================================

    sidebarOpen = true;


    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    notifications: Notification[] = [];

    unreadCount = 0;

    notificationPanelOpen = false;


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.currentRole =
            this.authService.getCurrentRole();

        console.log(
            'Rol actual en AppLayout:',
            this.currentRole
        );

        this.loadNotifications();

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
    // CONTADOR DE NO LEÍDAS
    // =====================================================

    updateUnreadCount(): void {

        this.unreadCount =
            this.notifications.filter(
                notification =>
                    notification.read === false
            ).length;

    }


    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    toggleNotifications(): void {

        this.notificationPanelOpen =
            !this.notificationPanelOpen;

        this.changeDetector.detectChanges();

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

                    notification.read =
                        true;

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
    // MARCAR UNA COMO LEÍDA
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

                    notification.read =
                        true;

                    this.updateUnreadCount();

                    this.changeDetector.detectChanges();

                },

                error: error => {

                    console.error(
                        'Error marcando notificación como leída:',
                        error
                    );

                }

            });

    }


    // =====================================================
    // MARCAR TODAS COMO LEÍDAS
    // =====================================================

    markAllNotificationsAsRead(): void {

        if (
            this.notifications.length === 0 ||
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

                    this.unreadCount = 0;

                    this.changeDetector.detectChanges();

                },

                error: error => {

                    console.error(
                        'Error marcando todas las notificaciones como leídas:',
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
    // NAVEGACIÓN DE NOTIFICACIONES
    // =====================================================

    navigateFromNotification(
        notification: Notification
    ): void {

        switch (notification.type) {

            case 'SITE_CREATED':
            case 'SITE_UPDATED':
            case 'SITE_STATUS_CHANGED':
            case 'FLM_NOC_UPDATED':
            case 'PLAN_DOCUMENT_UPLOADED':
            case 'PLAN_DOCUMENT_UPDATED':

                console.log(
                    'Notificación operacional:',
                    notification
                );

                break;

            case 'SYSTEM':

                console.log(
                    'Notificación del sistema:',
                    notification
                );

                break;

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