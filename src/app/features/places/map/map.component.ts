import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject
} from '@angular/core';

import {
  Router,
  ActivatedRoute
} from '@angular/router';

import * as L from 'leaflet';

import 'leaflet.markercluster';

import {
  Subject,
  debounceTime,
  switchMap,
  takeUntil,
  catchError,
  of
} from 'rxjs';

import {
  PlaceService
} from '../../../core/services/place.service';

import {
  PlaceMapResponse
} from '../../../core/models/place-map-response';


interface CategoryMarker extends L.Marker {
  placeType?: string;
}


@Component({
  selector: 'app-map',

  templateUrl:
    './map.component.html',

  styleUrl:
    './map.component.scss'
})
export class MapComponent
  implements AfterViewInit, OnDestroy {


  // =====================================================
  // DEPENDENCIAS
  // =====================================================

  private readonly placeService =
    inject(PlaceService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  private readonly destroy$ =
    new Subject<void>();

  private readonly mapMove$ =
    new Subject<void>();


  // =====================================================
  // LUGARES
  // =====================================================

  private allPlaces:
    PlaceMapResponse[] = [];

  searchTerm = '';

  searchResults:
    PlaceMapResponse[] = [];


  private readonly placeMarkers =
    new Map<string, L.Marker>();


  // =====================================================
  // CATEGORÍAS
  // =====================================================

  readonly selectedCategories =
    new Set<string>();


  isFilterPanelOpen =
    false;


  // =====================================================
  // MAPA
  // =====================================================

  private map!: L.Map;

  private markersLayer!:
    L.MarkerClusterGroup;


  private readonly peruCenter:
    L.LatLngExpression = [
      -9.19,
      -75.015
    ];


  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngAfterViewInit(): void {

    this.initializeMap();

    this.configureMapLoading();

    this.configureRouteFilters();

    this.loadPlaces();
  }


  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

    this.mapMove$.complete();

    if (this.map) {
      this.map.remove();
    }
  }


  // =====================================================
  // LEER FILTRO DESDE LA URL
  // =====================================================

  private configureRouteFilters(): void {

    this.route.queryParams
      .pipe(
        takeUntil(
          this.destroy$
        )
      )
      .subscribe(params => {

        const categoryParam =
          params['category'];


        // -----------------------------------------------
        // SIN CATEGORÍA
        // -----------------------------------------------

        if (!categoryParam) {

          this.selectedCategories.clear();

          this.applyCategoryFilters();

          return;
        }


        // -----------------------------------------------
        // CATEGORÍAS
        //
        // Permitimos:
        //
        // ?category=HEALTHCARE
        //
        // o:
        //
        // ?category=HEALTHCARE,BANK
        // -----------------------------------------------

        const categories =
          String(categoryParam)
            .split(',')
            .map(
              category =>
                category
                  .trim()
                  .toUpperCase()
            )
            .filter(
              category =>
                category.length > 0
            );


        this.selectedCategories.clear();


        categories.forEach(
          category => {

            this.selectedCategories.add(
              category
            );

          }
        );


        this.applyCategoryFilters();

      });
  }


  // =====================================================
  // INICIALIZAR MAPA
  // =====================================================

  private initializeMap(): void {

    this.map = L.map(
      'accessoya-map',
      {
        center:
          this.peruCenter,

        zoom: 6,

        minZoom: 5,

        maxZoom: 19,

        zoomControl: false
      }
    );


    // =================================================
    // ZOOM
    // =================================================

    L.control.zoom({
      position: 'topleft'
    }).addTo(this.map);


    // =================================================
    // OPENSTREETMAP
    // =================================================

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,

        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);


    // =================================================
    // CLUSTERS
    // =================================================

    this.markersLayer =
      this.createMarkersLayer();


    this.markersLayer.addTo(
      this.map
    );


    // =================================================
    // MOVIMIENTO
    // =================================================

    this.map.on(
      'moveend',
      () => {

        this.mapMove$.next();

      }
    );
  }


  // =====================================================
  // CARGA DEL MAPA
  // =====================================================

  private configureMapLoading(): void {

    this.mapMove$
      .pipe(

        debounceTime(250),

        switchMap(() =>
          this.fetchPlaces()
        ),

        takeUntil(
          this.destroy$
        )

      )
      .subscribe({

        next: places => {

          this.renderMarkers(
            places
          );

        },

        error: error => {

          console.error(
            'Error cargando lugares:',
            error
          );

        }

      });
  }


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  private loadPlaces(): void {

    this.fetchPlaces()
      .pipe(
        takeUntil(
          this.destroy$
        )
      )
      .subscribe({

        next: places => {

          this.renderMarkers(
            places
          );

        },

        error: error => {

          console.error(
            'Error cargando lugares:',
            error
          );

        }

      });
  }


  // =====================================================
  // CONSULTAR BACKEND
  // =====================================================

  private fetchPlaces() {

    if (!this.map) {

      return of(
        [] as PlaceMapResponse[]
      );

    }


    const zoom =
      this.map.getZoom();


    if (zoom < 6) {

      this.markersLayer?.clearLayers();

      return of(
        [] as PlaceMapResponse[]
      );

    }


    const bounds =
      this.map.getBounds();


    return this.placeService
      .getPlacesForMap(

        bounds.getSouth(),

        bounds.getNorth(),

        bounds.getWest(),

        bounds.getEast(),

        zoom

      )
      .pipe(

        catchError(error => {

          console.error(
            'Error consultando lugares:',
            error
          );

          return of(
            [] as PlaceMapResponse[]
          );

        })

      );
  }


  // =====================================================
  // CREAR CLUSTER
  // =====================================================

  private createMarkersLayer():
    L.MarkerClusterGroup {

    return L.markerClusterGroup({

      chunkedLoading: true,

      chunkInterval: 100,

      chunkDelay: 20,

      maxClusterRadius: 45,

      showCoverageOnHover: false,

      spiderfyOnMaxZoom: true,

      disableClusteringAtZoom: 16,

      animate: true,

      animateAddingMarkers: false,

      iconCreateFunction:
        (cluster: L.MarkerCluster) => {

          return this.createClusterIcon(
            cluster
          );

        }

    });
  }


  // =====================================================
  // ICONO CLUSTER
  // =====================================================

  private createClusterIcon(
    cluster: L.MarkerCluster
  ): L.DivIcon {

    const markers =
      cluster.getAllChildMarkers();


    const categoryCounts:
      Record<string, number> = {};


    markers.forEach(
      marker => {

        const categoryMarker =
          marker as CategoryMarker;


        const type =
          (
            categoryMarker.placeType
            ?? 'OTHER'
          ).toUpperCase();


        categoryCounts[type] =
          (
            categoryCounts[type]
            ?? 0
          ) + 1;

      }
    );


    let dominantCategory =
      'OTHER';

    let highestCount =
      0;


    for (
      const [type, count]
      of Object.entries(
        categoryCounts
      )
    ) {

      if (
        count >
        highestCount
      ) {

        highestCount =
          count;

        dominantCategory =
          type;

      }

    }


    const color =
      this.getPlaceColor(
        dominantCategory
      );


    const count =
      markers.length;


    let size =
      46;

    let fontSize =
      13;


    if (count >= 100) {

      size = 64;

      fontSize = 15;

    } else if (count >= 20) {

      size = 56;

      fontSize = 14;

    }


    const label =
      this.getPlaceTypeLabel(
        dominantCategory
      );


    return L.divIcon({

      className:
        'accessoya-cluster-wrapper',

      iconSize:
        [
          size,
          size
        ],

      iconAnchor:
        [
          size / 2,
          size / 2
        ],

      html: `
        <div
          class="accessoya-cluster"
          title="${label}: ${count} lugares"
          style="
            width:${size}px;
            height:${size}px;
            background:${color};
            font-size:${fontSize}px;
          "
        >

          <div
            class="accessoya-cluster-inner"
          >
            ${count}
          </div>

        </div>
      `
    });
  }


  // =====================================================
  // RENDERIZAR MARCADORES
  // =====================================================

  private renderMarkers(
    places: PlaceMapResponse[]
  ): void {

    this.allPlaces =
      places;

    this.applyCategoryFilters();
  }


  // =====================================================
  // APLICAR FILTROS
  // =====================================================

  private applyCategoryFilters(): void {

    if (!this.markersLayer) {
      return;
    }


    const placesToShow =
      this.selectedCategories.size === 0

        ? this.allPlaces

        : this.allPlaces.filter(
          place => {

            const placeType =
              (
                place.type
                ?? ''
              ).toUpperCase();


            return Array.from(
              this.selectedCategories
            ).some(
              category =>

                this.categoryMatchesPlace(
                  category,
                  placeType
                )

            );

          }
        );


    // =================================================
    // LIMPIAR
    // =================================================

    this.markersLayer.clearLayers();

    this.placeMarkers.clear();


    // =================================================
    // CREAR
    // =================================================

    placesToShow.forEach(
      place => {

        if (
          place.latitude == null ||
          place.longitude == null
        ) {
          return;
        }


        if (
          !Number.isFinite(
            place.latitude
          ) ||
          !Number.isFinite(
            place.longitude
          )
        ) {
          return;
        }


        const color =
          this.getPlaceColor(
            place.type
          );


        const marker =
          this.createPlaceMarker(
            place,
            color
          );


        this.markersLayer.addLayer(
          marker
        );


        this.placeMarkers.set(
          String(place.id),
          marker
        );

      }
    );


    // =================================================
    // ACTUALIZAR RESULTADOS DE BÚSQUEDA
    // =================================================

    this.updateSearchResults();
  }


  // =====================================================
  // COINCIDENCIA DE CATEGORÍAS
  // =====================================================

  private categoryMatchesPlace(
    category: string,
    placeType: string
  ): boolean {

    const normalizedCategory =
      (
        category
        ?? ''
      ).toUpperCase();


    const normalizedPlaceType =
      (
        placeType
        ?? ''
      ).toUpperCase();


    switch (
    normalizedCategory
    ) {

      // =================================================
      // SALUD
      // =================================================

      case 'HEALTHCARE':

        return (
          normalizedPlaceType ===
          'HEALTHCARE'
        );


      // =================================================
      // FARMACIA
      // =================================================

      case 'PHARMACY':

        return (
          normalizedPlaceType ===
          'PHARMACY'
        );


      // =================================================
      // RESTAURANTES
      // =================================================

      case 'RESTAURANT':

        return (
          normalizedPlaceType ===
          'RESTAURANT'
        );


      // =================================================
      // BANCOS
      // =================================================

      case 'BANK':

        return (
          normalizedPlaceType ===
          'BANK'
        );


      // =================================================
      // EDUCACIÓN
      // =================================================

      case 'EDUCATION':
      case 'SCHOOL':

        return (
          normalizedPlaceType ===
          'SCHOOL' ||

          normalizedPlaceType ===
          'UNIVERSITY'
        );


      // =================================================
      // HOTELES
      // =================================================

      case 'HOTEL':

        return (
          normalizedPlaceType ===
          'HOTEL'
        );


      // =================================================
      // COMPRAS
      // =================================================

      case 'SHOPPING':
      case 'SUPERMARKET':
      case 'SHOPPING_CENTER':

        return (
          normalizedPlaceType ===
          'SUPERMARKET' ||

          normalizedPlaceType ===
          'SHOPPING_CENTER'
        );


      // =================================================
      // DEPORTES
      // =================================================

      case 'SPORTS':

        return (
          normalizedPlaceType ===
          'SPORTS'
        );


      // =================================================
      // RELIGIOSOS
      // =================================================

      case 'RELIGIOUS':

        return (
          normalizedPlaceType ===
          'RELIGIOUS'
        );


      // =================================================
      // CULTURA
      // =================================================

      case 'CULTURAL':

        return (
          normalizedPlaceType ===
          'CULTURAL'
        );


      // =================================================
      // TRANSPORTE
      // =================================================

      case 'TRANSPORTATION':

        return (
          normalizedPlaceType ===
          'TRANSPORTATION'
        );


      // =================================================
      // SERVICIO PÚBLICO
      // =================================================

      case 'PUBLIC_SERVICE':

        return (
          normalizedPlaceType ===
          'PUBLIC_SERVICE'
        );


      default:

        return false;
    }
  }


  // =====================================================
  // PANEL DE FILTROS
  // =====================================================

  toggleFilterPanel(): void {

    this.isFilterPanelOpen =
      !this.isFilterPanelOpen;
  }


  closeFilterPanel(): void {

    this.isFilterPanelOpen =
      false;
  }


  // =====================================================
  // SELECCIONAR CATEGORÍA
  // =====================================================

  toggleCategory(
    category: string
  ): void {

    const normalizedCategory =
      category.toUpperCase();


    if (
      this.selectedCategories.has(
        normalizedCategory
      )
    ) {

      this.selectedCategories.delete(
        normalizedCategory
      );

    } else {

      this.selectedCategories.add(
        normalizedCategory
      );

    }


    this.applyCategoryFilters();

    this.updateCategoryUrl();
  }


  // =====================================================
  // ACTUALIZAR URL
  // =====================================================

  private updateCategoryUrl(): void {

    const categories =
      Array.from(
        this.selectedCategories
      );


    this.router.navigate(
      [],
      {
        relativeTo:
          this.route,

        queryParams:
        {
          category:
            categories.length > 0
              ? categories.join(',')
              : null
        },

        queryParamsHandling:
          'merge',

        replaceUrl:
          true
      }
    );
  }


  // =====================================================
  // LIMPIAR CATEGORÍAS
  // =====================================================

  clearCategoryFilters(): void {

    this.selectedCategories.clear();

    this.applyCategoryFilters();

    this.router.navigate(
      [],
      {
        relativeTo:
          this.route,

        queryParams:
        {
          category:
            null
        },

        queryParamsHandling:
          'merge',

        replaceUrl:
          true
      }
    );
  }


  // =====================================================
  // SABER SI ESTÁ SELECCIONADA
  // =====================================================

  isCategorySelected(
    category: string
  ): boolean {

    return this.selectedCategories.has(
      category.toUpperCase()
    );
  }


  // =====================================================
  // MARCADOR
  // =====================================================

  private createPlaceMarker(
    place: PlaceMapResponse,
    color: string
  ): CategoryMarker {

    const marker =
      L.marker(
        [
          place.latitude,
          place.longitude
        ],
        {
          icon:
            this.createPlaceIcon(
              color
            )
        }
      ) as CategoryMarker;


    marker.placeType =
      place.type;


    // =================================================
    // POPUP
    // =================================================

    marker.bindPopup(

      this.createPopup(
        place,
        color
      ),

      {
        className:
          'accessoya-popup',

        maxWidth:
          360,

        minWidth:
          260,

        closeButton:
          true,

        autoPan:
          false,

        closeOnClick:
          false
      }
    );


    // =================================================
    // BOTÓN VER INFORMACIÓN
    // =================================================

    marker.on(
      'popupopen',
      event => {

        const popupElement =
          event.popup.getElement();


        if (!popupElement) {
          return;
        }


        const detailButton =
          popupElement.querySelector<HTMLButtonElement>(
            '.popup-detail-button'
          );


        if (!detailButton) {
          return;
        }


        detailButton.onclick =
          () => {

            this.router.navigate([
              '/places',
              place.id
            ]);

          };

      }
    );


    return marker;
  }


  // =====================================================
  // ICONO
  // =====================================================

  private createPlaceIcon(
    color: string
  ): L.DivIcon {

    return L.divIcon({

      className:
        'accessoya-marker-wrapper accessoya-custom-marker',

      iconSize:
        [
          34,
          34
        ],

      iconAnchor:
        [
          17,
          17
        ],

      popupAnchor:
        [
          0,
          -18
        ],

      html: `
        <div
          class="place-marker"
          style="--marker-color:${color}"
        >

          <div
            class="place-marker-inner"
          >

            <span></span>

          </div>

        </div>
      `
    });
  }


  // =====================================================
  // COLORES
  // =====================================================

  private getPlaceColor(
    type: string
  ): string {

    switch (
    type?.toUpperCase()
    ) {

      case 'HEALTHCARE':
        return '#2563eb';

      case 'PHARMACY':
        return '#16a34a';

      case 'RESTAURANT':
        return '#ea580c';

      case 'BANK':
        return '#0891b2';

      case 'SCHOOL':
      case 'UNIVERSITY':
        return '#4f46e5';

      case 'HOTEL':
        return '#db2777';

      case 'SUPERMARKET':
        return '#ca8a04';

      case 'SHOPPING_CENTER':
        return '#92400e';

      case 'SPORTS':
        return '#dc2626';

      case 'RELIGIOUS':
        return '#c2410c';

      case 'CULTURAL':
        return '#7c3aed';

      case 'PUBLIC_SERVICE':
        return '#475569';

      case 'TRANSPORTATION':
        return '#059669';

      default:
        return '#64748b';
    }
  }


  // =====================================================
  // NOMBRE DE CATEGORÍA
  // =====================================================

  private getPlaceTypeLabel(
    type: string
  ): string {

    switch (
    type?.toUpperCase()
    ) {

      case 'HEALTHCARE':
        return 'Salud';

      case 'PHARMACY':
        return 'Farmacia';

      case 'RESTAURANT':
        return 'Restaurante';

      case 'BANK':
        return 'Banco';

      case 'SCHOOL':
      case 'UNIVERSITY':
        return 'Educación';

      case 'HOTEL':
        return 'Hotel';

      case 'SUPERMARKET':
        return 'Supermercado';

      case 'SHOPPING_CENTER':
        return 'Centro comercial';

      case 'SPORTS':
        return 'Deportes';

      case 'RELIGIOUS':
        return 'Religioso';

      case 'CULTURAL':
        return 'Cultura';

      case 'PUBLIC_SERVICE':
        return 'Servicio público';

      case 'TRANSPORTATION':
        return 'Transporte';

      default:
        return 'Lugar';
    }
  }


  // =====================================================
  // SOURCE
  // =====================================================

  private getSourceLabel(
    source: string
  ): string {

    switch (
    source?.toUpperCase()
    ) {

      case 'RENIPRESS':
        return 'RENIPRESS';

      case 'OPENSTREETMAP':
        return 'OPENSTREETMAP';

      case 'GOOGLE_PLACES':
        return 'GOOGLE PLACES';

      case 'ACCESOYA':
        return 'ACCESOYA';

      default:
        return 'ACCESOYA';
    }
  }


  // =====================================================
  // POPUP
  // =====================================================

  private createPopup(
    place: PlaceMapResponse,
    color: string
  ): string {

    const type =
      this.getPlaceTypeLabel(
        place.type
      );


    const status =
      place.status?.toUpperCase() ===
      'ACTIVE';


    const source =
      place.source
        ? this.getSourceLabel(
          place.source
        )
        : 'ACCESOYA';


    const address =
      place.address?.trim()
        ? `
          <div class="popup-detail">

            <span class="popup-detail-icon">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"
                />

                <circle
                  cx="12"
                  cy="10"
                  r="2.3"
                />

              </svg>

            </span>

            <div class="popup-detail-content">

              <span class="popup-detail-label">
                Dirección
              </span>

              <span class="popup-detail-value">
                ${this.escapeHtml(
          place.address
        )}
              </span>

            </div>

          </div>
        `
        : '';


    const phone =
      place.phone?.trim()
        ? `
          <div class="popup-detail">

            <span class="popup-detail-icon">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <path
                  d="M6.6 3.5 4.2 5.9c-.7.7-.8 1.8-.3 2.6
                     2.5 4.4 6.2 7.1 10.6 8.6
                     .9.3 1.9 0 2.5-.7l2-2.3
                     c.6-.7.5-1.8-.2-2.4l-2.4-2
                     c-.6-.5-1.5-.5-2.1 0l-1.1.9
                     c-1.8-.9-3.1-2.2-4-4l.9-1.1
                     c.5-.6.5-1.5 0-2.1l-2-2.4
                     c-.4-.6-1.5-.6-2.1 0z"
                />

              </svg>

            </span>

            <div class="popup-detail-content">

              <span class="popup-detail-label">
                Teléfono
              </span>

              <span class="popup-detail-value">
                ${this.escapeHtml(
          place.phone
        )}
              </span>

            </div>

          </div>
        `
        : '';


    const openingHours =
      place.openingHours?.trim()
        ? `
          <div class="popup-detail">

            <span class="popup-detail-icon">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                />

                <path
                  d="M12 7v5l3.5 2"
                />

              </svg>

            </span>

            <div class="popup-detail-content">

              <span class="popup-detail-label">
                Horario
              </span>

              <span class="popup-detail-value">
                ${this.escapeHtml(
          place.openingHours
        )}
              </span>

            </div>

          </div>
        `
        : '';


    const establishmentType =
      place.establishmentType?.trim()
        ? `
          <div class="popup-establishment">

            ${this.escapeHtml(
          place.establishmentType
        )}

          </div>
        `
        : '';


    const description =
      place.description?.trim()
        ? `
          <div class="popup-description">

            ${this.escapeHtml(
          place.description
        )}

          </div>
        `
        : '';


    return `
      <div
        class="place-popup-content"
        style="--place-color:${color}"
      >

        <div class="popup-header">

          <div class="popup-type">

            <span
              class="popup-type-dot"
            ></span>

            ${type}

          </div>

          <span class="popup-source">
            ${this.escapeHtml(source)}
          </span>

        </div>


        <h3>
          ${this.escapeHtml(
      place.name
    )}
        </h3>


        ${establishmentType}


        ${description}


        <div class="popup-divider"></div>


        <div class="popup-details">

          ${address}

          ${phone}

          ${openingHours}

        </div>


        <div class="popup-footer">

          <span
            class="
              popup-status
              ${status
        ? 'active'
        : 'inactive'}
            "
          >

            <span class="status-indicator"></span>

            ${status
        ? 'Activo'
        : 'Inactivo'}

          </span>


          <span
            class="popup-category-code"
          >
            ${this.escapeHtml(
          place.type
        )}
          </span>

        </div>


        <button
          type="button"
          class="popup-detail-button"
        >
          Ver información
        </button>


      </div>
    `;
  }


  // =====================================================
  // ESCAPE HTML
  // =====================================================

  private escapeHtml(
    value:
      string |
      null |
      undefined
  ): string {

    if (!value) {
      return '';
    }


    return (
      value ?? ''
    )

      .replace(
        /&/g,
        '&amp;'
      )

      .replace(
        /</g,
        '&lt;'
      )

      .replace(
        />/g,
        '&gt;'
      )

      .replace(
        /"/g,
        '&quot;'
      )

      .replace(
        /'/g,
        '&#039;'
      );
  }


  // =====================================================
  // BÚSQUEDA
  // =====================================================

  onSearchInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.searchTerm =
      input.value.trim();


    this.updateSearchResults();
  }


  // =====================================================
  // ACTUALIZAR RESULTADOS
  // =====================================================

  private updateSearchResults(): void {

    if (!this.searchTerm) {

      this.searchResults = [];

      return;
    }


    const search =
      this.normalizeSearch(
        this.searchTerm
      );


    this.searchResults =
      this.allPlaces
        .filter(place => {

          // ---------------------------------------------
          // RESPETAR FILTRO DE CATEGORÍA
          // ---------------------------------------------

          if (
            this.selectedCategories.size > 0
          ) {

            const placeType =
              (
                place.type
                ?? ''
              ).toUpperCase();


            const matchesCategory =
              Array.from(
                this.selectedCategories
              ).some(
                category =>
                  this.categoryMatchesPlace(
                    category,
                    placeType
                  )
              );


            if (!matchesCategory) {
              return false;
            }
          }


          const name =
            this.normalizeSearch(
              place.name
            );


          const address =
            this.normalizeSearch(
              place.address
            );


          const type =
            this.normalizeSearch(
              place.type
            );


          const description =
            this.normalizeSearch(
              place.description
            );


          return (
            name.includes(search) ||
            address.includes(search) ||
            type.includes(search) ||
            description.includes(search)
          );

        })
        .slice(
          0,
          8
        );
  }


  // =====================================================
  // NORMALIZAR BÚSQUEDA
  // =====================================================

  private normalizeSearch(
    value:
      string |
      null |
      undefined
  ): string {

    return (
      value ?? ''
    )
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .trim();
  }


  // =====================================================
  // IR AL LUGAR
  // =====================================================

  focusPlace(
    place: PlaceMapResponse
  ): void {

    if (
      place.latitude == null ||
      place.longitude == null
    ) {
      return;
    }


    if (
      !Number.isFinite(
        place.latitude
      ) ||
      !Number.isFinite(
        place.longitude
      )
    ) {
      return;
    }


    this.searchResults =
      [];


    this.map.flyTo(
      [
        place.latitude,
        place.longitude
      ],
      17,
      {
        animate: true,
        duration: 1.2
      }
    );


    setTimeout(
      () => {

        const marker =
          this.placeMarkers.get(
            String(place.id)
          );


        if (marker) {

          marker.openPopup();

        }

      },
      1300
    );
  }


  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================

  clearSearch(): void {

    this.searchTerm = '';

    this.searchResults = [];
  }

}