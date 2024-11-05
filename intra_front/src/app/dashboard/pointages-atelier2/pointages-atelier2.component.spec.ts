import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointagesAtelier2Component } from './pointages-atelier2.component';

describe('PointagesAtelier2Component', () => {
  let component: PointagesAtelier2Component;
  let fixture: ComponentFixture<PointagesAtelier2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointagesAtelier2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointagesAtelier2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
