import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningParChantierComponent } from './planning-par-chantier.component';

describe('PlanningParChantierComponent', () => {
  let component: PlanningParChantierComponent;
  let fixture: ComponentFixture<PlanningParChantierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanningParChantierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningParChantierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
