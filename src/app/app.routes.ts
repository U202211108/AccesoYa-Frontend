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
            // =================================================

            {
                path: 'dashboard',

                loadComponent: () =>
                    import(
                        './features/dashboard/dashboard.component'
                    ).then(
                        m => m.DashboardComponent
                    )
            },


            // =================================================
            // MAPA
            // =================================================

            {
                path: 'places/map',

                loadComponent: () =>
                    import(
                        './features/places/map/map.component'
                    ).then(
                        m => m.MapComponent
                    )
            },


            // =================================================
            // DETALLE DE LUGAR
            // =================================================

            {
                path: 'places/:id',

                loadComponent: () =>
                    import(
                        './features/places/place-detail/place-detail.component'
                    ).then(
                        m => m.PlaceDetailComponent
                    )
            },


            // =================================================
            // FAVORITOS
            // TODOS LOS USUARIOS
            // =================================================

            {
                path: 'favorites',

                loadComponent: () =>
                    import(
                        './features/favorites/favorites.component'
                    ).then(
                        m => m.FavoritesComponent
                    )
            },


            // =================================================
            // MI PERFIL
            // TODOS LOS USUARIOS
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
            // TODOS LOS USUARIOS
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
            // SOLICITAR ESTABLECIMIENTO
            // SOLO USER
            // =================================================

            {
                path: 'establishment/request',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'USER' as UserRole
                    ]
                },

                loadComponent: () =>
                    import(
                        './features/establishments/request/establishment-request.component'
                    ).then(
                        m => m.EstablishmentRequestComponent
                    )
            },


            // =================================================
            // MIS SOLICITUDES
            // USER + ESTABLISHMENT
            // =================================================

            {
                path: 'establishment/requests',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'USER' as UserRole,
                        'ESTABLISHMENT' as UserRole
                    ]
                },

                loadComponent: () =>
                    import(
                        './features/establishments/my-requests/my-requests.component'
                    ).then(
                        m => m.MyRequestsComponent
                    )
            },

            {
                path: 'plans',
                loadComponent: () =>
                    import(
                        './features/plans/plan-management/plan-management.component'
                    ).then(
                        m => m.PlanManagementComponent
                    )
            },


            // =================================================
            // MIS ESTABLECIMIENTOS
            // SOLO ESTABLISHMENT
            // =================================================

            {
                path: 'establishments',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'ESTABLISHMENT' as UserRole
                    ]
                },

                loadComponent: () =>
                    import(
                        './features/establishments/my-establishments/my-establishments.component'
                    ).then(
                        m => m.MyEstablishmentsComponent
                    )
            },


            // =================================================
            // ACCESIBILIDAD
            // SOLO ESTABLISHMENT
            // =================================================

            {
                path: 'establishments/accessibility',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'ESTABLISHMENT' as UserRole
                    ]
                },

                loadComponent: () =>
                    import(
                        './features/establishments/accessibility/accessibility.component'
                    ).then(
                        m => m.AccessibilityComponent
                    )
            },


            // =================================================
            // MODERACIÓN
            // MODERATOR + ADMIN
            // =================================================

            {
                path: 'moderator/requests',

                canActivate: [
                    roleGuard
                ],

                data: {
                    roles: [
                        'MODERATOR' as UserRole,
                        'ADMIN' as UserRole
                    ]
                },

                loadComponent: () =>
                    import(
                        './features/moderator/requests/moderator-requests.component'
                    ).then(
                        m => m.ModeratorRequestsComponent
                    )
            }

        ]
    },


    // =====================================================
    // RUTA NO ENCONTRADA
    // =====================================================

    {
        path: '**',

        redirectTo: 'login'
    }

];