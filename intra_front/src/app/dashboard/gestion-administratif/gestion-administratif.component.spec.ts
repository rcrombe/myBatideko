import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAdministratifComponent } from './gestion-administratif.component';

describe('GestionAdministratifComponent', () => {
  let component: GestionAdministratifComponent;
  let fixture: ComponentFixture<GestionAdministratifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionAdministratifComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionAdministratifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
