import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningAtelierComponent } from './planning-atelier.component';

describe('PlanningAtelierComponent', () => {
  let component: PlanningAtelierComponent;
  let fixture: ComponentFixture<PlanningAtelierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanningAtelierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningAtelierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
