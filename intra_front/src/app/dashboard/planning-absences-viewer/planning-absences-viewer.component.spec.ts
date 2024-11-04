import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningAbsencesViewerComponent } from './planning-absences-viewer.component';

describe('PlanningAbsencesViewerComponent', () => {
  let component: PlanningAbsencesViewerComponent;
  let fixture: ComponentFixture<PlanningAbsencesViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanningAbsencesViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningAbsencesViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
