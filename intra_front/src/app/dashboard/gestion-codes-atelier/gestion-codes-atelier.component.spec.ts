import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCodesAtelierComponent } from './gestion-codes-atelier.component';

describe('GestionCodesAtelierComponent', () => {
  let component: GestionCodesAtelierComponent;
  let fixture: ComponentFixture<GestionCodesAtelierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionCodesAtelierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionCodesAtelierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
