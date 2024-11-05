import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPointagesComponent } from './gestion-pointages.component';

describe('GestionPointagesComponent', () => {
  let component: GestionPointagesComponent;
  let fixture: ComponentFixture<GestionPointagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionPointagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionPointagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
