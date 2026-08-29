import {
    HttpInterceptorFn
} from '@angular/common/http';


export const authInterceptor: HttpInterceptorFn =
    (req, next) => {


        // =====================================================
        // ENDPOINTS PÚBLICOS DE AUTENTICACIÓN
        // =====================================================

        const isPublicAuthEndpoint =
            req.url.endsWith('/api/auth/login') ||
            req.url.endsWith('/api/auth/register');


        // -----------------------------------------------------
        // Login y registro NO necesitan JWT
        // -----------------------------------------------------

        if (isPublicAuthEndpoint) {

            return next(req);
        }


        // =====================================================
        // OBTENER TOKEN
        // =====================================================

        const token =
            sessionStorage.getItem(
                'access_token'
            );


        // -----------------------------------------------------
        // Si no existe token
        // -----------------------------------------------------

        if (!token) {

            return next(req);
        }


        // =====================================================
        // AGREGAR JWT
        // =====================================================

        const authenticatedRequest =
            req.clone({

                setHeaders: {

                    Authorization:
                        `Bearer ${token}`

                }

            });


        return next(
            authenticatedRequest
        );
    };