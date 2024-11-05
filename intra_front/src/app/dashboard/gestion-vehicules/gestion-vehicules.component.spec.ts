import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionVehiculesComponent } from './gestion-vehicules.component';

describe('GestionVehiculesComponent', () => {
  let component: GestionVehiculesComponent;
  let fixture: ComponentFixture<GestionVehiculesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionVehiculesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionVehiculesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
