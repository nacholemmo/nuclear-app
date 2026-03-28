import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShieldingSimulationRequest, ShieldingSimulationResponse } from '../models/shielding.model';

@Injectable({ providedIn: 'root' })
export class ShieldingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  simulate(params: ShieldingSimulationRequest): Observable<ShieldingSimulationResponse> {
    return this.http.post<ShieldingSimulationResponse>(`${this.apiUrl}/simular/blindaje`, params);
  }
}
