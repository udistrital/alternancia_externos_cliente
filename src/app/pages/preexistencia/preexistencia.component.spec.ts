import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreexistenciaComponent } from './preexistencia.component';

describe('PreexistenciaComponent', () => {
  let component: PreexistenciaComponent;
  let fixture: ComponentFixture<PreexistenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreexistenciaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreexistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
