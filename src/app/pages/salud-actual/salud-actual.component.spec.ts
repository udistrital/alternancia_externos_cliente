import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaludActualComponent } from './salud-actual.component';

describe('SaludActualComponent', () => {
  let component: SaludActualComponent;
  let fixture: ComponentFixture<SaludActualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SaludActualComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaludActualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
