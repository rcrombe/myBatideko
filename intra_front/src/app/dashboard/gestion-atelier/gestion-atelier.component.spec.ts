import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAtelierComponent } from './gestion-atelier.component';

describe('GestionAtelierComponent', () => {
  let component: GestionAtelierComponent;
  let fixture: ComponentFixture<GestionAtelierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionAtelierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionAtelierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
