import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointagesSyntheseComponent } from './pointages-synthese.component';

describe('PointagesSyntheseComponent', () => {
  let component: PointagesSyntheseComponent;
  let fixture: ComponentFixture<PointagesSyntheseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointagesSyntheseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointagesSyntheseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
