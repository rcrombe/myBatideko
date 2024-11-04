import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionConducteursComponent } from './gestion-conducteurs.component';

describe('GestionConducteursComponent', () => {
  let component: GestionConducteursComponent;
  let fixture: ComponentFixture<GestionConducteursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionConducteursComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionConducteursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
