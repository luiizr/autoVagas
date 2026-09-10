import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, timeout } from 'rxjs';

interface Source {
  id: string;
  nome: string;
  descricao: string;
  status: 'disponivel' | 'em-breve';
}

interface ImdJob {
  id: string;
  titulo: string;
  url: string;
  situacao?: string;
  dataFinalInscricao?: string;
  valorVaga?: string;
  formaInscricao?: string;
  requisitos?: string;
  ehGraduacao?: boolean;
  exclusivaUfrn?: boolean;
  possuiDadosAnexo?: boolean;
  anexoPrincipal?: { nome: string; url: string } | null;
}

@Component({
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);

  readonly alertForm = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    telefone: ['', [Validators.required]],
    somenteGraduacao: false,
    consentimento: false,
  });

  sources: Source[] = [];
  vacancies: ImdJob[] = [];
  selectedSource = 'imd';
  loadingSources = true;
  loadingVacancies = false;
  vacancyError = '';
  alertMessage = '';
  filtersOpen = false;
  filters = {
    open: false,
    result: false,
    waiting: false,
    deadline: false,
    attachmentData: false,
    institution: 'all',
    value: 0,
  };

  constructor() {
    this.loadSources();
  }

  selectSource(source: Source) {
    if (source.status !== 'disponivel') return;
    this.selectedSource = source.id;
    this.loadVacancies();
  }

  loadSources() {
    this.http
      .get<{ fontes: Source[] }>('/api/fontes')
      .pipe(
        timeout(10_000),
        catchError(() => {
          this.vacancyError = 'Não foi possível carregar as fontes agora.';
          return of({ fontes: [] });
        }),
        finalize(() => (this.loadingSources = false)),
      )
      .subscribe(({ fontes }) => {
        this.sources = fontes;
        if (fontes.some((source) => source.id === 'imd' && source.status === 'disponivel')) {
          this.loadVacancies();
        }
      });
  }

  loadVacancies(force = false) {
    this.loadingVacancies = true;
    this.vacancyError = '';
    this.vacancies = [];
    const refresh = force ? '&atualizar=true' : '';
    this.http
      .get<{ vagas: ImdJob[] }>(`/api/vagas?fonte=${encodeURIComponent(this.selectedSource)}${refresh}`)
      .pipe(
        timeout(45_000),
        catchError((error: { name?: string; error?: { error?: string } }) => {
          this.vacancyError =
            error.name === 'TimeoutError'
              ? 'A consulta ao IMD demorou mais do que o esperado. Tente atualizar novamente.'
              : (error.error?.error ?? 'Não foi possível consultar as vagas do IMD agora.');
          return of({ vagas: [] });
        }),
        finalize(() => (this.loadingVacancies = false)),
      )
      .subscribe(({ vagas }) => (this.vacancies = vagas));
  }

  submitAlerts() {
    if (this.alertForm.invalid || !this.alertForm.controls.consentimento.value) {
      this.alertMessage = 'Informe seus dados e autorize o recebimento de alertas.';
      return;
    }
    this.alertMessage = 'Cadastrando seus alertas…';
    this.http
      .post<{ notification: { sent: boolean }; editais: ImdJob[] }>('/api/inscricoes', {
        ...this.alertForm.getRawValue(),
        fontes: [this.selectedSource],
      })
      .pipe(catchError((error: { error?: { error?: string } }) => {
        this.alertMessage = error.error?.error ?? 'Não foi possível ativar os alertas.';
        return of(null);
      }))
      .subscribe((result) => {
        if (!result) return;
        this.vacancies = result.editais;
        this.alertMessage = result.notification.sent
          ? 'Alertas ativados e vagas enviadas ao seu WhatsApp.'
          : 'Alertas ativados. As vagas estão listadas abaixo; o envio começa quando o bot estiver conectado.';
      });
  }

  get selectedSourceName() {
    return this.sources.find((source) => source.id === this.selectedSource)?.nome ?? 'IMD / UFRN';
  }

  get filteredVacancies() {
    const statusFilters = [
      ...(this.filters.open ? ['inscricoes_abertas'] : []),
      ...(this.filters.result ? ['resultados_parciais_publicados', 'resultado_final_publicado'] : []),
      ...(this.filters.waiting ? ['aguardando_resultados_parciais'] : []),
    ];

    return this.vacancies.filter((vacancy) => {
      if (statusFilters.length && !statusFilters.includes(vacancy.situacao ?? 'inscricoes_abertas')) return false;
      if (this.filters.deadline && !this.hasValidDeadline(vacancy.dataFinalInscricao)) return false;
      if (this.filters.attachmentData && !vacancy.possuiDadosAnexo && !vacancy.anexoPrincipal) return false;
      if (this.filters.institution === 'exclusive' && !vacancy.exclusivaUfrn) return false;
      if (this.filters.institution === 'other' && vacancy.exclusivaUfrn) return false;
      return !this.filters.value || this.salaryNumber(vacancy.valorVaga) >= this.filters.value;
    });
  }

  get activeFilterCount() {
    return [
      this.filters.open,
      this.filters.result,
      this.filters.waiting,
      this.filters.deadline,
      this.filters.attachmentData,
      this.filters.institution !== 'all',
      this.filters.value > 0,
    ].filter(Boolean).length;
  }

  clearFilters() {
    this.filters = {
      open: false,
      result: false,
      waiting: false,
      deadline: false,
      attachmentData: false,
      institution: 'all',
      value: 0,
    };
  }

  private hasValidDeadline(value?: string) {
    if (!value) return false;
    const [day, month, year] = value.split('/').map(Number);
    return Boolean(year && month && day) && new Date(year, month - 1, day, 23, 59, 59) >= new Date();
  }

  private salaryNumber(value?: string) {
    return Number(String(value ?? '').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  }
}
