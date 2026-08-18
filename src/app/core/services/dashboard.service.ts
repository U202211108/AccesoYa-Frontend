import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DashboardResponse } from '../models/dashboard-response';


@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly apiUrl =
        'http://localhost:8080/api/dashboard';


    constructor(
        private readonly http: HttpClient
    ) { }


    getDashboard(): Observable<DashboardResponse> {

        return this.http.get<DashboardResponse>(
            this.apiUrl
        );
    }
}