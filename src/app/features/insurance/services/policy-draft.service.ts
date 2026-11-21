import { Injectable, OnDestroy, signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Subject, Subscription, switchMap, takeUntil, timer } from 'rxjs';

interface BeneficiarioDraft {
  nome: string;
  cognome: string;
  cf: string;
  percentuale: number | null;
}

interface PolicyDraftData {
  nome: string;
  cognome: string;
  dataNascita: string;
  codiceFiscale: string;
  beneficiari: BeneficiarioDraft[];
}

interface PolicyDraft {
  savedAt: string;
  data: PolicyDraftData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPolicyDraft(value: unknown): value is PolicyDraft {
  if (!isRecord(value) || typeof value['savedAt'] !== 'string' ||
      !Number.isFinite(Date.parse(value['savedAt'])) || !isRecord(value['data'])) {
    return false;
  }
  const data = value['data'];
  return typeof data['nome'] === 'string' &&
    typeof data['cognome'] === 'string' &&
    typeof data['dataNascita'] === 'string' &&
    typeof data['codiceFiscale'] === 'string' &&
    Array.isArray(data['beneficiari']) && data['beneficiari'].length > 0 &&
    data['beneficiari'].every((beneficiario: unknown) =>
      isRecord(beneficiario) &&
      typeof beneficiario['nome'] === 'string' &&
      typeof beneficiario['cognome'] === 'string' &&
      typeof beneficiario['cf'] === 'string' &&
      (beneficiario['percentuale'] === null ||
        (typeof beneficiario['percentuale'] === 'number' && Number.isFinite(beneficiario['percentuale'])))
    );
}

@Injectable()
export class PolicyDraftService implements OnDestroy {
  private readonly storageKey = 'policy-subscription-draft';
  private readonly cancelSave = new Subject<void>();
  private subscription?: Subscription;
  readonly pendingDraft = signal<PolicyDraft | null>(null);
  readonly error = signal<string | null>(null);

  start(form: FormGroup): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        const draft: unknown = JSON.parse(saved);
        if (!isPolicyDraft(draft)) {
          throw new Error('Formato della bozza non valido');
        }
        this.pendingDraft.set(draft);
      }
    } catch (error) {
      console.error('Impossibile leggere la bozza:', error);
      this.error.set('Impossibile leggere la bozza salvata.');
    }

    this.subscription = form.valueChanges.pipe(
      switchMap(() => timer(500).pipe(takeUntil(this.cancelSave)))
    ).subscribe(() => this.save(form));
  }

  restore(form: FormGroup, createBeneficiario: () => FormGroup): void {
    const draft = this.pendingDraft();
    if (!draft) return;

    this.cancelSave.next();
    const beneficiari = form.get('beneficiari') as FormArray;
    beneficiari.clear({ emitEvent: false });
    for (const beneficiario of draft.data.beneficiari) {
      const control = createBeneficiario();
      control.patchValue(beneficiario, { emitEvent: false });
      beneficiari.push(control, { emitEvent: false });
    }
    form.patchValue({ ...draft.data, pin: '', confermaPin: '' }, { emitEvent: false });
    this.pendingDraft.set(null);
    this.save(form);
  }

  delete(): void {
    this.cancelSave.next();
    try {
      localStorage.removeItem(this.storageKey);
      this.pendingDraft.set(null);
      this.error.set(null);
    } catch (error) {
      console.error('Impossibile eliminare la bozza:', error);
      this.error.set('Impossibile eliminare la bozza.');
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.cancelSave.complete();
  }

  private save(form: FormGroup): void {
    const value = form.getRawValue();
    const data: PolicyDraftData = {
      nome: value.nome,
      cognome: value.cognome,
      dataNascita: value.dataNascita,
      codiceFiscale: value.codiceFiscale,
      beneficiari: value.beneficiari
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      } satisfies PolicyDraft));
      this.error.set(null);
    } catch (error) {
      console.error('Impossibile salvare la bozza:', error);
      this.error.set('Impossibile salvare la bozza.');
    }
  }
}
