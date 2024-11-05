import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeAnneeComponent } from './home-annee.component';

describe('HomeAnneeComponent', () => {
  let component: HomeAnneeComponent;
  let fixture: ComponentFixture<HomeAnneeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeAnneeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeAnneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
