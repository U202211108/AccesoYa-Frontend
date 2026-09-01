import {
    Routes
} from '@angular/router';

import {
    authGuard
} from './core/guards/auth.guard';

import {
    guestGuard
} from './core/guards/guest.guard';

import {
    roleGuard
} from './core/guards/role.guard';

import {
    UserRole
} from './core/models/auth-user';


export const routes: Routes = [

    // =====================================================
    // INICIO
    // =====================================================

    {
        path: '',

        redirectTo: 'login',

        pathMatch: 'full'
    },


    // =====================================================
    // LOGIN
    // =====================================================

    {
        path: 'login',

        canActivate: [
            guestGuard
        ],

        loadComponent: () =>
            import(
                './features/iam/login/login.component'
            ).then(
                m => m.LoginComponent
            )
    },


    // =====================================================
    // REGISTRO
    // =====================================================

    {
        path: 'register',

        canActivate: [
            guestGuard
        ],

        loadComponent: () =>
            import(
                './features/iam/register/register.component'
            ).then(
                m => m.RegisterComponent
            )
    },


    // =====================================================
    // APLICACIÓN PROTEGIDA
    // =====================================================

    {
        path: '',

        canActivate: [
            authGuard
        ],

        loadComponent: () =>
            import(
                './layout/app-layout/app-layout.component'
            ).then(
                m => m.AppLayoutComponent
            ),

        children: [

            // =================================================
            // DASHBOARD
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'dashboard',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'CONSULTOR',
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/dashboard/dashboard.component'
                    ).then(
                        m => m.DashboardComponent
                    )
            },


            // =================================================
            // MAPA
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'places/map',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'CONSULTOR',
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/places/map/map.component'
                    ).then(
                        m => m.MapComponent
                    )
            },


            // =================================================
            // DETALLE DE SITIO
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'places/:id',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'CONSULTOR',
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/places/place-detail/place-detail.component'
                    ).then(
                        m => m.PlaceDetailComponent
                    )
            },

            // =================================================
            // PERFIL
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'profile',

                loadComponent: () =>
                    import(
                        './features/profile/profile.component'
                    ).then(
                        m => m.ProfileComponent
                    )
            },


            // =================================================
            // CONFIGURACIÓN
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'settings',

                loadComponent: () =>
                    import(
                        './features/settings/settings.component'
                    ).then(
                        m => m.SettingsComponent
                    )
            },


            // =================================================
            // NOTIFICACIONES
            // TODOS LOS ROLES
            // =================================================

            {
                path: 'notifications',

                loadComponent: () =>
                    import(
                        './features/notifications/notifications.component'
                    ).then(
                        m => m.NotificationsComponent
                    )
            },

            // =====================================================
            // ALERTAS
            // TODOS LOS ROLES
            // =====================================================

            {
                path: 'alerts',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'CONSULTOR',
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/alerts/alerts.component'
                    ).then(
                        m => m.AlertsComponent
                    )
            },


            // =====================================================
            // AYUDA
            // TODOS LOS ROLES
            // =====================================================

            {
                path: 'help',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'CONSULTOR',
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/help/help.component'
                    ).then(
                        m => m.HelpComponent
                    )
            },


            // =================================================
            // PLANOS
            // OPERADOR + SUPERVISOR + ADMIN
            // =================================================

            {
                path: 'plans',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'OPERADOR_FLNOC',
                        'SUPERVISOR',
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/plans/plan-management/plan-management.component'
                    ).then(
                        m => m.PlanManagementComponent
                    )
            },


            // =================================================
            // GESTIÓN DE USUARIOS
            // SOLO ADMIN
            // =================================================

            {
                path: 'admin/users',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'ADMIN'
                    ] as UserRole[]
                },

                loadComponent: () =>
                    import(
                        './features/admin/users/admin-users.component'
                    ).then(
                        m => m.AdminUsersComponent
                    )
            }

        ]
    },


    // =====================================================
    // RUTA NO ENCONTRADA
    // =====================================================

    {
        path: '**',

        redirectTo: 'dashboard'
    }

];