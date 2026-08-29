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


    const authenticated =
        authService.isAuthenticated();


    console.log(
        'GUEST GUARD - autenticado:',
        authenticated
    );


    if (authenticated) {

        return router.createUrlTree([
            '/dashboard'
        ]);
    }


    return true;
};