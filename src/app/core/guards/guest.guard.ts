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


export const guestGuard: CanActivateFn = () => {

    const authService =
        inject(AuthService);

    const router =
        inject(Router);


    console.log(
        'GUEST GUARD - autenticado:',
        authService.isAuthenticated()
    );

    console.log(
        'GUEST GUARD - token:',
        authService.getToken()
    );


    if (
        authService.isAuthenticated()
    ) {

        return router.createUrlTree([
            '/dashboard'
        ]);
    }


    return true;
};