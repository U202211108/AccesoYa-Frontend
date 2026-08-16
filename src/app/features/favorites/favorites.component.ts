import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    Router
} from '@angular/router';


interface FavoritePlace {

    id: string;

    name: string;

    address: string;

    type: string;

    description?: string;

}


@Component({
    selector: 'app-favorites',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './favorites.component.html',

    styleUrl:
        './favorites.component.scss'
})
export class FavoritesComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly router =
        inject(Router);


    // =====================================================
    // ESTADO
    // =====================================================

    favorites:
        FavoritePlace[] = [];


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadFavorites();
    }


    // =====================================================
    // CARGAR FAVORITOS
    // =====================================================

    loadFavorites(): void {

        const stored =
            localStorage.getItem(
                'favorite_places'
            );


        if (!stored) {

            this.favorites = [];

            return;
        }


        try {

            this.favorites =
                JSON.parse(
                    stored
                ) as FavoritePlace[];

        } catch (error) {

            console.error(
                'Error leyendo favoritos:',
                error
            );

            this.favorites = [];
        }
    }


    // =====================================================
    // ELIMINAR FAVORITO
    // =====================================================

    removeFavorite(
        placeId: string
    ): void {

        this.favorites =
            this.favorites.filter(
                place =>
                    place.id !== placeId
            );


        localStorage.setItem(
            'favorite_places',
            JSON.stringify(
                this.favorites
            )
        );
    }


    // =====================================================
    // IR AL MAPA
    // =====================================================

    goToMap(): void {

        this.router.navigate([
            '/places/map'
        ]);
    }


    // =====================================================
    // VER LUGAR
    // =====================================================

    goToPlace(
        placeId: string
    ): void {

        this.router.navigate([
            '/places',
            placeId
        ]);
    }

}