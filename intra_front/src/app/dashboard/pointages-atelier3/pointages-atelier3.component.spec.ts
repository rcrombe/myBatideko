import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointagesAtelier3Component } from './pointages-atelier3.component';

describe('PointagesAtelier3Component', () => {
  let component: PointagesAtelier3Component;
  let fixture: ComponentFixture<PointagesAtelier3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointagesAtelier3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointagesAtelier3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
