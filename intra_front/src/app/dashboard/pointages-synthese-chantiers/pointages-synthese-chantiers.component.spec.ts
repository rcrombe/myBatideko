import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointagesSyntheseChantiersComponent } from './pointages-synthese-chantiers.component';

describe('PointagesSyntheseChantiersComponent', () => {
  let component: PointagesSyntheseChantiersComponent;
  let fixture: ComponentFixture<PointagesSyntheseChantiersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointagesSyntheseChantiersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointagesSyntheseChantiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
