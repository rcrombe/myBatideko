import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionResourcesComponent } from './gestion-resources.component';

describe('GestionResourcesComponent', () => {
  let component: GestionResourcesComponent;
  let fixture: ComponentFixture<GestionResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionResourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
