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
    // ACTUALIZACIÓN DE SESIÓN
    // =====================================================

    private sessionRefreshInProgress = false;


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

    refreshUserState(): void {

        const user =
            this.authService.getCurrentUser();

        this.currentRole =
            user?.role ?? null;

        console.log(
            'Estado del usuario actualizado:',
            user
        );

        console.log(
            'Nuevo rol:',
            this.currentRole
        );

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


                    // -----------------------------------------
                    // COMPROBAR APROBACIÓN
                    // -----------------------------------------

                    this.checkEstablishmentApproval();


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
    // DETECTAR APROBACIÓN
    // =====================================================

    private checkEstablishmentApproval(): void {

        // -----------------------------------------
        // OBTENER ROL ACTUAL
        // -----------------------------------------

        const currentRole =
            this.authService.getCurrentRole();


        console.log(
            'Rol actual al comprobar aprobación:',
            currentRole
        );


        // -----------------------------------------
        // SOLO USER NECESITA ACTUALIZACIÓN
        // -----------------------------------------

        if (
            currentRole !== 'USER'
        ) {

            return;
        }


        // -----------------------------------------
        // EVITAR PETICIONES SIMULTÁNEAS
        // -----------------------------------------

        if (
            this.sessionRefreshInProgress
        ) {

            return;
        }


        // -----------------------------------------
        // BUSCAR APROBACIÓN NO LEÍDA
        // -----------------------------------------

        const approvalNotification =
            this.notifications.find(
                notification =>
                    notification.type ===
                    'ESTABLISHMENT_APPROVED' &&
                    notification.read === false
            );


        if (!approvalNotification) {

            return;
        }


        console.log(
            'Solicitud de establecimiento aprobada.',
            approvalNotification
        );


        // -----------------------------------------
        // ACTIVAR BLOQUEO
        // -----------------------------------------

        this.sessionRefreshInProgress =
            true;


        // -----------------------------------------
        // GENERAR NUEVO JWT
        // -----------------------------------------

        this.authService
            .refreshSession()
            .subscribe({

                next: response => {

                    console.log(
                        'Sesión actualizada correctamente.'
                    );

                    console.log(
                        'Nuevo rol:',
                        response.role
                    );


                    // =========================================
                    // ACTUALIZAR ROL DEL LAYOUT
                    // =========================================

                    this.currentRole =
                        response.role as UserRole;


                    // =========================================
                    // LIBERAR BLOQUEO
                    // =========================================

                    this.sessionRefreshInProgress =
                        false;


                    // =========================================
                    // ACTUALIZAR INTERFAZ
                    // =========================================

                    this.changeDetector.detectChanges();


                    // =========================================
                    // CONFIRMAR CAMBIO
                    // =========================================

                    if (
                        this.currentRole ===
                        'ESTABLISHMENT'
                    ) {

                        console.log(
                            'Usuario convertido a ESTABLISHMENT.'
                        );
                    }
                },


                error: error => {

                    console.error(
                        'Error actualizando la sesión:',
                        error
                    );


                    this.sessionRefreshInProgress =
                        false;


                    this.changeDetector.detectChanges();
                }

            });
    }

    getCurrentRoleLabel(): string {

        switch (this.currentRole) {

            case 'USER':
                return 'Usuario';

            case 'ESTABLISHMENT':
                return 'Establecimiento';

            case 'MODERATOR':
                return 'Moderador';

            case 'ADMIN':
                return 'Administrador';

            default:
                return 'Usuario';
        }
    }


    // =====================================================
    // ACTUALIZAR CONTADOR
    // =====================================================

    updateUnreadCount(): void {

        this.unreadCount =
            this.notifications.filter(
                notification =>
                    notification.read === false
            ).length;
    }


    // =====================================================
    // ABRIR / CERRAR PANEL
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

        console.log(
            'Notificación seleccionada:',
            notification
        );


        // -----------------------------------------
        // CERRAR PANEL
        // -----------------------------------------

        this.notificationPanelOpen =
            false;


        // -----------------------------------------
        // SI YA ESTÁ LEÍDA
        // -----------------------------------------

        if (notification.read) {

            this.navigateFromNotification(
                notification
            );

            return;
        }


        // -----------------------------------------
        // MARCAR COMO LEÍDA
        // -----------------------------------------

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


                    // Aunque falle el PATCH,
                    // permitimos abrirla.

                    this.navigateFromNotification(
                        notification
                    );
                }

            });
    }


    // =====================================================
    // MARCAR COMO LEÍDA
    // =====================================================

    markAsRead(
        notification: Notification
    ): void {

        if (
            notification.read
        ) {

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


                    this.unreadCount =
                        0;


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
    // VER TODAS LAS NOTIFICACIONES
    // =====================================================

    viewAllNotifications(): void {

        this.notificationPanelOpen =
            false;


        this.router.navigate([
            '/notifications'
        ]);
    }


    // =====================================================
    // NAVEGACIÓN SEGÚN NOTIFICACIÓN
    // =====================================================

    navigateFromNotification(
        notification: Notification
    ): void {

        switch (
        notification.type
        ) {

            // =============================================
            // SOLICITUD CREADA
            // =============================================

            case 'ESTABLISHMENT_REQUEST_CREATED':

                this.router.navigate([
                    '/establishment/requests'
                ]);

                break;


            // =============================================
            // ESTABLECIMIENTO APROBADO
            // =============================================

            case 'ESTABLISHMENT_APPROVED':

                this.router.navigate([
                    '/establishments'
                ]);

                break;


            // =============================================
            // ESTABLECIMIENTO RECHAZADO
            // =============================================

            case 'ESTABLISHMENT_REJECTED':

                this.router.navigate([
                    '/establishment/requests'
                ]);

                break;


            // =============================================
            // ACCESIBILIDAD ACTUALIZADA
            // =============================================

            case 'ACCESSIBILITY_UPDATED':

                if (
                    notification.relatedEntityId
                ) {

                    this.router.navigate(
                        [
                            '/establishments/accessibility'
                        ],
                        {
                            queryParams: {
                                placeId:
                                    notification.relatedEntityId
                            }
                        }
                    );

                } else {

                    this.router.navigate([
                        '/establishments'
                    ]);
                }

                break;


            // =============================================
            // ESTABLECIMIENTO ACTUALIZADO
            // =============================================

            case 'ESTABLISHMENT_UPDATED':

                this.router.navigate([
                    '/establishments'
                ]);

                break;


            // =============================================
            // SISTEMA
            // =============================================

            case 'SYSTEM':

                console.log(
                    'Notificación del sistema:',
                    notification
                );

                break;


            // =============================================
            // DEFAULT
            // =============================================

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