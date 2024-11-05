import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionOuvragesComponent } from './gestion-ouvrages.component';

describe('GestionOuvragesComponent', () => {
  let component: GestionOuvragesComponent;
  let fixture: ComponentFixture<GestionOuvragesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionOuvragesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionOuvragesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
