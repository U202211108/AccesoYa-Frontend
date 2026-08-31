import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    timeout
} from 'rxjs/operators';

import {
    DashboardResponse
} from '../models/dashboard-response';


@Injectable({
    providedIn: 'root'
})
export class DashboardService {


    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/dashboard';


    // =====================================================
    // OBTENER DASHBOARD
    // =====================================================

    getDashboard():
        Observable<DashboardResponse> {

        console.log(
            'GET:',
            this.apiUrl
        );


        return this.http
            .get<DashboardResponse>(
                this.apiUrl
            )
            .pipe(

                timeout(15000)

            );
    }

}