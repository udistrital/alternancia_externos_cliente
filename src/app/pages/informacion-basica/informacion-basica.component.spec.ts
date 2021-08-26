import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionBasicaComponent } from './informacion-basica.component';

describe('InformacionBasicaComponent', () => {
  let component: InformacionBasicaComponent;
  let fixture: ComponentFixture<InformacionBasicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InformacionBasicaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InformacionBasicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
