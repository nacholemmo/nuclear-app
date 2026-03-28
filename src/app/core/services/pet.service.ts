import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PetSimulationRequest, PetSimulationResponse } from '../models/pet.model';

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  simulate(params: PetSimulationRequest): Observable<PetSimulationResponse> {
    return this.http.post<PetSimulationResponse>(`${this.apiUrl}/simular/pet`, params);
  }
}
