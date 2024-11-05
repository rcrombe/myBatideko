import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeMoisComponent } from './home-mois.component';

describe('HomeMoisComponent', () => {
  let component: HomeMoisComponent;
  let fixture: ComponentFixture<HomeMoisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeMoisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeMoisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
