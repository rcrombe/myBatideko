import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pointages2Component } from './pointages2.component';

describe('Pointages2Component', () => {
  let component: Pointages2Component;
  let fixture: ComponentFixture<Pointages2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pointages2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Pointages2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
