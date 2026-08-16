import {
    inject
} from '@angular/core';

import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router
} from '@angular/router';

import {
    AuthService
} from '../services/auth.service';

import {
    UserRole
} from '../models/auth-user';


export const roleGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot
) => {

    const authService =
        inject(AuthService);

    const router =
        inject(Router);


    // =====================================================
    // VERIFICAR AUTENTICACIÓN
    // =====================================================

    if (
        !authService.isAuthenticated()
    ) {

        return router.createUrlTree([
            '/login'
        ]);
    }


    // =====================================================
    // ROLES PERMITIDOS
    // =====================================================

    const allowedRoles =
        route.data['roles'] as UserRole[] | undefined;


    // Si no se especificaron roles,
    // cualquier usuario autenticado puede acceder.

    if (
        !allowedRoles ||
        allowedRoles.length === 0
    ) {

        return true;
    }


    // =====================================================
    // ROL ACTUAL
    // =====================================================

    const currentRole =
        authService.getCurrentRole();


    if (!currentRole) {

        return router.createUrlTree([
            '/dashboard'
        ]);
    }


    // =====================================================
    // VALIDAR ROL
    // =====================================================

    if (
        allowedRoles.includes(
            currentRole
        )
    ) {

        return true;
    }


    // =====================================================
    // SIN PERMISOS
    // =====================================================

    return router.createUrlTree([
        '/dashboard'
    ]);
};