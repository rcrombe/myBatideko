import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionSynchronisationComponent } from './gestion-synchronisation.component';

describe('GestionSynchronisationComponent', () => {
  let component: GestionSynchronisationComponent;
  let fixture: ComponentFixture<GestionSynchronisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionSynchronisationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionSynchronisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
