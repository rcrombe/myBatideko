import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueChantiersComponent } from './historique-chantiers.component';

describe('HistoriqueChantiersComponent', () => {
  let component: HistoriqueChantiersComponent;
  let fixture: ComponentFixture<HistoriqueChantiersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoriqueChantiersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoriqueChantiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
