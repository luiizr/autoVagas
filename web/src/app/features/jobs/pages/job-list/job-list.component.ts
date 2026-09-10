import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, finalize, of, timeout } from 'rxjs';

interface ImdJob {
  id: string;
  titulo: string;
  url: string;
  dataFinalInscricao?: string;
  valorVaga?: string;
  requisitos?: string;
  situacao?: string;
}

@Component({
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.scss',
})
export class JobListComponent {
  private readonly http = inject(HttpClient);
  jobs: ImdJob[] = [];
  loading = true;
  error = '';

  constructor() {
    this.load();
  }

  load(force = false) {
    this.loading = true;
    this.error = '';
    this.http
      .get<{ vagas: ImdJob[] }>(`/api/vagas?fonte=imd${force ? '&atualizar=true' : ''}`)
      .pipe(
        timeout(45_000),
        catchError((response: { name?: string; error?: { error?: string } }) => {
          this.error =
            response.name === 'TimeoutError'
              ? 'A consulta ao IMD demorou mais que o esperado.'
              : (response.error?.error ?? 'Não foi possível consultar os editais do IMD.');
          return of({ vagas: [] });
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(({ vagas }) => (this.jobs = vagas));
  }
}
