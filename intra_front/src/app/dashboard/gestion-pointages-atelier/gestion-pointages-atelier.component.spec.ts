import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPointagesAtelierComponent } from './gestion-pointages-atelier.component';

describe('GestionPointagesAtelierComponent', () => {
  let component: GestionPointagesAtelierComponent;
  let fixture: ComponentFixture<GestionPointagesAtelierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionPointagesAtelierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionPointagesAtelierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
