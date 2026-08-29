import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject,
  ChangeDetectorRef
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
  distinctUntilChanged,
  switchMap,
  map,
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
  flmNocData?: PlaceMapResponse;
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

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly search$ =
    new Subject<string>();

  isSearching = false;


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

  // =====================================================
  // FILTROS FLM / NOC
  // =====================================================

  selectedTipoEstacion: string | null = null;

  selectedZonal: string | null = null;

  selectedTecnologia: string | null = null;


  // =====================================================
  // OPCIONES DISPONIBLES
  // =====================================================

  tipoEstaciones: string[] = [];

  zonales: string[] = [];

  tecnologias: string[] = [];

  // =====================================================
  // CONTADORES Y ESTADO VISUAL DE LOS FILTROS
  // =====================================================

  readonly maxVisibleFilterOptions = 6;

  // Conteos reales y dinámicos de cada opción.
  // Cada categoría se calcula considerando los otros dos filtros activos.
  tipoEstacionCounts = new Map<string, number>();
  zonalCounts = new Map<string, number>();
  tecnologiaCounts = new Map<string, number>();

  // Conteo real de "Todos" para cada grupo.
  // Ejemplo: "Todos los tipos" respeta Zonal + Tecnología seleccionados.
  tipoEstacionAllCount = 0;
  zonalAllCount = 0;
  tecnologiaAllCount = 0;

  // Total general y total actualmente visible en el mapa.
  totalFlmNocCount = 0;
  visibleFlmNocCount = 0;

  isTipoEstacionOpen = true;
  isZonalOpen = true;
  isTecnologiaOpen = true;

  showAllTipoEstacion = false;
  showAllZonal = false;
  showAllTecnologia = false;


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

    this.loadPlaces();

    this.loadFlmNocFilters();
  }

  ngOnInit(): void {

    this.configureRouteFilters();

    this.configureSearch();
  }


  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

    this.mapMove$.complete();

    if (this.map) {
      this.map.remove();
    }
  }

  private loadFlmNocFilters(): void {

    this.placeService
      .getFlmNocFilters()
      .subscribe({

        next: filters => {

          this.tipoEstaciones =
            filters.tiposEstacion ?? [];

          this.zonales =
            filters.zonales ?? [];

          this.tecnologias =
            filters.tecnologias ?? [];


          console.log(
            '[FILTERS] Tipo de estación:',
            this.tipoEstaciones
          );

          console.log(
            '[FILTERS] Zonales:',
            this.zonales
          );

          console.log(
            '[FILTERS] Tecnologías:',
            this.tecnologias
          );


          // =========================================
          // FORZAR ACTUALIZACIÓN VISUAL
          // =========================================

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            '[FILTERS] Error cargando filtros FLM / NOC:',
            error
          );

        }

      });
  }

  private configureSearch(): void {

    this.search$
      .pipe(

        // =============================================
        // NORMALIZAR
        // =============================================

        map(query =>
          query.trim()
        ),

        // =============================================
        // ESPERAR A QUE EL USUARIO TERMINE DE ESCRIBIR
        // =============================================

        debounceTime(300),

        // =============================================
        // NO REPETIR LA MISMA BÚSQUEDA
        // =============================================

        distinctUntilChanged(),

        // =============================================
        // BUSCAR
        // =============================================

        switchMap(query => {

          // -------------------------------------------
          // MENOS DE 2 CARACTERES
          // -------------------------------------------

          if (query.length < 2) {

            return of(
              [] as PlaceMapResponse[]
            );
          }

          // -------------------------------------------
          // LIMPIAR RESULTADOS ANTERIORES
          // -------------------------------------------

          this.searchResults = [];

          console.log(
            '[SEARCH] Consultando:',
            query
          );

          return this.placeService
            .searchPlacesForMap(query)
            .pipe(

              catchError(error => {

                console.error(
                  '[SEARCH] Error:',
                  error
                );

                return of(
                  [] as PlaceMapResponse[]
                );

              })

            );
        }),

        // =============================================
        // DESTRUIR SUSCRIPCIÓN
        // =============================================

        takeUntil(
          this.destroy$
        )

      )

      .subscribe(results => {

        console.log(
          '[SEARCH] Resultados:',
          results.length
        );

        this.searchResults =
          results;

      });
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

  private buildFlmNocFilters(
    places: PlaceMapResponse[]
  ): void {

    const tipoEstaciones = new Set<string>();
    const zonales = new Set<string>();
    const tecnologias = new Set<string>();

    const tipoEstacionCounts = new Map<string, number>();
    const zonalCounts = new Map<string, number>();
    const tecnologiaCounts = new Map<string, number>();

    this.totalFlmNocCount = 0;

    places.forEach(place => {

      const flm = place.flmNoc;

      if (!flm) {
        return;
      }

      this.totalFlmNocCount++;

      if (flm.tipoEstacion?.trim()) {
        const value = flm.tipoEstacion.trim();
        tipoEstaciones.add(value);
        tipoEstacionCounts.set(
          value,
          (tipoEstacionCounts.get(value) ?? 0) + 1
        );
      }

      if (flm.zonal?.trim()) {
        const value = flm.zonal.trim();
        zonales.add(value);
        zonalCounts.set(
          value,
          (zonalCounts.get(value) ?? 0) + 1
        );
      }

      if (flm.tecnologia?.trim()) {
        const value = flm.tecnologia.trim();
        tecnologias.add(value);
        tecnologiaCounts.set(
          value,
          (tecnologiaCounts.get(value) ?? 0) + 1
        );
      }
    });

    this.tipoEstaciones =
      Array.from(tipoEstaciones).sort((a, b) =>
        a.localeCompare(
          b,
          'es',
          { sensitivity: 'base' }
        )
      );

    this.zonales =
      Array.from(zonales).sort((a, b) =>
        a.localeCompare(
          b,
          'es',
          { sensitivity: 'base' }
        )
      );

    this.tecnologias =
      Array.from(tecnologias).sort((a, b) =>
        a.localeCompare(
          b,
          'es',
          { sensitivity: 'base' }
        )
      );

    this.tipoEstacionCounts = tipoEstacionCounts;
    this.zonalCounts = zonalCounts;
    this.tecnologiaCounts = tecnologiaCounts;

    this.showAllTipoEstacion = false;
    this.showAllZonal = false;
    this.showAllTecnologia = false;

    console.log(
      '[FILTERS] Tipo de estación:',
      this.tipoEstaciones
    );

    console.log(
      '[FILTERS] Zonales:',
      this.zonales
    );

    console.log(
      '[FILTERS] Tecnologías:',
      this.tecnologias
    );
  }


  // =====================================================
  // INICIALIZAR MAPA
  // =====================================================

  private initializeMap(): void {

    const container =
      document.getElementById('accessoya-map');

    if (!container) {
      console.error(
        '[MAP] No se encontró el contenedor #accessoya-map'
      );
      return;
    }

    // =====================================================
    // EVITAR DOBLE INICIALIZACIÓN DE LEAFLET
    // =====================================================

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = undefined as any;
    }

    // Si Leaflet dejó el contenedor marcado,
    // limpiamos esa referencia antes de volver a inicializar.
    const leafletContainer =
      container as HTMLElement & {
        _leaflet_id?: number;
      };

    if (leafletContainer._leaflet_id) {
      delete leafletContainer._leaflet_id;
    }

    // =====================================================
    // CREAR MAPA
    // =====================================================

    this.map = L.map(
      container,
      {
        center: this.peruCenter,
        zoom: 6,
        minZoom: 5,
        maxZoom: 19,
        zoomControl: false
      }
    );

    // =====================================================
    // ZOOM
    // =====================================================

    L.control.zoom({
      position: 'topleft'
    }).addTo(this.map);

    // =====================================================
    // OPENSTREETMAP
    // =====================================================

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    // =====================================================
    // CLUSTERS
    // =====================================================

    this.markersLayer =
      this.createMarkersLayer();

    this.markersLayer.addTo(
      this.map
    );

    // =====================================================
    // MOVIMIENTO
    // =====================================================

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

    const color =
      this.getClusterColor(
        markers
      );


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
  // COLOR DEL CLUSTER
  // =====================================================

  private getClusterColor(
    markers: L.Marker[]
  ): string {

    const categoryMarkers =
      markers as CategoryMarker[];


    // ===================================================
    // TIPO DE ESTACIÓN
    // ===================================================

    if (
      !this.selectedZonal &&
      !this.selectedTecnologia
    ) {

      const firstPlace =
        categoryMarkers.find(
          marker =>
            marker.flmNocData?.flmNoc
              ?.tipoEstacion
        );

      if (firstPlace) {

        return this.getStableColor(
          firstPlace.flmNocData
            ?.flmNoc
            ?.tipoEstacion,

          this.tipoEstacionColors
        );

      }

    }


    // ===================================================
    // ZONAL
    // ===================================================

    if (
      this.selectedZonal &&
      !this.selectedTecnologia
    ) {

      const firstPlace =
        categoryMarkers.find(
          marker =>
            marker.flmNocData?.flmNoc
              ?.zonal
        );

      if (firstPlace) {

        return this.getStableColor(
          firstPlace.flmNocData
            ?.flmNoc
            ?.zonal,

          this.zonalColors
        );

      }

    }


    // ===================================================
    // TECNOLOGÍA
    // ===================================================

    if (this.selectedTecnologia) {

      const firstPlace =
        categoryMarkers.find(
          marker =>
            marker.flmNocData?.flmNoc
              ?.tecnologia
        );

      if (firstPlace) {

        return this.getStableColor(
          firstPlace.flmNocData
            ?.flmNoc
            ?.tecnologia,

          this.tecnologiaColors
        );

      }

    }


    // ===================================================
    // RESPALDO
    // =====================================================

    return this.getPlaceColor(
      'TELECOMMUNICATION_SITE'
    );
  }

  // =====================================================
  // RENDERIZAR MARCADORES
  // =====================================================

  private renderMarkers(
    places: PlaceMapResponse[]
  ): void {

    this.allPlaces = places;

    // Mantener FILTRAR MAPA sincronizado inmediatamente con los
    // sitios reales que acaba de devolver el backend.
    // No requiere hacer clic en ningún filtro.
    this.updateFlmNocFilterCounts();

    // Construir los filtros usando
    // exactamente los datos que ya llegaron
    this.buildFlmNocFilters(
      places
    );

    // Aplicar filtros actuales
    this.applyCategoryFilters();
  }

  // =====================================================
  // ACTUALIZAR CONTADORES REALES DE LOS FILTROS
  // =====================================================
  //
  // Los contadores NO son valores fijos.
  // Se calculan directamente sobre allPlaces.
  //
  // Cada grupo excluye su propio filtro para que el usuario
  // pueda ver cuántos resultados obtendría al seleccionar
  // cada opción, manteniendo los otros filtros activos.
  //
  // Ejemplo:
  // Tipo de estación = ADM
  // Zonal = Norte
  //
  // En "Tecnología", cada número cuenta:
  // ADM + Norte + esa tecnología.
  // =====================================================

  private updateFlmNocFilterCounts(): void {

    const flmPlaces =
      this.allPlaces.filter(
        place => !!place.flmNoc
      );

    // ---------------------------------------------
    // TODOS LOS TIPOS
    // Respeta Zonal + Tecnología
    // ---------------------------------------------

    this.tipoEstacionAllCount =
      flmPlaces.filter(place => {

        const flm =
          place.flmNoc!;

        if (
          this.selectedZonal &&
          flm.zonal?.trim() !==
          this.selectedZonal.trim()
        ) {
          return false;
        }

        if (
          this.selectedTecnologia &&
          flm.tecnologia?.trim() !==
          this.selectedTecnologia.trim()
        ) {
          return false;
        }

        return true;
      }).length;


    // ---------------------------------------------
    // CADA TIPO DE ESTACIÓN
    // Respeta Zonal + Tecnología
    // ---------------------------------------------

    const tipoCounts =
      new Map<string, number>();

    this.tipoEstaciones.forEach(tipo => {

      const count =
        flmPlaces.filter(place => {

          const flm =
            place.flmNoc!;

          if (
            flm.tipoEstacion?.trim() !==
            tipo.trim()
          ) {
            return false;
          }

          if (
            this.selectedZonal &&
            flm.zonal?.trim() !==
            this.selectedZonal.trim()
          ) {
            return false;
          }

          if (
            this.selectedTecnologia &&
            flm.tecnologia?.trim() !==
            this.selectedTecnologia.trim()
          ) {
            return false;
          }

          return true;

        }).length;

      tipoCounts.set(
        tipo,
        count
      );

    });


    // ---------------------------------------------
    // TODOS LOS ZONALES
    // Respeta Tipo de estación + Tecnología
    // ---------------------------------------------

    this.zonalAllCount =
      flmPlaces.filter(place => {

        const flm =
          place.flmNoc!;

        if (
          this.selectedTipoEstacion &&
          flm.tipoEstacion?.trim() !==
          this.selectedTipoEstacion.trim()
        ) {
          return false;
        }

        if (
          this.selectedTecnologia &&
          flm.tecnologia?.trim() !==
          this.selectedTecnologia.trim()
        ) {
          return false;
        }

        return true;

      }).length;


    // ---------------------------------------------
    // CADA ZONAL
    // Respeta Tipo de estación + Tecnología
    // ---------------------------------------------

    const zonalCounts =
      new Map<string, number>();

    this.zonales.forEach(zonal => {

      const count =
        flmPlaces.filter(place => {

          const flm =
            place.flmNoc!;

          if (
            flm.zonal?.trim() !==
            zonal.trim()
          ) {
            return false;
          }

          if (
            this.selectedTipoEstacion &&
            flm.tipoEstacion?.trim() !==
            this.selectedTipoEstacion.trim()
          ) {
            return false;
          }

          if (
            this.selectedTecnologia &&
            flm.tecnologia?.trim() !==
            this.selectedTecnologia.trim()
          ) {
            return false;
          }

          return true;

        }).length;

      zonalCounts.set(
        zonal,
        count
      );

    });


    // ---------------------------------------------
    // TODAS LAS TECNOLOGÍAS
    // Respeta Tipo de estación + Zonal
    // ---------------------------------------------

    this.tecnologiaAllCount =
      flmPlaces.filter(place => {

        const flm =
          place.flmNoc!;

        if (
          this.selectedTipoEstacion &&
          flm.tipoEstacion?.trim() !==
          this.selectedTipoEstacion.trim()
        ) {
          return false;
        }

        if (
          this.selectedZonal &&
          flm.zonal?.trim() !==
          this.selectedZonal.trim()
        ) {
          return false;
        }

        return true;

      }).length;


    // ---------------------------------------------
    // CADA TECNOLOGÍA
    // Respeta Tipo de estación + Zonal
    // ---------------------------------------------

    const tecnologiaCounts =
      new Map<string, number>();

    this.tecnologias.forEach(tecnologia => {

      const count =
        flmPlaces.filter(place => {

          const flm =
            place.flmNoc!;

          if (
            flm.tecnologia?.trim() !==
            tecnologia.trim()
          ) {
            return false;
          }

          if (
            this.selectedTipoEstacion &&
            flm.tipoEstacion?.trim() !==
            this.selectedTipoEstacion.trim()
          ) {
            return false;
          }

          if (
            this.selectedZonal &&
            flm.zonal?.trim() !==
            this.selectedZonal.trim()
          ) {
            return false;
          }

          return true;

        }).length;

      tecnologiaCounts.set(
        tecnologia,
        count
      );

    });


    this.tipoEstacionCounts =
      tipoCounts;

    this.zonalCounts =
      zonalCounts;

    this.tecnologiaCounts =
      tecnologiaCounts;

  }


  // =====================================================
  // APLICAR FILTROS
  // =====================================================

  private applyCategoryFilters(): void {

    if (!this.markersLayer) {

      return;

    }


    const placesToShow =
      this.allPlaces.filter(
        place => {

          // =============================================
          // SOLO FLM / NOC
          // =============================================

          if (!place.flmNoc) {

            return false;

          }


          const flm =
            place.flmNoc;


          // =============================================
          // TIPO DE ESTACIÓN
          // =============================================

          if (
            this.selectedTipoEstacion &&
            flm.tipoEstacion?.trim() !==
            this.selectedTipoEstacion.trim()
          ) {

            return false;

          }


          // =============================================
          // ZONAL
          // =============================================

          if (
            this.selectedZonal &&
            flm.zonal?.trim() !==
            this.selectedZonal.trim()
          ) {

            return false;

          }


          // =============================================
          // TECNOLOGÍA
          // =============================================

          if (
            this.selectedTecnologia &&
            flm.tecnologia?.trim() !==
            this.selectedTecnologia.trim()
          ) {

            return false;

          }


          return true;

        }
      );

    this.visibleFlmNocCount = placesToShow.length;

    // Recalcular los conteos de cada opción con los filtros
    // actuales. Esto mantiene todos los números sincronizados
    // con los datos reales del mapa.
    this.updateFlmNocFilterCounts();


    // ===================================================
    // LIMPIAR MARCADORES
    // ===================================================

    this.markersLayer.clearLayers();

    this.placeMarkers.clear();


    // ===================================================
    // CREAR MARCADORES
    // ===================================================

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


        // ===============================================
        // COLOR SEGÚN LOS DATOS DEL SITIO
        // ===============================================

        const markerColor =
          this.getFlmNocMarkerColor(
            place
          );


        const marker =
          this.createPlaceMarker(
            place,
            markerColor
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
  }

  // =====================================================
  // PALETAS DE COLORES FLM / NOC
  // =====================================================

  private readonly flmNocColorPalette: string[] = [

    '#7c3aed',
    '#2563eb',
    '#16a34a',
    '#ea580c',
    '#dc2626',
    '#0891b2',
    '#ca8a04',
    '#db2777',
    '#4f46e5',
    '#059669',
    '#9333ea',
    '#0284c7',
    '#65a30d',
    '#c2410c',
    '#be123c',
    '#0f766e'

  ];

  // =====================================================
  // OBTENER COLOR ESTABLE PARA UN VALOR
  // =====================================================

  private getStableColor(
    value: string | undefined | null,
    colorMap: Map<string, string>
  ): string {

    if (!value) {

      return '#0f766e';

    }

    const normalizedValue =
      value
        .trim()
        .toUpperCase();

    if (!normalizedValue) {

      return '#0f766e';

    }


    // ===================================================
    // SI YA EXISTE, DEVOLVER EL MISMO COLOR
    // ===================================================

    const existingColor =
      colorMap.get(
        normalizedValue
      );

    if (existingColor) {

      return existingColor;

    }


    // ===================================================
    // GENERAR COLOR DETERMINÍSTICO
    // ===================================================

    let hash = 0;

    for (
      let i = 0;
      i < normalizedValue.length;
      i++
    ) {

      hash =
        normalizedValue
          .charCodeAt(i) +
        (
          (hash << 5) -
          hash
        );

    }


    const index =
      Math.abs(hash) %
      this.flmNocColorPalette.length;


    const color =
      this.flmNocColorPalette[
      index
      ];


    colorMap.set(
      normalizedValue,
      color
    );


    return color;
  }

  // =====================================================
  // COLOR DEL MARCADOR FLM / NOC
  // =====================================================

  private getFlmNocMarkerColor(
    place: PlaceMapResponse
  ): string {

    const flm =
      place.flmNoc;


    if (!flm) {

      return this.getPlaceColor(
        'TELECOMMUNICATION_SITE'
      );

    }


    // ===================================================
    // FILTRO POR TIPO DE ESTACIÓN
    // ===================================================

    if (this.selectedTipoEstacion) {

      return this.getStableColor(
        flm.tipoEstacion,
        this.tipoEstacionColors
      );

    }


    // ===================================================
    // FILTRO POR ZONAL
    // ===================================================

    if (this.selectedZonal) {

      return this.getStableColor(
        flm.zonal,
        this.zonalColors
      );

    }


    // ===================================================
    // FILTRO POR TECNOLOGÍA
    // ===================================================

    if (this.selectedTecnologia) {

      return this.getStableColor(
        flm.tecnologia,
        this.tecnologiaColors
      );

    }


    // ===================================================
    // MAPA GENERAL
    // Color según TIPO DE ESTACIÓN
    // ===================================================

    return this.getStableColor(
      flm.tipoEstacion,
      this.tipoEstacionColors
    );
  }


  // =====================================================
  // MAPAS DE COLORES ESTABLES
  // =====================================================

  private readonly tipoEstacionColors =
    new Map<string, string>();

  private readonly zonalColors =
    new Map<string, string>();

  private readonly tecnologiaColors =
    new Map<string, string>();


  // =====================================================
  // COLORES PARA LA LEYENDA DEL PANEL DE FILTROS
  // =====================================================
  //
  // Estos métodos son públicos porque el HTML los utiliza
  // directamente para mostrar el mismo color que tienen
  // los marcadores del mapa.
  // =====================================================

  getTipoEstacionColor(
    tipo: string | undefined | null
  ): string {

    return this.getStableColor(
      tipo,
      this.tipoEstacionColors
    );
  }


  getZonalColor(
    zonal: string | undefined | null
  ): string {

    return this.getStableColor(
      zonal,
      this.zonalColors
    );
  }


  getTecnologiaColor(
    tecnologia: string | undefined | null
  ): string {

    return this.getStableColor(
      tecnologia,
      this.tecnologiaColors
    );
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
  // FILTRO TIPO DE ESTACIÓN
  // =====================================================

  selectTipoEstacion(
    value: string
  ): void {

    this.selectedTipoEstacion =
      value?.trim() || null;

    this.applyCategoryFilters();

    this.cdr.detectChanges();
  }


  // =====================================================
  // FILTRO ZONAL
  // =====================================================

  selectZonal(
    value: string
  ): void {

    this.selectedZonal =
      value?.trim() || null;

    this.applyCategoryFilters();

    this.cdr.detectChanges();
  }


  // =====================================================
  // FILTRO TECNOLOGÍA
  // =====================================================

  selectTecnologia(
    value: string
  ): void {

    this.selectedTecnologia =
      value?.trim() || null;

    this.applyCategoryFilters();

    this.cdr.detectChanges();
  }


  // =====================================================
  // LIMPIAR FILTROS FLM / NOC
  // =====================================================

  clearFlmNocFilters(): void {

    this.selectedTipoEstacion =
      null;

    this.selectedZonal =
      null;

    this.selectedTecnologia =
      null;

    this.applyCategoryFilters();

    // Garantiza que los selects y la leyenda
    // reflejen inmediatamente el estado limpio.
    this.cdr.detectChanges();
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

    marker.flmNocData =
      place;

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

      case 'TELECOMMUNICATION_SITE':
        return '#0f766e';

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

    return 'FLM / NOC';
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

      case 'FLM_NOC':
        return 'FLM / NOC';

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

    const flmNoc =
      place.flmNoc;

    const flmNocDetails =
      place.source?.toUpperCase() === 'FLM_NOC' &&
        flmNoc
        ? `

        <div class="popup-divider"></div>

        <div class="popup-section-title">
            Información FLM / NOC
        </div>


        ${flmNoc.codigoEmplazamiento?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Código de emplazamiento
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.codigoEmplazamiento
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.zonal?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Zonal
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.zonal
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.propietarioTorre?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Propietario de torre
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.propietarioTorre
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.coberturaReaccion?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Cobertura de reacción
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.coberturaReaccion
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.patrullaje?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Patrullaje
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.patrullaje
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.guardiania?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Guardianía
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.guardiania
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.vigilancia?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Vigilancia
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.vigilancia
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.rondaDinamica?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Ronda dinámica
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.rondaDinamica
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }


        ${flmNoc.monitoreoCsi?.trim()
          ? `
                    <div class="popup-detail">

                        <div class="popup-detail-content">

                            <span class="popup-detail-label">
                                Monitoreo CSI
                            </span>

                            <span class="popup-detail-value">
                                ${this.escapeHtml(
            flmNoc.monitoreoCsi
          )}
                            </span>

                        </div>

                    </div>
                `
          : ''
        }

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


${flmNocDetails}


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

  onSearchInput(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm =
      input.value.trim();

    if (!this.searchTerm) {

      this.searchResults = [];

      this.search$.next('');

      return;
    }

    this.search$.next(
      this.searchTerm
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

    this.searchResults = [];


    // =================================================
    // CREAR MARCADOR DEL RESULTADO SI TODAVÍA
    // NO EXISTE EN EL MAPA
    // =================================================

    let marker =
      this.placeMarkers.get(
        String(place.id)
      );


    if (!marker) {

      const color =
        this.getPlaceColor(
          place.type
        );

      marker =
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


    // =================================================
    // MOVER MAPA
    // =================================================

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


    // =================================================
    // ABRIR POPUP
    // =================================================

    const targetMarker =
      marker;

    this.map.once(
      'moveend',
      () => {

        setTimeout(
          () => {

            targetMarker.openPopup();

          },
          150
        );

      }
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