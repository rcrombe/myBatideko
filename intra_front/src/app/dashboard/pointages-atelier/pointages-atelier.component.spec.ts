import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointagesAtelierComponent } from './pointages-atelier.component';

describe('PointagesAtelierComponent', () => {
  let component: PointagesAtelierComponent;
  let fixture: ComponentFixture<PointagesAtelierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointagesAtelierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointagesAtelierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
