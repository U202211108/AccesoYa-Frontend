import {
    inject
} from '@angular/core';

import {
    CanActivateFn,
    Router
} from '@angular/router';

import {
    AuthService
} from '../services/auth.service';


export const authGuard: CanActivateFn = () => {

    const authService =
        inject(AuthService);

    const router =
        inject(Router);


    // =====================================================
    // VERIFICAR AUTENTICACIÓN
    // =====================================================

    if (
        authService.isAuthenticated()
    ) {

        return true;
    }


    // =====================================================
    // NO AUTENTICADO
    // =====================================================

    return router.createUrlTree([
        '/login'
    ]);
};