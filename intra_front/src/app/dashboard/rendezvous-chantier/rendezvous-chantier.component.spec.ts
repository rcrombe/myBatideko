import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RendezvousChantierComponent } from './rendezvous-chantier.component';

describe('RendezvousChantierComponent', () => {
  let component: RendezvousChantierComponent;
  let fixture: ComponentFixture<RendezvousChantierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RendezvousChantierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RendezvousChantierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
