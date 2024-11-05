import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAlertesComponent } from './gestion-alertes.component';

describe('GestionAlertesComponent', () => {
  let component: GestionAlertesComponent;
  let fixture: ComponentFixture<GestionAlertesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionAlertesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionAlertesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
