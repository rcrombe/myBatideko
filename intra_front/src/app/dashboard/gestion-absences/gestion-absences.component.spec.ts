import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAbsencesComponent } from './gestion-absences.component';

describe('GestionAbsencesComponent', () => {
  let component: GestionAbsencesComponent;
  let fixture: ComponentFixture<GestionAbsencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionAbsencesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionAbsencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
