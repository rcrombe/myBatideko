import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningSousTraitantComponent } from './planning-sous-traitant.component';

describe('PlanningSousTraitantComponent', () => {
  let component: PlanningSousTraitantComponent;
  let fixture: ComponentFixture<PlanningSousTraitantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanningSousTraitantComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningSousTraitantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
