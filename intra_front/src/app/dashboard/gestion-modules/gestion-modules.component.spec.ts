import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionModulesComponent } from './gestion-modules.component';

describe('GestionModulesComponent', () => {
  let component: GestionModulesComponent;
  let fixture: ComponentFixture<GestionModulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionModulesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
