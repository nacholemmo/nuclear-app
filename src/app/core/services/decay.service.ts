import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DecaySimulationRequest, DecaySimulationResponse } from '../models/decay.model';

@Injectable({ providedIn: 'root' })
export class DecayService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  simulate(params: DecaySimulationRequest): Observable<DecaySimulationResponse> {
    return this.http.post<DecaySimulationResponse>(`${this.apiUrl}/simular/decay`, params);
  }
}
