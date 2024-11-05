import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pointages3Component } from './pointages3.component';

describe('Pointages3Component', () => {
  let component: Pointages3Component;
  let fixture: ComponentFixture<Pointages3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pointages3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Pointages3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
